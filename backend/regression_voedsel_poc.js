const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: {
    skus: [
      'IOE-FOOD-PACK-1PD-BASIC',
      'IOE-CAN-OPENER-BASIC',
      'IOE-COOKER-OUTDOOR-GAS-BASIC',
      'IOE-FUEL-GAS-230G-BASIC',
      'IOE-IGNITION-LIGHTER-BASIC',
      'IOE-COOK-POT-BASIC',
    ],
    food: 'IOE-FOOD-PACK-1PD-BASIC',
    opener: 'IOE-CAN-OPENER-BASIC',
    stove: 'IOE-COOKER-OUTDOOR-GAS-BASIC',
    fuel: 'IOE-FUEL-GAS-230G-BASIC',
    ignition: 'IOE-IGNITION-LIGHTER-BASIC',
    vessel: 'IOE-COOK-POT-BASIC',
    fuelQty: 1,
    forbidden: ['IOE-FOOD-PACK-1PD-PLUS', 'IOE-MULTITOOL-CAN-OPENER-PLUS', 'IOE-COOKER-OUTDOOR-GAS-PLUS'],
  },
  basis_plus: {
    skus: [
      'IOE-FOOD-PACK-1PD-PLUS',
      'IOE-MULTITOOL-CAN-OPENER-PLUS',
      'IOE-COOKER-OUTDOOR-GAS-PLUS',
      'IOE-FUEL-GAS-230G-PLUS',
      'IOE-IGNITION-STORM-LIGHTER-PLUS',
      'IOE-COOK-SET-PLUS',
    ],
    food: 'IOE-FOOD-PACK-1PD-PLUS',
    opener: 'IOE-MULTITOOL-CAN-OPENER-PLUS',
    stove: 'IOE-COOKER-OUTDOOR-GAS-PLUS',
    fuel: 'IOE-FUEL-GAS-230G-PLUS',
    ignition: 'IOE-IGNITION-STORM-LIGHTER-PLUS',
    vessel: 'IOE-COOK-SET-PLUS',
    fuelQty: 2,
    forbidden: ['IOE-FOOD-PACK-1PD-BASIC', 'IOE-CAN-OPENER-BASIC', 'IOE-COOKER-OUTDOOR-GAS-BASIC'],
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
        addon_slugs: ['voedsel_bereiding'],
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
           AND a.slug = 'voedsel_bereiding'
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

  if (!result.rows.length) fail(`no voedsel_bereiding recommendation_run found for tier ${tierSlug}`);
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

async function countCoverage(client, runId, sku, need, capability) {
  const result = await client.query(
    `SELECT count(*)::int AS records
     FROM generated_line_coverage glc
     JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
     JOIN item i ON i.id = gpl.item_id
     JOIN scenario_need sn ON sn.id = glc.scenario_need_id
     JOIN need n ON n.id = sn.need_id
     JOIN capability c ON c.id = glc.capability_id
     WHERE gpl.recommendation_run_id = $1
       AND i.sku = $2
       AND n.slug = $3
       AND c.slug = $4`,
    [runId, sku, need, capability],
  );
  return result.rows[0].records;
}

async function sourceCount(client, lineId, sourceType, parentSku = null) {
  const params = [lineId, sourceType];
  let parentPredicate = '';
  if (parentSku) {
    params.push(parentSku);
    parentPredicate = `AND EXISTS (
      SELECT 1
      FROM generated_package_line parent_gpl
      JOIN item parent_i ON parent_i.id = parent_gpl.item_id
      WHERE parent_gpl.id = gls.parent_generated_package_line_id
        AND parent_i.sku = $3
    )`;
  }

  const result = await client.query(
    `SELECT count(*)::int AS records
     FROM generated_line_source gls
     WHERE gls.generated_package_line_id = $1
       AND gls.source_type = $2
       ${parentPredicate}`,
    params,
  );
  return result.rows[0].records;
}

async function itemCapability(client, sku, capability) {
  const result = await client.query(
    `SELECT ic.coverage_strength, ic.claim_type, ic.can_replace_primary
     FROM item_capability ic
     JOIN item i ON i.id = ic.item_id
     JOIN capability c ON c.id = ic.capability_id
     WHERE i.sku = $1 AND c.slug = $2`,
    [sku, capability],
  );
  return result.rows[0] || null;
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

async function checkTier(client, tierSlug) {
  const expected = EXPECTED[tierSlug];
  const runId = await latestRun(client, tierSlug);
  const lines = await generatedLines(client, runId);
  const skus = lines.map((line) => line.sku);

  assertSameSet(skus, expected.skus, `${tierSlug} voedsel generated SKUs`);
  for (const forbiddenSku of expected.forbidden) {
    if (skus.includes(forbiddenSku)) fail(`${tierSlug} unexpectedly includes ${forbiddenSku}`);
  }

  const bySku = new Map(lines.map((line) => [line.sku, line]));
  assertEqual(bySku.get(expected.food)?.quantity, 6, `${tierSlug} food quantity`);
  assertEqual(bySku.get(expected.fuel)?.quantity, expected.fuelQty, `${tierSlug} fuel quantity`);
  assertEqual(bySku.get(expected.stove)?.quantity, 1, `${tierSlug} stove quantity`);
  assertEqual(bySku.get(expected.ignition)?.quantity, 1, `${tierSlug} ignition quantity`);
  assertEqual(bySku.get(expected.vessel)?.quantity, 1, `${tierSlug} vessel quantity`);
  assertEqual(bySku.get(expected.opener)?.quantity, 1, `${tierSlug} opener quantity`);

  const foodCoverage = await coverageRow(client, runId, expected.food, 'voedselzekerheid-72u', 'houdbaar-voedsel-persoonsdag');
  assertTruthy(foodCoverage?.counted_as_sufficient, `${tierSlug} food is not sufficient for person-day coverage`);
  assertEqual(foodCoverage.coverage_strength, 'primary', `${tierSlug} food coverage strength`);

  const noCookCoverage = await coverageRow(client, runId, expected.food, 'eetbaar-zonder-koken', 'eetbaar-zonder-koken');
  assertTruthy(noCookCoverage?.counted_as_sufficient, `${tierSlug} food is not no-cook sufficient`);

  const noFridgeCoverage = await coverageRow(client, runId, expected.food, 'houdbaar-zonder-koeling', 'geen-koeling-nodig');
  assertTruthy(noFridgeCoverage?.counted_as_sufficient, `${tierSlug} food is not no-refrigeration sufficient`);

  const openerCoverage = await coverageRow(client, runId, expected.opener, 'blikopenen', 'blikopenen');
  assertTruthy(openerCoverage?.counted_as_sufficient, `${tierSlug} can opening is not covered`);

  const openerCapability = await itemCapability(client, expected.opener, 'blikopenen');
  assertEqual(openerCapability?.claim_type === 'verified_spec' ? 1 : 0, 1, `${tierSlug} opener claim type`);
  if (tierSlug === 'basis_plus' && skus.includes('IOE-CAN-OPENER-BASIC')) {
    fail('Basis+ includes dedicated can opener even though verified multitool is selected');
  }

  const stoveCoverage = await coverageRow(client, runId, expected.stove, 'voedsel-verwarmen-ondersteunend', 'buiten-verwarmen-koken');
  assertTruthy(stoveCoverage, `${tierSlug} stove has no cooking coverage row`);
  assertEqual(stoveCoverage.coverage_strength, 'secondary', `${tierSlug} stove coverage must be secondary/supporting`);
  if (stoveCoverage.coverage_strength === 'primary') fail(`${tierSlug} stove is primary coverage`);

  const foodCapability = 'houdbaar-voedsel-persoonsdag';
  for (const sku of [expected.stove, expected.fuel, expected.ignition, expected.vessel]) {
    assertEqual(await countCoverage(client, runId, sku, 'voedselzekerheid-72u', foodCapability), 0, `${tierSlug} ${sku} must not cover food person-days`);
  }

  assertTruthy(bySku.get(expected.fuel)?.is_accessory, `${tierSlug} fuel is not generated as accessory`);
  assertTruthy(bySku.get(expected.ignition)?.is_accessory, `${tierSlug} ignition is not generated as accessory`);
  assertTruthy(bySku.get(expected.vessel)?.is_accessory, `${tierSlug} vessel is not generated as accessory`);

  assertEqual(await sourceCount(client, bySku.get(expected.fuel).id, 'accessory_requirement', expected.stove), 1, `${tierSlug} fuel accessory source`);
  assertEqual(await sourceCount(client, bySku.get(expected.ignition).id, 'accessory_requirement', expected.stove), 1, `${tierSlug} ignition accessory source`);
  assertEqual(await sourceCount(client, bySku.get(expected.vessel).id, 'accessory_requirement', expected.stove), 1, `${tierSlug} vessel accessory source`);

  assertTruthy(bySku.get(expected.food).explanation_public.includes('zonder koken'), `${tierSlug} food explanation misses no-cook copy`);
  assertTruthy(bySku.get(expected.stove).explanation_public.includes('alleen voor buitengebruik'), `${tierSlug} stove explanation misses outdoor-only copy`);
  assertTruthy(!bySku.get(expected.stove).explanation_public.includes('binnen gebruiken'), `${tierSlug} stove explanation suggests indoor use`);

  assertEqual(await usageCount(client, expected.stove, ['indoor_use', 'ventilation', 'fire_risk']), 3, `${tierSlug} stove usage constraints`);
  assertEqual(await usageCount(client, expected.fuel, ['fuel_compatibility', 'child_safety', 'storage_safety']), 3, `${tierSlug} fuel usage constraints`);

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

    console.log('Voedsel POC regression baseline OK');
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
