const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED_TASKS = [
  'baby-benodigdheden-check',
  'documenten-en-contacten-controleren',
  'duur-en-huishouden-controleren',
  'houdbaarheid-en-batterijen-controleren',
  'huisdieren-water-voer-check',
  'kinderen-benodigdheden-check',
  'pakketadvies-periodiek-herzien',
  'persoonlijke-medicatie-controleren',
  'sleutels-cash-laders-controleren',
];

const BLOCKING_QA_VIEWS = [
  'qa_active_scenarios_without_needs',
  'qa_active_needs_without_capabilities',
  'qa_scenario_needs_without_product_rules',
  'qa_product_types_without_capabilities',
  'qa_active_items_without_capabilities',
  'qa_variant_item_product_type_mismatch',
  'qa_default_candidate_conflicts',
  'qa_items_with_claimed_primary_coverage',
  'qa_required_accessories_missing_candidate_items',
  'qa_active_consumables_without_quantity_policy',
  'qa_claim_governance_scope_invalid',
  'qa_quantity_policy_invalid_scope',
];

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;

  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = rest.join('=').trim();
    }
  }
}

function fail(message) {
  throw new Error(message);
}

function assertEqual(actual, expected, label) {
  if (String(actual) !== String(expected)) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertTruthy(value, label) {
  if (!value) fail(label);
}

function assertSameSet(actual, expected, label) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (actualSorted.length !== expectedSorted.length) {
    fail(`${label}: expected ${expectedSorted.length}, got ${actualSorted.length}: ${actualSorted.join(', ')}`);
  }

  for (let i = 0; i < expectedSorted.length; i += 1) {
    if (actualSorted[i] !== expectedSorted[i]) {
      fail(`${label}: expected [${expectedSorted.join(', ')}], got [${actualSorted.join(', ')}]`);
    }
  }
}

