const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DEFAULT_INPUT, main: calculateRecommendation } = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED = {
  basis: {
    skus: [
      'IOE-HANDGEL-BASIC',
      'IOE-HYGIENE-WIPES-BASIC',
      'IOE-SOAP-BASIC',
      'IOE-TOILET-BAGS-BASIC',
      'IOE-ABSORBENT-BASIC',
      'IOE-TOILET-PAPER-BASIC',
      'IOE-WASTE-BAGS-BASIC',
      'IOE-ZIPBAGS-BASIC',
      'IOE-GLOVES-NITRILE-BASIC',
    ],
    handgel: 'IOE-HANDGEL-BASIC',
    wipes: 'IOE-HYGIENE-WIPES-BASIC',
    soap: 'IOE-SOAP-BASIC',
    toiletBags: 'IOE-TOILET-BAGS-BASIC',
    absorbent: 'IOE-ABSORBENT-BASIC',
    toiletPaper: 'IOE-TOILET-PAPER-BASIC',
    wasteBags: 'IOE-WASTE-BAGS-BASIC',
    zipbags: 'IOE-ZIPBAGS-BASIC',
    gloves: 'IOE-GLOVES-NITRILE-BASIC',
    forbidden: ['IOE-HANDGEL-PLUS', 'IOE-HYGIENE-WIPES-PLUS', 'IOE-TOILET-BAGS-PLUS'],
  },
  basis_plus: {
    skus: [
      'IOE-HANDGEL-PLUS',
      'IOE-HYGIENE-WIPES-PLUS',
      'IOE-SOAP-PLUS',
      'IOE-TOILET-BAGS-PLUS',
      'IOE-ABSORBENT-PLUS',
      'IOE-TOILET-PAPER-PLUS',
      'IOE-WASTE-BAGS-PLUS',
      'IOE-ZIPBAGS-PLUS',
      'IOE-GLOVES-NITRILE-PLUS',
    ],
    handgel: 'IOE-HANDGEL-PLUS',
    wipes: 'IOE-HYGIENE-WIPES-PLUS',
    soap: 'IOE-SOAP-PLUS',
    toiletBags: 'IOE-TOILET-BAGS-PLUS',
    absorbent: 'IOE-ABSORBENT-PLUS',
    toiletPaper: 'IOE-TOILET-PAPER-PLUS',
    wasteBags: 'IOE-WASTE-BAGS-PLUS',
    zipbags: 'IOE-ZIPBAGS-PLUS',
    gloves: 'IOE-GLOVES-NITRILE-PLUS',
    forbidden: ['IOE-HANDGEL-BASIC', 'IOE-HYGIENE-WIPES-BASIC', 'IOE-TOILET-BAGS-BASIC'],
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
        addon_slugs: ['hygiene_sanitatie_afval'],
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
           AND a.slug = 'hygiene_sanitatie_afval'
       )
     ORDER BY rr.created_at DESC
     LIMIT 1`,
    [tierSlug],
  );

  if (!result.rows.length) fail(`no hygiene_sanitatie_afval recommendation_run found for tier ${tierSlug}`);
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

function assertNoOverclaim(line, tierSlug) {
  const copy = `${line.explanation_public || ''} ${line.explanation_internal || ''}`.toLowerCase();
  const forbidden = [
    'beschermt tegen alle virussen',
    'beschermt tegen alle bacterien',
    'steriliseert oppervlakken',
    'medische bescherming bieden',
    'veilig omgaan met alle soorten afval',
    'geschikt voor gevaarlijk',
    'geschikt voor chemisch',
    'geschikt voor medisch afval',
    'sanitatie volledig opgelost',
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

  assertSameSet(skus, expected.skus, `${tierSlug} hygiene generated SKUs`);
  for (const forbiddenSku of expected.forbidden) {
    if (skus.includes(forbiddenSku)) fail(`${tierSlug} unexpectedly includes ${forbiddenSku}`);
  }

  const bySku = new Map(lines.map((line) => [line.sku, line]));

  assertEqual(bySku.get(expected.handgel)?.quantity, 1, `${tierSlug} handgel quantity`);
  assertEqual(bySku.get(expected.wipes)?.quantity, 2, `${tierSlug} wipes quantity uses 72h/person/pack-size rounding`);
  assertEqual(bySku.get(expected.soap)?.quantity, 1, `${tierSlug} soap quantity`);
  assertEqual(bySku.get(expected.toiletBags)?.quantity, 2, `${tierSlug} toilet bags quantity uses 72h/person/pack-size rounding`);
  assertEqual(bySku.get(expected.absorbent)?.quantity, 1, `${tierSlug} absorbent quantity`);
  assertEqual(bySku.get(expected.toiletPaper)?.quantity, 1, `${tierSlug} toilet paper quantity`);
  assertEqual(bySku.get(expected.wasteBags)?.quantity, 1, `${tierSlug} waste bags quantity`);
  assertEqual(bySku.get(expected.zipbags)?.quantity, 1, `${tierSlug} zipbags quantity`);
  assertEqual(bySku.get(expected.gloves)?.quantity, 1, `${tierSlug} gloves quantity`);

  const handgelCoverage = await coverageRow(client, runId, expected.handgel, 'handhygiene', 'handen-desinfecteren');
  assertTruthy(handgelCoverage?.counted_as_sufficient, `${tierSlug} hand hygiene is not covered by handgel`);

  const wipesCoverage = await coverageRow(client, runId, expected.wipes, 'basishygiene-reiniging', 'oppervlak-reinigen-met-doekjes');
  assertTruthy(wipesCoverage?.counted_as_sufficient, `${tierSlug} basic cleaning is not covered by wipes`);

  const toiletCoverage = await coverageRow(client, runId, expected.toiletBags, 'noodtoilet-72u', 'toiletafval-insluiten');
  assertTruthy(toiletCoverage?.counted_as_sufficient, `${tierSlug} emergency sanitation is not covered`);

  const wasteCoverage = await coverageRow(client, runId, expected.wasteBags, 'afval-insluiten', 'afvalzak-gebruiken');
  assertTruthy(wasteCoverage?.counted_as_sufficient, `${tierSlug} waste containment is not covered`);

  const zipCoverage = await coverageRow(client, runId, expected.zipbags, 'afval-scheiden', 'klein-afval-afsluitbaar-bewaren');
  assertTruthy(zipCoverage, `${tierSlug} zipbags / small waste coverage missing`);
  assertEqual(zipCoverage.coverage_strength, 'secondary', `${tierSlug} zipbags must be secondary/supporting`);

  const gloveCoverage = await coverageRow(client, runId, expected.gloves, 'handbescherming', 'wegwerp-handbescherming');
  assertTruthy(gloveCoverage?.counted_as_sufficient, `${tierSlug} hand protection is not covered by gloves`);

  assertTruthy(bySku.get(expected.absorbent)?.is_accessory, `${tierSlug} absorbent is not generated as accessory/supporting`);
  assertTruthy(bySku.get(expected.zipbags)?.is_accessory, `${tierSlug} zipbags is not generated as accessory/supporting`);
  assertTruthy(bySku.get(expected.gloves)?.is_accessory, `${tierSlug} gloves is not generated as accessory/supporting`);

  assertEqual(await sourceCount(client, bySku.get(expected.absorbent).id, 'accessory_requirement', expected.toiletBags), 1, `${tierSlug} absorbent accessory source`);
  assertEqual(await sourceCount(client, bySku.get(expected.gloves).id, 'accessory_requirement', expected.toiletBags), 1, `${tierSlug} gloves sanitation accessory source`);
  assertEqual(await sourceCount(client, bySku.get(expected.gloves).id, 'accessory_requirement', expected.wasteBags), 1, `${tierSlug} gloves waste accessory source`);
  assertTruthy(await totalSourceCount(client, bySku.get(expected.gloves).id) >= 3, `${tierSlug} gloves should retain multiple sources`);
  assertTruthy(await totalSourceCount(client, bySku.get(expected.zipbags).id) >= 2, `${tierSlug} zipbags should retain multiple sources`);

  assertEqual(await usageCount(client, expected.handgel, ['fire_risk', 'child_safety', 'storage_safety', 'expiry_sensitive', 'medical_claim_limit']), 5, `${tierSlug} handgel usage constraints`);
  assertEqual(await usageCount(client, expected.toiletBags, ['hygiene_contamination_risk', 'disposal_requirement', 'storage_safety']), 3, `${tierSlug} toilet bag usage constraints`);
  assertEqual(await usageCount(client, expected.absorbent, ['dosage_warning', 'child_safety', 'storage_safety', 'hygiene_contamination_risk']), 4, `${tierSlug} absorbent usage constraints`);
  assertEqual(await usageCount(client, expected.wasteBags, ['hygiene_contamination_risk', 'disposal_requirement']), 2, `${tierSlug} waste bag usage constraints`);
  assertEqual(await usageCount(client, expected.gloves, ['medical_claim_limit', 'hygiene_contamination_risk', 'disposal_requirement']), 3, `${tierSlug} gloves usage constraints`);

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

    assertEqual(await countView(client, 'qa_generated_lines_without_sources'), 0, 'qa_generated_lines_without_sources');
    assertEqual(await countView(client, 'qa_generated_line_product_type_mismatch'), 0, 'qa_generated_line_product_type_mismatch');

    let blockingTotal = 0;
    for (const viewName of BLOCKING_QA_VIEWS) {
      blockingTotal += await countView(client, viewName);
    }
    assertEqual(blockingTotal, 0, 'blocking QA total');

    console.log('Hygiene sanitatie POC regression baseline OK');
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
