const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: {
    skus: [
      'IOE-BATT-AAA-12-BASIC',
      'IOE-BOTTLE-1L-BASIC',
      'IOE-DOC-FOLDER-BASIC',
      'IOE-EVAC-BAG-BASIC',
      'IOE-HEADLAMP-AAA-BASIC',
      'IOE-REFLECTIVE-VEST-BASIC',
      'IOE-WHISTLE-BASIC',
    ],
    bag: 'IOE-EVAC-BAG-BASIC',
    docFolder: 'IOE-DOC-FOLDER-BASIC',
    whistle: 'IOE-WHISTLE-BASIC',
    vest: 'IOE-REFLECTIVE-VEST-BASIC',
    headlamp: 'IOE-HEADLAMP-AAA-BASIC',
    batteries: 'IOE-BATT-AAA-12-BASIC',
    bottle: 'IOE-BOTTLE-1L-BASIC',
    filterBottle: null,
    forbidden: ['IOE-EVAC-BAG-PLUS', 'IOE-DOC-FOLDER-PLUS', 'IOE-FILTERBOTTLE-PLUS'],
  },
  basis_plus: {
    skus: [
      'IOE-BATT-AAA-12',
      'IOE-BOTTLE-1L-PLUS',
      'IOE-DOC-FOLDER-PLUS',
      'IOE-EVAC-BAG-PLUS',
      'IOE-FILTERBOTTLE-PLUS',
      'IOE-HEADLAMP-AAA-PLUS',
      'IOE-REFLECTIVE-VEST-PLUS',
      'IOE-WHISTLE-PLUS',
    ],
    bag: 'IOE-EVAC-BAG-PLUS',
    docFolder: 'IOE-DOC-FOLDER-PLUS',
    whistle: 'IOE-WHISTLE-PLUS',
    vest: 'IOE-REFLECTIVE-VEST-PLUS',
    headlamp: 'IOE-HEADLAMP-AAA-PLUS',
    batteries: 'IOE-BATT-AAA-12',
    bottle: 'IOE-BOTTLE-1L-PLUS',
    filterBottle: 'IOE-FILTERBOTTLE-PLUS',
    forbidden: ['IOE-EVAC-BAG-BASIC', 'IOE-DOC-FOLDER-BASIC', 'IOE-WHISTLE-BASIC'],
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
  const originalWarn = console.warn;
  if (!process.env.IOE_REGRESSION_VERBOSE) {
    console.log = () => {};
    console.warn = () => {};
  }

  try {
    await calculateRecommendation(
      {
        ...DEFAULT_INPUT,
        tier_slug: tierSlug,
        addon_slugs: ['evacuatie'],
        duration_hours: 72,
        household_adults: 2,
        household_children: 0,
        household_pets: 0,
      },
      { throwOnError: true },
    );
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
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
           AND a.slug = 'evacuatie'
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

  if (!result.rows.length) fail(`no evacuatie recommendation_run found for tier ${tierSlug}`);
  return result.rows[0].id;
}

async function generatedLines(client, runId) {
  const result = await client.query(
    `SELECT gpl.id, i.sku, i.title, gpl.quantity, gpl.is_accessory, gpl.is_core_line,
            gpl.explanation_public, gpl.explanation_internal, pt.slug AS product_type_slug
     FROM generated_package_line gpl
     JOIN item i ON i.id = gpl.item_id
     JOIN product_type pt ON pt.id = gpl.product_type_id
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

async function coverageRow(client, runId, sku, need, capability) {
  const result = await client.query(
    `SELECT glc.coverage_strength, glc.counted_as_sufficient, glc.notes
     FROM generated_line_coverage glc
     JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
     JOIN item i ON i.id = gpl.item_id
     JOIN scenario_need sn ON sn.id = glc.scenario_need_id
     JOIN need n ON n.id = sn.need_id
     JOIN capability c ON c.id = glc.capability_id
     WHERE gpl.recommendation_run_id = $1
       AND i.sku = $2
       AND n.slug = $3
       AND c.slug = $4
     LIMIT 1`,
    [runId, sku, need, capability],
  );
  return result.rows[0] || null;
}

async function coverageNeedsForSku(client, runId, sku) {
  const result = await client.query(
    `SELECT DISTINCT n.slug
     FROM generated_line_coverage glc
     JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
     JOIN item i ON i.id = gpl.item_id
     JOIN scenario_need sn ON sn.id = glc.scenario_need_id
     JOIN need n ON n.id = sn.need_id
     WHERE gpl.recommendation_run_id = $1
       AND i.sku = $2
     ORDER BY n.slug`,
    [runId, sku],
  );
  return result.rows.map((row) => row.slug);
}

async function usageCount(client, sku, constraintTypes) {
  const result = await client.query(
    `SELECT count(DISTINCT iuc.constraint_type)::int AS records
     FROM item_usage_constraint iuc
     JOIN item i ON i.id = iuc.item_id
     WHERE i.sku = $1
       AND iuc.status = 'active'
       AND iuc.constraint_type = ANY($2)`,
    [sku, constraintTypes],
  );
  return result.rows[0].records;
}

async function sourceCount(client, runId, sku, sourceType, parentSku = null) {
  const params = [runId, sku, sourceType];
  let parentPredicate = '';
  if (parentSku) {
    params.push(parentSku);
    parentPredicate = `AND parent_i.sku = $4`;
  }

  const result = await client.query(
    `SELECT count(*)::int AS records
     FROM generated_line_source gls
     JOIN generated_package_line gpl ON gpl.id = gls.generated_package_line_id
     JOIN item i ON i.id = gpl.item_id
     LEFT JOIN generated_package_line parent_gpl ON parent_gpl.id = gls.parent_generated_package_line_id
     LEFT JOIN item parent_i ON parent_i.id = parent_gpl.item_id
     WHERE gpl.recommendation_run_id = $1
       AND i.sku = $2
       AND gls.source_type = $3
       ${parentPredicate}`,
    params,
  );
  return result.rows[0].records;
}

async function activeTaskSlugsForRun(client, runId) {
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
      SELECT pt.task_slug
      FROM preparedness_task pt
      JOIN scenario_need sn ON sn.id = pt.scenario_need_id
      JOIN active_scenarios act ON act.scenario_id = sn.scenario_id
      WHERE pt.status = 'active'
      ORDER BY pt.task_slug`,
    [runId],
  );
  return result.rows.map((row) => row.task_slug);
}

function assertNoForbiddenSku(skus, tierSlug) {
  const forbiddenPrefixes = [
    'IOE-DOCUMENTS-',
    'IOE-ID-',
    'IOE-PASSPORT-',
    'IOE-CASH-',
    'IOE-KEYS-',
    'IOE-PERSONAL-MEDICATION-',
    'IOE-CONTACTS-',
  ];

  for (const sku of skus) {
    if (forbiddenPrefixes.some((prefix) => sku.startsWith(prefix))) {
      fail(`${tierSlug} generated forbidden evacuation/document SKU ${sku}`);
    }
  }
}

function assertNoEvacuationOverclaim(line, tierSlug) {
  const copy = `${line.explanation_public || ''} ${line.explanation_internal || ''}`.toLowerCase();
  const forbidden = [
    'garandeert een veilige evacuatie',
    'alles wat je nodig hebt zit automatisch in deze tas',
    'garandeert redding',
    'maakt je altijd zichtbaar',
    'filtert elk water automatisch veilig',
    'persoonlijke medicatie is automatisch geregeld',
    'documenten zijn automatisch compleet',
  ];

  for (const phrase of forbidden) {
    if (copy.includes(phrase)) fail(`${tierSlug} ${line.sku} contains overclaim phrase: ${phrase}`);
  }
}

async function checkTier(client, tierSlug) {
  const expected = EXPECTED[tierSlug];
  const runId = await latestRun(client, tierSlug);
  const lines = await generatedLines(client, runId);
  const skus = lines.map((line) => line.sku);

  assertSameSet(skus, expected.skus, `${tierSlug} evacuatie generated SKUs`);
  assertNoForbiddenSku(skus, tierSlug);
  for (const forbiddenSku of expected.forbidden) {
    if (skus.includes(forbiddenSku)) fail(`${tierSlug} unexpectedly includes ${forbiddenSku}`);
  }

  const bySku = new Map(lines.map((line) => [line.sku, line]));
  assertEqual(bySku.get(expected.bag)?.quantity, 1, `${tierSlug} evac bag quantity`);
  assertEqual(bySku.get(expected.docFolder)?.quantity, 1, `${tierSlug} document folder quantity`);
  assertEqual(bySku.get(expected.whistle)?.quantity, 2, `${tierSlug} whistle quantity`);
  assertEqual(bySku.get(expected.vest)?.quantity, 2, `${tierSlug} reflective vest quantity`);
  assertEqual(bySku.get(expected.headlamp)?.quantity, 2, `${tierSlug} headlamp quantity`);
  assertEqual(bySku.get(expected.batteries)?.quantity, 1, `${tierSlug} headlamp batteries quantity`);
  assertEqual(bySku.get(expected.bottle)?.quantity, 2, `${tierSlug} bottle quantity`);
  if (expected.filterBottle) {
    assertEqual(bySku.get(expected.filterBottle)?.quantity, 1, `${tierSlug} filter bottle quantity`);
  }

  const bagCoverageNeeds = await coverageNeedsForSku(client, runId, expected.bag);
  assertSameSet(bagCoverageNeeds, ['evacuatietas-dragen'], `${tierSlug} evac bag coverage scope`);
  const bagCoverage = await coverageRow(client, runId, expected.bag, 'evacuatietas-dragen', 'evacuatietas-gebruiken');
  assertTruthy(bagCoverage?.counted_as_sufficient, `${tierSlug} evac bag is not sufficient for carry need`);

  const docCoverage = await coverageRow(client, runId, expected.docFolder, 'documenten-beschermen', 'documenten-waterdicht-bewaren');
  assertTruthy(docCoverage?.counted_as_sufficient, `${tierSlug} document folder does not cover document protection`);

  const whistleCoverage = await coverageRow(client, runId, expected.whistle, 'hoorbaar-signaleren', 'hoorbaar-signaleren');
  assertTruthy(whistleCoverage?.counted_as_sufficient, `${tierSlug} whistle does not cover signaling`);

  const vestCoverage = await coverageRow(client, runId, expected.vest, 'zichtbaar-onderweg', 'reflecterend-zichtbaar-zijn');
  assertTruthy(vestCoverage?.counted_as_sufficient, `${tierSlug} reflective vest does not cover visibility`);

  const headlampCoverage = await coverageRow(client, runId, expected.headlamp, 'licht-onderweg', 'handsfree-licht-onderweg');
  assertTruthy(headlampCoverage?.counted_as_sufficient, `${tierSlug} headlamp does not cover light onderweg`);
  const portableLightCoverage = await coverageRow(client, runId, expected.headlamp, 'licht-onderweg', 'draagbaar-licht-onderweg');
  assertTruthy(portableLightCoverage, `${tierSlug} draagbaar licht backup coverage missing`);
  assertTruthy(await sourceCount(client, runId, expected.batteries, 'accessory_requirement', expected.headlamp) >= 1, `${tierSlug} headlamp batteries accessory source missing`);

  const bottleCoverage = await coverageRow(client, runId, expected.bottle, 'drinkwater-meenemen-evacuatie', 'drinkwater-meenemen');
  assertTruthy(bottleCoverage?.counted_as_sufficient, `${tierSlug} bottle does not cover drinkwater meenemen`);

  if (expected.filterBottle) {
    const filterCarryCoverage = await coverageRow(client, runId, expected.filterBottle, 'drinkwater-meenemen-evacuatie', 'drinkwater-meenemen');
    assertTruthy(filterCarryCoverage, `${tierSlug} filter bottle carry coverage missing`);
    assertEqual(filterCarryCoverage.counted_as_sufficient, false, `${tierSlug} filter bottle may not replace primary water carry`);

    const filterBackupCoverage = await coverageRow(client, runId, expected.filterBottle, 'drinkwater-meenemen-evacuatie', 'water-filteren-onderweg-backup');
    assertTruthy(filterBackupCoverage, `${tierSlug} filter bottle backup filter coverage missing`);
    assertEqual(filterBackupCoverage.counted_as_sufficient, false, `${tierSlug} filter bottle backup coverage must remain supporting/backup`);
  }

  const taskSlugs = await activeTaskSlugsForRun(client, runId);
  assertSameSet(
    taskSlugs,
    [
      'documenten-kopieren-en-bundelen',
      'evacuatietas-periodiek-controleren',
      'noodcontacten-noteren',
      'persoonlijke-medicatie-inpakken-check',
      'sleutels-cash-en-laders-check',
    ],
    `${tierSlug} preparedness task slugs`,
  );

  assertTruthy(await usageCount(client, expected.bag, ['storage_safety']) >= 1, `${tierSlug} evac bag usage constraint missing`);
  assertTruthy(await usageCount(client, expected.docFolder, ['storage_safety']) >= 1, `${tierSlug} document folder usage constraint missing`);
  assertTruthy(await usageCount(client, expected.headlamp, ['storage_safety']) >= 1, `${tierSlug} headlamp usage constraint missing`);
  if (expected.filterBottle) {
    assertTruthy(await usageCount(client, expected.filterBottle, ['medical_claim_limit', 'storage_safety']) >= 1, `${tierSlug} filter bottle usage constraint missing`);
  }

  for (const line of lines) {
    assertNoEvacuationOverclaim(line, tierSlug);
  }

  return { runId, skus };
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  await runEngine('basis');
  await runEngine('basis_plus');

  const client = new Client({ connectionString: process.env.IOE_PG_URL });
  await client.connect();
  try {
    const basis = await checkTier(client, 'basis');
    const basisPlus = await checkTier(client, 'basis_plus');

    assertEqual(await countView(client, 'qa_generated_lines_without_sources'), 0, 'qa_generated_lines_without_sources');
    assertEqual(await countView(client, 'qa_generated_line_product_type_mismatch'), 0, 'qa_generated_line_product_type_mismatch');
    for (const viewName of BLOCKING_QA_VIEWS) {
      assertEqual(await countView(client, viewName), 0, viewName);
    }

    console.log(`evacuatie regression passed (basis run ${basis.runId}, basis_plus run ${basisPlus.runId})`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
