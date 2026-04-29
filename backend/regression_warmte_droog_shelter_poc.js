const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: {
    skus: [
      'IOE-THERMAL-BLANKET-BASIC',
      'IOE-EMERGENCY-BLANKET-BASIC',
      'IOE-PONCHO-BASIC',
      'IOE-TARP-LIGHT-BASIC',
      'IOE-PARACORD-BASIC',
      'IOE-TARP-PEGS-BASIC',
    ],
    thermalBlanket: 'IOE-THERMAL-BLANKET-BASIC',
    emergencyBlanket: 'IOE-EMERGENCY-BLANKET-BASIC',
    poncho: 'IOE-PONCHO-BASIC',
    tarp: 'IOE-TARP-LIGHT-BASIC',
    paracord: 'IOE-PARACORD-BASIC',
    pegs: 'IOE-TARP-PEGS-BASIC',
    groundsheet: null,
    forbidden: ['IOE-THERMAL-BLANKET-PLUS', 'IOE-EMERGENCY-BIVVY-PLUS', 'IOE-GROUNDSHEET-PLUS'],
  },
  basis_plus: {
    skus: [
      'IOE-THERMAL-BLANKET-PLUS',
      'IOE-EMERGENCY-BIVVY-PLUS',
      'IOE-PONCHO-PLUS',
      'IOE-TARP-LIGHT-PLUS',
      'IOE-PARACORD-PLUS',
      'IOE-TARP-PEGS-PLUS',
      'IOE-GROUNDSHEET-PLUS',
    ],
    thermalBlanket: 'IOE-THERMAL-BLANKET-PLUS',
    emergencyBlanket: 'IOE-EMERGENCY-BIVVY-PLUS',
    poncho: 'IOE-PONCHO-PLUS',
    tarp: 'IOE-TARP-LIGHT-PLUS',
    paracord: 'IOE-PARACORD-PLUS',
    pegs: 'IOE-TARP-PEGS-PLUS',
    groundsheet: 'IOE-GROUNDSHEET-PLUS',
    forbidden: ['IOE-THERMAL-BLANKET-BASIC', 'IOE-EMERGENCY-BLANKET-BASIC', 'IOE-PONCHO-BASIC'],
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
        addon_slugs: ['warmte_droog_shelter_light'],
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
       AND EXISTS (
         SELECT 1
         FROM recommendation_run_addon rra
         JOIN addon a ON a.id = rra.addon_id
         WHERE rra.recommendation_run_id = rr.id
           AND a.slug = 'warmte_droog_shelter_light'
       )
     ORDER BY rr.created_at DESC
     LIMIT 1`,
    [tierSlug],
  );

  if (!result.rows.length) fail(`no warmte_droog_shelter_light recommendation_run found for tier ${tierSlug}`);
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

async function coverageNeedExists(client, runId, sku, need) {
  const result = await client.query(
    `SELECT 1
     FROM generated_line_coverage glc
     JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
     JOIN item i ON i.id = gpl.item_id
     JOIN scenario_need sn ON sn.id = glc.scenario_need_id
     JOIN need n ON n.id = sn.need_id
     WHERE gpl.recommendation_run_id = $1
       AND i.sku = $2
       AND n.slug = $3
     LIMIT 1`,
    [runId, sku, need],
  );
  return result.rows.length > 0;
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

async function governanceCount(client, productTypeSlug) {
  const result = await client.query(
    `SELECT count(*)::int AS records
     FROM claim_governance_rule cgr
     JOIN product_type pt ON pt.id = cgr.product_type_id
     WHERE pt.slug = $1
       AND cgr.rule_scope = 'product_type'
       AND cgr.status = 'active'`,
    [productTypeSlug],
  );
  return result.rows[0].records;
}

function assertNoOverclaim(line, tierSlug) {
  const copy = `${line.explanation_public || ''} ${line.explanation_internal || ''}`.toLowerCase();
  const forbidden = [
    'behandelt onderkoeling',
    'voorkomt onderkoeling gegarandeerd',
    'vervangt slaapzak',
    'biedt slaapcomfort',
    'poncho is een onderkomen',
    'tarp is warmtebron',
    'geschikt voor extreem weer',
    'volledige shelteroplossing',
    'professionele beschutting',
    'garandeert bescherming tegen extreem weer',
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

  assertSameSet(skus, expected.skus, `${tierSlug} warmte/droog/shelter generated SKUs`);
  for (const forbiddenSku of expected.forbidden) {
    if (skus.includes(forbiddenSku)) fail(`${tierSlug} unexpectedly includes ${forbiddenSku}`);
  }

  const bySku = new Map(lines.map((line) => [line.sku, line]));

  // Quantities: per-person items expect 2; fixed/accessory items expect 1.
  assertEqual(bySku.get(expected.thermalBlanket)?.quantity, 2, `${tierSlug} ${expected.thermalBlanket} quantity per_person`);
  assertEqual(bySku.get(expected.emergencyBlanket)?.quantity, 2, `${tierSlug} ${expected.emergencyBlanket} quantity per_person`);
  assertEqual(bySku.get(expected.poncho)?.quantity, 2, `${tierSlug} ${expected.poncho} quantity per_person`);
  assertEqual(bySku.get(expected.tarp)?.quantity, 1, `${tierSlug} ${expected.tarp} quantity fixed 1`);
  assertEqual(bySku.get(expected.paracord)?.quantity, 1, `${tierSlug} ${expected.paracord} quantity fixed 1`);
  assertEqual(bySku.get(expected.pegs)?.quantity, 1, `${tierSlug} ${expected.pegs} quantity fixed 1`);
  if (expected.groundsheet) {
    assertEqual(bySku.get(expected.groundsheet)?.quantity, 1, `${tierSlug} ${expected.groundsheet} quantity fixed 1`);
  }

  // Warmth coverage.
  const blanketCoverage = await coverageRow(client, runId, expected.thermalBlanket, 'warmte-behouden', 'warmtedeken-gebruiken');
  assertTruthy(blanketCoverage?.counted_as_sufficient, `${tierSlug} thermal blanket does not cover warmtebehoud`);
  assertEqual(blanketCoverage.coverage_strength, 'primary', `${tierSlug} thermal blanket must be primary`);

  // Emergency blanket: backup only, not primary slaapcomfort or warmth.
  const emergencyCoverage = await coverageRow(client, runId, expected.emergencyBlanket, 'noodwarmte-backup', 'nooddeken-reflecterend');
  assertTruthy(emergencyCoverage, `${tierSlug} emergency blanket coverage missing`);
  assertEqual(emergencyCoverage.coverage_strength, 'backup', `${tierSlug} emergency blanket must be backup, not primary`);
  if (await coverageNeedExists(client, runId, expected.emergencyBlanket, 'warmte-behouden')) {
    fail(`${tierSlug} emergency blanket must not cover warmte-behouden as primary`);
  }

  // Poncho coverage.
  const ponchoCoverage = await coverageRow(client, runId, expected.poncho, 'persoonlijk-droog-blijven', 'regenponcho-gebruiken');
  assertTruthy(ponchoCoverage?.counted_as_sufficient, `${tierSlug} poncho does not cover persoonlijk-droog-blijven`);
  assertEqual(ponchoCoverage.coverage_strength, 'primary', `${tierSlug} poncho must be primary for rain`);
  if (await coverageNeedExists(client, runId, expected.poncho, 'lichte-beschutting')) {
    fail(`${tierSlug} poncho must not cover lichte-beschutting (poncho is geen shelter)`);
  }

  // Tarp coverage: shelter-light only, not warmth.
  const tarpCoverage = await coverageRow(client, runId, expected.tarp, 'lichte-beschutting', 'tarp-light-beschutting');
  assertTruthy(tarpCoverage?.counted_as_sufficient, `${tierSlug} tarp does not cover lichte-beschutting`);
  if (await coverageNeedExists(client, runId, expected.tarp, 'warmte-behouden')) {
    fail(`${tierSlug} tarp must not cover warmte-behouden (tarp is geen warmtebron)`);
  }

  // Paracord and pegs: must be accessories of tarp.
  const paracordLine = bySku.get(expected.paracord);
  const pegsLine = bySku.get(expected.pegs);
  assertTruthy(paracordLine?.is_accessory, `${tierSlug} paracord must be flagged as accessory`);
  assertTruthy(pegsLine?.is_accessory, `${tierSlug} tarp pegs must be flagged as accessory`);
  assertTruthy(
    await sourceCount(client, paracordLine.id, 'accessory_requirement', expected.tarp) >= 1,
    `${tierSlug} paracord must have accessory_requirement source with parent ${expected.tarp}`,
  );
  assertTruthy(
    await sourceCount(client, pegsLine.id, 'accessory_requirement', expected.tarp) >= 1,
    `${tierSlug} tarp pegs must have accessory_requirement source with parent ${expected.tarp}`,
  );

  // Groundsheet only in basis_plus.
  if (expected.groundsheet) {
    const groundCoverage = await coverageRow(client, runId, expected.groundsheet, 'grondvocht-barriere', 'grondvocht-afschermen');
    assertTruthy(groundCoverage, `${tierSlug} groundsheet coverage missing`);
    assertEqual(groundCoverage.coverage_strength, 'secondary', `${tierSlug} groundsheet must be secondary supporting`);
  }

  // Usage constraints.
  assertTruthy(
    await usageCount(client, expected.thermalBlanket, ['fire_risk', 'storage_safety', 'medical_claim_limit']) >= 3,
    `${tierSlug} thermal blanket usage constraints incomplete`,
  );
  assertTruthy(
    await usageCount(client, expected.emergencyBlanket, ['medical_claim_limit', 'child_safety', 'storage_safety', 'fire_risk']) >= 4,
    `${tierSlug} emergency blanket usage constraints incomplete`,
  );
  assertTruthy(
    await usageCount(client, expected.tarp, ['storage_safety', 'fire_risk', 'child_safety']) >= 3,
    `${tierSlug} tarp usage constraints incomplete`,
  );
  assertTruthy(
    await usageCount(client, expected.paracord, ['child_safety', 'storage_safety']) >= 2,
    `${tierSlug} paracord usage constraints incomplete`,
  );
  assertTruthy(
    await usageCount(client, expected.pegs, ['child_safety', 'storage_safety']) >= 2,
    `${tierSlug} tarp pegs usage constraints incomplete`,
  );

  for (const line of lines) assertNoOverclaim(line, tierSlug);

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

    // Claim governance baseline at product_type level.
    for (const ptSlug of ['warmtedeken', 'nooddeken', 'regenponcho', 'tarp-light', 'paracord', 'tarp-haringen', 'grondzeil']) {
      assertTruthy(
        await governanceCount(client, ptSlug) >= 1,
        `claim_governance_rule missing for product_type ${ptSlug}`,
      );
    }

    assertEqual(await countView(client, 'qa_generated_lines_without_sources'), 0, 'qa_generated_lines_without_sources');
    assertEqual(await countView(client, 'qa_generated_line_product_type_mismatch'), 0, 'qa_generated_line_product_type_mismatch');

    let blockingTotal = 0;
    for (const viewName of BLOCKING_QA_VIEWS) {
      blockingTotal += await countView(client, viewName);
    }
    assertEqual(blockingTotal, 0, 'blocking QA total');

    console.log('Warmte/Droog/Shelter-light POC regression baseline OK');
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
