const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: {
    skus: [
      'IOE-FIRSTAID-KIT-BASIC',
      'IOE-PLASTERS-BASIC',
      'IOE-STERILE-GAUZE-BASIC',
      'IOE-WOUND-CLEANING-BASIC',
      'IOE-MEDICAL-TAPE-BASIC',
      'IOE-GLOVES-NITRILE-BASIC',
    ],
    kit: 'IOE-FIRSTAID-KIT-BASIC',
    plasters: 'IOE-PLASTERS-BASIC',
    gauze: 'IOE-STERILE-GAUZE-BASIC',
    cleaning: 'IOE-WOUND-CLEANING-BASIC',
    tape: 'IOE-MEDICAL-TAPE-BASIC',
    gloves: 'IOE-GLOVES-NITRILE-BASIC',
    thermometer: null,
    forbidden: ['IOE-FIRSTAID-KIT-PLUS', 'IOE-THERMOMETER-PLUS'],
  },
  basis_plus: {
    skus: [
      'IOE-FIRSTAID-KIT-PLUS',
      'IOE-PLASTERS-PLUS',
      'IOE-STERILE-GAUZE-PLUS',
      'IOE-WOUND-CLEANING-PLUS',
      'IOE-MEDICAL-TAPE-PLUS',
      'IOE-GLOVES-NITRILE-PLUS',
      'IOE-THERMOMETER-PLUS',
    ],
    kit: 'IOE-FIRSTAID-KIT-PLUS',
    plasters: 'IOE-PLASTERS-PLUS',
    gauze: 'IOE-STERILE-GAUZE-PLUS',
    cleaning: 'IOE-WOUND-CLEANING-PLUS',
    tape: 'IOE-MEDICAL-TAPE-PLUS',
    gloves: 'IOE-GLOVES-NITRILE-PLUS',
    thermometer: 'IOE-THERMOMETER-PLUS',
    forbidden: ['IOE-FIRSTAID-KIT-BASIC', 'IOE-PLASTERS-BASIC'],
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
        addon_slugs: ['ehbo_persoonlijke_zorg'],
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
           AND a.slug = 'ehbo_persoonlijke_zorg'
       )
     ORDER BY rr.created_at DESC
     LIMIT 1`,
    [tierSlug],
  );

  if (!result.rows.length) fail(`no ehbo_persoonlijke_zorg recommendation_run found for tier ${tierSlug}`);
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

async function totalSourceCount(client, lineId) {
  const result = await client.query(
    `SELECT count(*)::int AS records
     FROM generated_line_source
     WHERE generated_package_line_id = $1`,
    [lineId],
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

async function taskCount(client) {
  const result = await client.query(
    `SELECT count(*)::int AS records
     FROM preparedness_task
     WHERE task_slug IN ('persoonlijke-medicatie-check', 'pijnstilling-governance-check')
       AND status = 'active'`,
  );
  return result.rows[0].records;
}

function assertNoForbiddenSku(skus, tierSlug) {
  const forbiddenPrefixes = [
    'IOE-PAINKILLERS-',
    'IOE-PERSONAL-MEDICATION-',
    'IOE-ANTIBIOTICS-',
    'IOE-PRESCRIPTION-',
  ];

  for (const sku of skus) {
    if (forbiddenPrefixes.some((prefix) => sku.startsWith(prefix))) {
      fail(`${tierSlug} generated forbidden medication/painkiller SKU ${sku}`);
    }
  }
}

function assertNoMedicalOverclaim(line, tierSlug) {
  const copy = `${line.explanation_public || ''} ${line.explanation_internal || ''}`.toLowerCase();
  const forbidden = [
    'vervangt arts',
    'vervangt professionele hulp',
    'behandelt infectie',
    'voorkomt infectie',
    'stelt diagnose',
    'geeft behandeladvies',
    'geschikt voor ernstige verwondingen',
    'neem dit medicijn',
    'pijnstillers zijn standaard nodig',
    'persoonlijke medicatie wordt automatisch geregeld',
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

  assertSameSet(skus, expected.skus, `${tierSlug} EHBO generated SKUs`);
  assertNoForbiddenSku(skus, tierSlug);
  for (const forbiddenSku of expected.forbidden) {
    if (skus.includes(forbiddenSku)) fail(`${tierSlug} unexpectedly includes ${forbiddenSku}`);
  }

  const bySku = new Map(lines.map((line) => [line.sku, line]));
  for (const sku of expected.skus) {
    assertEqual(bySku.get(sku)?.quantity, 1, `${tierSlug} ${sku} quantity`);
  }

  const kitCoverage = await coverageRow(client, runId, expected.kit, 'basis-ehbo', 'basis-ehbo-set-gebruiken');
  assertTruthy(kitCoverage?.counted_as_sufficient, `${tierSlug} EHBO-set does not cover basis EHBO`);

  const plasterCoverage = await coverageRow(client, runId, expected.plasters, 'wonden-afdekken', 'pleisters-gebruiken');
  assertTruthy(plasterCoverage?.counted_as_sufficient, `${tierSlug} plasters do not cover wound coverage`);

  const gauzeCoverage = await coverageRow(client, runId, expected.gauze, 'wonden-afdekken', 'steriel-gaas-gebruiken');
  assertTruthy(gauzeCoverage, `${tierSlug} sterile gauze coverage missing`);
  assertEqual(gauzeCoverage.coverage_strength, 'secondary', `${tierSlug} sterile gauze must be secondary`);

  const cleaningCoverage = await coverageRow(client, runId, expected.cleaning, 'wondreiniging-ondersteunen', 'wondreiniging-ondersteunen');
  assertTruthy(cleaningCoverage?.counted_as_sufficient, `${tierSlug} wound cleaning is not covered`);

  const tapeCoverage = await coverageRow(client, runId, expected.tape, 'verband-fixeren', 'verband-fixeren');
  assertTruthy(tapeCoverage, `${tierSlug} medical tape/fixation coverage missing`);
  assertEqual(tapeCoverage.coverage_strength, 'secondary', `${tierSlug} medical tape must be secondary/supporting`);

  const glovesCoverage = await coverageRow(client, runId, expected.gloves, 'zorg-handbescherming', 'wegwerp-handschoenen-zorg');
  assertTruthy(glovesCoverage?.counted_as_sufficient, `${tierSlug} care gloves do not cover hand protection`);

  assertTruthy(bySku.get(expected.tape)?.is_accessory, `${tierSlug} tape is not generated as accessory`);
  assertTruthy(bySku.get(expected.gloves)?.is_accessory, `${tierSlug} gloves are not generated as accessory`);
  assertEqual(await sourceCount(client, bySku.get(expected.tape).id, 'accessory_requirement', expected.gauze), 1, `${tierSlug} tape accessory source`);
  assertEqual(await sourceCount(client, bySku.get(expected.gloves).id, 'accessory_requirement', expected.kit), 1, `${tierSlug} gloves kit accessory source`);
  assertEqual(await sourceCount(client, bySku.get(expected.gloves).id, 'accessory_requirement', expected.cleaning), 1, `${tierSlug} gloves wound cleaning accessory source`);
  assertTruthy(await totalSourceCount(client, bySku.get(expected.gloves).id) >= 3, `${tierSlug} gloves should retain multiple sources`);

  if (expected.thermometer) {
    const thermometer = bySku.get(expected.thermometer);
    assertTruthy(thermometer, `${tierSlug} thermometer missing`);
    assertTruthy(!thermometer.is_core_line, `${tierSlug} thermometer must be supporting, not core`);
    const thermometerCoverage = await coverageRow(client, runId, expected.thermometer, 'temperatuur-controleren', 'temperatuur-meten');
    assertTruthy(thermometerCoverage, `${tierSlug} thermometer coverage missing`);
    assertEqual(thermometerCoverage.coverage_strength, 'secondary', `${tierSlug} thermometer must be secondary/supporting`);
  }

  assertEqual(await usageCount(client, expected.kit, ['medical_claim_limit', 'storage_safety', 'expiry_sensitive', 'child_safety']), 4, `${tierSlug} EHBO-set usage constraints`);
  assertEqual(await usageCount(client, expected.cleaning, ['medical_claim_limit', 'expiry_sensitive', 'child_safety', 'storage_safety']), 4, `${tierSlug} wound cleaning usage constraints`);
  assertEqual(await usageCount(client, expected.gloves, ['medical_claim_limit', 'hygiene_contamination_risk', 'disposal_requirement']), 3, `${tierSlug} gloves usage constraints`);
  if (expected.thermometer) {
    assertEqual(await usageCount(client, expected.thermometer, ['medical_claim_limit', 'storage_safety']), 2, `${tierSlug} thermometer usage constraints`);
  }

  for (const line of lines) assertNoMedicalOverclaim(line, tierSlug);

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

    assertEqual(await taskCount(client), 2, 'preparedness task count for medication/pain relief');
    assertEqual(await countView(client, 'qa_generated_lines_without_sources'), 0, 'qa_generated_lines_without_sources');
    assertEqual(await countView(client, 'qa_generated_line_product_type_mismatch'), 0, 'qa_generated_line_product_type_mismatch');

    let blockingTotal = 0;
    for (const viewName of BLOCKING_QA_VIEWS) {
      blockingTotal += await countView(client, viewName);
    }
    assertEqual(blockingTotal, 0, 'blocking QA total');

    console.log('EHBO POC regression baseline OK');
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
