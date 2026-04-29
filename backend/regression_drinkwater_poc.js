const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: {
    skus: [
      'IOE-WATER-PACK-6L-BASIC',
      'IOE-JERRYCAN-10L-BASIC',
      'IOE-WATERFILTER-BASIC',
      'IOE-WATER-TABS-BASIC',
    ],
    waterPack: 'IOE-WATER-PACK-6L-BASIC',
    jerrycan: 'IOE-JERRYCAN-10L-BASIC',
    forbidden: ['IOE-WATER-PACK-6L-PLUS', 'IOE-JERRYCAN-20L-PLUS', 'IOE-WATERFILTER-PLUS', 'IOE-WATER-TABS-PLUS'],
  },
  basis_plus: {
    skus: [
      'IOE-WATER-PACK-6L-PLUS',
      'IOE-JERRYCAN-20L-PLUS',
      'IOE-WATERFILTER-PLUS',
      'IOE-WATER-TABS-PLUS',
    ],
    waterPack: 'IOE-WATER-PACK-6L-PLUS',
    jerrycan: 'IOE-JERRYCAN-20L-PLUS',
    forbidden: ['IOE-WATER-PACK-6L-BASIC', 'IOE-JERRYCAN-10L-BASIC', 'IOE-WATERFILTER-BASIC', 'IOE-WATER-TABS-BASIC'],
  },
};

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
  if (Number(actual) !== Number(expected)) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertSameSet(actual, expected, label) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (actualSorted.length !== expectedSorted.length) {
    fail(`${label}: expected ${expectedSorted.length} SKUs, got ${actualSorted.length}: ${actualSorted.join(', ')}`);
  }

  for (let i = 0; i < expectedSorted.length; i += 1) {
    if (actualSorted[i] !== expectedSorted[i]) {
      fail(`${label}: expected [${expectedSorted.join(', ')}], got [${actualSorted.join(', ')}]`);
    }
  }
}

async function runEngine(tierSlug) {
  const originalLog = console.log;
  if (!process.env.IOE_REGRESSION_VERBOSE) {
    console.log = () => {};
  }

  try {
    await calculateRecommendation(
      {
        ...DEFAULT_INPUT,
        tier_slug: tierSlug,
        addon_slugs: ['drinkwater'],
        duration_hours: 72,
        household_adults: 2,
        household_children: 0,
        household_pets: 0,
      },
      { throwOnError: true },
    );
  } finally {
    console.log = originalLog;
  }
}

async function latestRun(client, tierSlug) {
  const result = await client.query(
    `SELECT rr.id
     FROM recommendation_run rr
     JOIN package p ON p.id = rr.package_id
     JOIN tier t ON t.id = rr.tier_id
     WHERE p.slug = 'basispakket'
       AND t.slug = $1
       AND rr.duration_hours = 72
       AND rr.household_adults = 2
       AND rr.household_children = 0
       AND rr.household_pets = 0
       AND (
         SELECT count(DISTINCT a.slug)
         FROM recommendation_run_addon rra
         JOIN addon a ON a.id = rra.addon_id
         WHERE rra.recommendation_run_id = rr.id
           AND a.slug = 'drinkwater'
       ) = 1
       AND (
         SELECT count(*)
         FROM recommendation_run_addon rra
         WHERE rra.recommendation_run_id = rr.id
       ) = 1
     ORDER BY rr.created_at DESC
     LIMIT 1`,
    [tierSlug],
  );

  if (!result.rows.length) fail(`no drinkwater recommendation_run found for tier ${tierSlug}`);
  return result.rows[0].id;
}

async function generatedLines(client, runId) {
  const result = await client.query(
    `SELECT gpl.id, i.sku, gpl.quantity
     FROM generated_package_line gpl
     JOIN item i ON i.id = gpl.item_id
     WHERE gpl.recommendation_run_id = $1
     ORDER BY i.sku`,
    [runId],
  );
  return result.rows;
}

async function countView(client, viewName) {
  const result = await client.query(`SELECT count(*)::int AS records FROM ${viewName}`);
  return result.rows[0].records;
}