async function runEngine(input) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  if (!process.env.IOE_REGRESSION_VERBOSE) {
    console.log = () => {};
    console.warn = () => {};
  }

  try {
    await calculateRecommendation(input, { throwOnError: true });
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

async function latestRunWithExactAddons(client, input) {
  const addonCount = input.addon_slugs.length;
  const result = await client.query(
    `SELECT rr.id
     FROM recommendation_run rr
     JOIN package p ON p.id = rr.package_id
     JOIN tier t ON t.id = rr.tier_id
     WHERE p.slug = $1
       AND t.slug = $2
       AND rr.duration_hours = $3
       AND rr.household_adults = $4
       AND rr.household_children = $5
       AND rr.household_pets = $6
       AND (
         SELECT count(DISTINCT a.slug)
         FROM recommendation_run_addon rra
         JOIN addon a ON a.id = rra.addon_id
         WHERE rra.recommendation_run_id = rr.id
           AND a.slug = ANY($7)
       ) = $8
       AND (
         SELECT count(*)
         FROM recommendation_run_addon rra
         WHERE rra.recommendation_run_id = rr.id
       ) = $8
     ORDER BY rr.created_at DESC
     LIMIT 1`,
    [
      input.package_slug,
      input.tier_slug,
      input.duration_hours,
      input.household_adults,
      input.household_children,
      input.household_pets,
      input.addon_slugs,
      addonCount,
    ],
  );

  if (!result.rows.length) fail(`no run found for addons=${input.addon_slugs.join(',')} tier=${input.tier_slug}`);
  return result.rows[0].id;
}

async function generatedLines(client, runId) {
  const result = await client.query(
    `SELECT i.sku, pt.slug AS product_type_slug, gpl.quantity
     FROM generated_package_line gpl
     JOIN item i ON i.id = gpl.item_id
     JOIN product_type pt ON pt.id = gpl.product_type_id
     WHERE gpl.recommendation_run_id = $1
     ORDER BY i.sku`,
    [runId],
  );
  return result.rows;
}

async function activeTasksForRun(client, runId) {
  const result = await client.query(
    `WITH run_context AS (
        SELECT rr.id, rr.package_id
        FROM recommendation_run rr
        WHERE rr.id = $1
      ),
      active_scenarios AS (
        SELECT ps.scenario_id
        FROM package_scenario ps
        JOIN run_context rc ON rc.package_id = ps.package_id
        UNION
        SELECT ag.scenario_id
        FROM recommendation_run_addon rra
        JOIN addon_scenario ag ON ag.addon_id = rra.addon_id
        JOIN run_context rc ON rc.id = rra.recommendation_run_id
      )
      SELECT pt.task_slug, pt.title, pt.description_public, pt.internal_notes, n.slug AS need_slug
      FROM preparedness_task pt
      JOIN scenario_need sn ON sn.id = pt.scenario_need_id
      JOIN need n ON n.id = sn.need_id
      JOIN active_scenarios act ON act.scenario_id = sn.scenario_id
      WHERE pt.status = 'active'
      ORDER BY pt.task_slug`,
    [runId],
  );
  return result.rows;
}

async function countView(client, viewName) {
  const result = await client.query(`SELECT count(*)::int AS records FROM ${viewName}`);
  return result.rows[0].records;
}

function assertNoForbiddenPersonalProducts(lines, label) {
  const forbiddenPatterns = [
    /MEDICATION/i,
    /DOCUMENT/i,
    /CONTACT/i,
    /CASH/i,
    /KEY/i,
    /BABY/i,
    /PET/i,
    /HUISDIER/i,
  ];

  for (const line of lines) {
    if (forbiddenPatterns.some((pattern) => pattern.test(line.sku) || pattern.test(line.product_type_slug))) {
      fail(`${label} contains forbidden personal product line ${line.sku} (${line.product_type_slug})`);
    }
  }
}

function assertTaskTexts(tasks) {
  const bySlug = new Map(tasks.map((task) => [task.task_slug, task]));
  assertTruthy(bySlug.has('duur-en-huishouden-controleren'), 'profile duration task missing');
  assertTruthy(bySlug.has('persoonlijke-medicatie-controleren'), 'medication check task missing');
  assertTruthy(bySlug.has('documenten-en-contacten-controleren'), 'documents/contacts task missing');
  assertTruthy(bySlug.has('huisdieren-water-voer-check'), 'pet task missing');
  assertTruthy(bySlug.has('kinderen-benodigdheden-check'), 'children task missing');

  assertTruthy(bySlug.get('huisdieren-water-voer-check').description_public.toLowerCase().includes('indien van toepassing'), 'pet task must be framed as indien van toepassing');
  assertTruthy(bySlug.get('kinderen-benodigdheden-check').description_public.toLowerCase().includes('indien van toepassing'), 'children task must be framed as indien van toepassing');
  assertTruthy(bySlug.get('baby-benodigdheden-check').description_public.toLowerCase().includes('indien van toepassing'), 'baby task must be framed as indien van toepassing');
}

async function checkTaskOnlyRun(client, tierSlug) {
  const input = {
    ...DEFAULT_INPUT,
    tier_slug: tierSlug,
    addon_slugs: ['taken_profielen'],
    duration_hours: 72,
    household_adults: 2,
    household_children: 0,
    household_pets: 0,
  };

  await runEngine(input);
  const runId = await latestRunWithExactAddons(client, input);
  const lines = await generatedLines(client, runId);
  const tasks = await activeTasksForRun(client, runId);

  assertEqual(lines.length, 0, `${tierSlug} taken_profielen should not generate product lines`);
  assertSameSet(tasks.map((task) => task.task_slug), EXPECTED_TASKS, `${tierSlug} task slugs`);
  assertTaskTexts(tasks);

  return { runId, taskCount: tasks.length };
}

async function checkProfileComboRun(client) {
  const input = {
    ...DEFAULT_INPUT,
    tier_slug: 'basis_plus',
    addon_slugs: ['drinkwater', 'taken_profielen'],
    duration_hours: 72,
    household_adults: 2,
    household_children: 1,
    household_pets: 1,
  };

  await runEngine(input);
  const runId = await latestRunWithExactAddons(client, input);
  const lines = await generatedLines(client, runId);
  const tasks = await activeTasksForRun(client, runId);

  assertTruthy(lines.length > 0, 'profile combo run must still generate existing product lines');
  assertNoForbiddenPersonalProducts(lines, 'profile combo run');
  assertSameSet(tasks.map((task) => task.task_slug), EXPECTED_TASKS, 'profile combo task slugs');
  assertTaskTexts(tasks);

  const bySku = new Map(lines.map((line) => [line.sku, line]));
  assertEqual(bySku.get('IOE-WATER-PACK-6L-PLUS')?.quantity, 4, 'profile combo water pack quantity');
  assertEqual(bySku.get('IOE-JERRYCAN-20L-PLUS')?.quantity, 1, 'profile combo jerrycan quantity');
  assertEqual(bySku.get('IOE-WATERFILTER-PLUS')?.quantity, 1, 'profile combo waterfilter quantity');
  assertEqual(bySku.get('IOE-WATER-TABS-PLUS')?.quantity, 1, 'profile combo watertabs quantity');

  return { runId, skus: lines.map((line) => line.sku) };
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const client = new Client({ connectionString: process.env.IOE_PG_URL });
  await client.connect();
  try {
    const basis = await checkTaskOnlyRun(client, 'basis');
    const basisPlus = await checkTaskOnlyRun(client, 'basis_plus');
    const combo = await checkProfileComboRun(client);

    assertEqual(await countView(client, 'qa_generated_lines_without_sources'), 0, 'qa_generated_lines_without_sources');
    assertEqual(await countView(client, 'qa_generated_line_product_type_mismatch'), 0, 'qa_generated_line_product_type_mismatch');
    for (const viewName of BLOCKING_QA_VIEWS) {
      assertEqual(await countView(client, viewName), 0, viewName);
    }

    console.log(`taken_profielen regression passed (basis run ${basis.runId}, basis_plus run ${basisPlus.runId}, combo run ${combo.runId})`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
