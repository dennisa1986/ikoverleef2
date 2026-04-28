const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: [
    'IOE-PB-10K-BASIC',
    'IOE-HEADLAMP-AAA-BASIC',
    'IOE-LANTERN-AA-BASIC',
    'IOE-RADIO-AA-BASIC',
    'IOE-CABLE-USBC-BASIC',
    'IOE-BATT-AAA-12-BASIC',
    'IOE-BATT-AA-12-BASIC',
  ],
  basis_plus: [
    'IOE-PB-20K-PLUS',
    'IOE-HEADLAMP-AAA-PLUS',
    'IOE-LANTERN-AA-PLUS',
    'IOE-RADIO-AAUSB-PLUS',
    'IOE-CABLE-USBC-SET',
    'IOE-BATT-AAA-12',
    'IOE-BATT-AA-12',
  ],
};

const AA_SKU = {
  basis: 'IOE-BATT-AA-12-BASIC',
  basis_plus: 'IOE-BATT-AA-12',
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
  if (actual !== expected) {
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
     ORDER BY rr.created_at DESC
     LIMIT 1`,
    [tierSlug],
  );

  if (!result.rows.length) fail(`no recommendation_run found for tier ${tierSlug}`);
  return result.rows[0].id;
}

async function generatedLines(client, runId) {
  const result = await client.query(
    `SELECT gpl.id, i.sku
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

async function checkTier(client, tierSlug) {
  const runId = await latestRun(client, tierSlug);
  const lines = await generatedLines(client, runId);
  const skus = lines.map((line) => line.sku);

  assertSameSet(skus, EXPECTED[tierSlug], `${tierSlug} generated SKUs`);

  if (tierSlug === 'basis') {
    if (!skus.includes('IOE-PB-10K-BASIC')) fail('Basis does not include IOE-PB-10K-BASIC');
    if (skus.includes('IOE-PB-20K-PLUS')) fail('Basis unexpectedly includes IOE-PB-20K-PLUS');
  }

  if (tierSlug === 'basis_plus') {
    if (!skus.includes('IOE-PB-20K-PLUS')) fail('Basis+ does not include IOE-PB-20K-PLUS');
    if (skus.includes('IOE-PB-10K-BASIC')) fail('Basis+ unexpectedly includes IOE-PB-10K-BASIC');
  }

  const aaLines = lines.filter((line) => line.sku === AA_SKU[tierSlug]);
  assertEqual(aaLines.length, 1, `${tierSlug} AA battery line count`);

  const sources = await client.query(
    `SELECT count(*)::int AS records
     FROM generated_line_source
     WHERE generated_package_line_id = $1`,
    [aaLines[0].id],
  );
  assertEqual(sources.rows[0].records, 2, `${tierSlug} AA battery source count`);

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

    console.log('Stroomuitval POC regression baseline OK');
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