async function coverageRow(client, runId, sku, capability) {
  const result = await client.query(
    `SELECT glc.coverage_strength, glc.counted_as_sufficient
     FROM generated_line_coverage glc
     JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
     JOIN item i ON i.id = gpl.item_id
     JOIN capability c ON c.id = glc.capability_id
     WHERE gpl.recommendation_run_id = $1
       AND i.sku = $2
       AND c.slug = $3
     LIMIT 1`,
    [runId, sku, capability],
  );
  return result.rows[0] || null;
}

async function assertNoCoverage(client, runId, sku, capability, label) {
  const row = await coverageRow(client, runId, sku, capability);
  if (row) fail(`${label}: unexpected coverage for ${sku} / ${capability}`);
}

async function checkTier(client, tierSlug) {
  const expected = EXPECTED[tierSlug];
  const runId = await latestRun(client, tierSlug);
  const lines = await generatedLines(client, runId);
  const skus = lines.map((line) => line.sku);

  assertSameSet(skus, expected.skus, `${tierSlug} drinkwater generated SKUs`);
  for (const forbiddenSku of expected.forbidden) {
    if (skus.includes(forbiddenSku)) fail(`${tierSlug} unexpectedly includes ${forbiddenSku}`);
  }

  const bySku = new Map(lines.map((line) => [line.sku, line]));
  assertEqual(bySku.get(expected.waterPack)?.quantity, 3, `${tierSlug} waterpack quantity`);
  assertEqual(bySku.get(expected.jerrycan)?.quantity, 1, `${tierSlug} jerrycan quantity`);

  const waterPackCoverage = await coverageRow(client, runId, expected.waterPack, 'drinkwater-voorraad-houden');
  if (!waterPackCoverage?.counted_as_sufficient) fail(`${tierSlug} waterpack is not sufficient for drinkwater-voorraad-houden`);

  const jerrycanCoverage = await coverageRow(client, runId, expected.jerrycan, 'drinkwater-opslaan');
  if (!jerrycanCoverage?.counted_as_sufficient) fail(`${tierSlug} jerrycan is not sufficient for drinkwater-opslaan`);

  const filterSku = tierSlug === 'basis' ? 'IOE-WATERFILTER-BASIC' : 'IOE-WATERFILTER-PLUS';
  const tabsSku = tierSlug === 'basis' ? 'IOE-WATER-TABS-BASIC' : 'IOE-WATER-TABS-PLUS';
  await assertNoCoverage(client, runId, filterSku, 'drinkwater-opslaan', `${tierSlug} filter replacement check`);
  await assertNoCoverage(client, runId, tabsSku, 'drinkwater-voorraad-houden', `${tierSlug} tablets replacement check`);

  return { tierSlug, runId, skus };
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) fail('IOE_PG_URL is not configured');

  await runEngine('basis');
  await runEngine('basis_plus');

  const client = new Client({ connectionString: process.env.IOE_PG_URL });
  await client.connect();
  try {
    const basis = await checkTier(client, 'basis');
    const basisPlus = await checkTier(client, 'basis_plus');

    assertEqual(await countView(client, 'qa_generated_lines_without_sources'), 0, 'qa_generated_lines_without_sources');
    assertEqual(await countView(client, 'qa_generated_line_product_type_mismatch'), 0, 'qa_generated_line_product_type_mismatch');

    let blockingTotal = 0;
    for (const viewName of BLOCKING_QA_VIEWS) {
      blockingTotal += await countView(client, viewName);
    }
    assertEqual(blockingTotal, 0, 'blocking QA total');

    console.log('Drinkwater POC regression baseline OK');
    console.log(`Basis run: ${basis.runId}`);
    console.log(`Basis SKUs: ${basis.skus.join(', ')}`);
    console.log(`Basis+ run: ${basisPlus.runId}`);
    console.log(`Basis+ SKUs: ${basisPlus.skus.join(', ')}`);
    console.log('QA: generated lines without sources = 0, product type mismatch = 0, blocking total = 0');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Regression failed: ${error.message}`);
  process.exit(1);
});
