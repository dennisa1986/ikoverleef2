const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const {
  RELEASE_BASELINES,
  loadBackofficeData,
} = require('./backoffice_queries');
const {
  renderBackofficePage,
} = require('../apps/internal-poc/server');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const EXPECTED_BASELINES = [
  'v0.1.0-stroomuitval-baseline',
  'v0.2.0-drinkwater-baseline',
  'v0.3.0-voedsel-bereiding-baseline',
  'v0.4.0-hygiene-sanitatie-baseline',
  'v0.5.0-ehbo-baseline',
  'v0.6.0-warmte-droog-shelter-light-baseline',
  'v0.7.0-evacuatie-baseline',
  'v0.8.0-taken-profielen-baseline',
  'v0.9.0-engine-hardening-baseline',
  'v0.10.0-backoffice-hardening-baseline',
];

const RUNTIME_LABELS = [
  'ready',
  'needs_attention',
  'blocked',
  'poc_only',
  'governance_risk',
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

function assertContainsAll(actual, expected, label) {
  const set = new Set(actual);
  for (const value of expected) {
    if (!set.has(value)) fail(`${label}: missing ${value}`);
  }
}

async function countForbiddenTables(client) {
  const result = await client.query(
    `SELECT count(*)::int AS records
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)`,
    [[
      'release_registry',
      'dashboard',
      'backoffice_dashboard',
      'recommendation_output_section',
      'generated_warning',
      'optional_addition',
    ]],
  );
  return result.rows[0].records;
}

async function countRuntimeLabelsAsEnums(client) {
  const result = await client.query(
    `SELECT count(*)::int AS records
       FROM pg_enum
      WHERE enumlabel = ANY($1)`,
    [RUNTIME_LABELS],
  );
  return result.rows[0].records;
}

async function countForbiddenSupplierOfferColumns(client) {
  const result = await client.query(
    `SELECT count(*)::int AS records
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'supplier_offer'
        AND column_name = ANY($1)`,
    [[
      'source_status',
      'source_url',
      'source_checked_at',
      'claim_coverage',
      'price_status',
    ]],
  );
  return result.rows[0].records;
}

function assertBackofficeData(data) {
  assertTruthy(data.qaSummary && Array.isArray(data.qaSummary.per_view_records), 'QA summary query must work');
  assertTruthy(data.qaSummary.per_view_records.length > 0, 'QA summary must include per-view records');
  assertTruthy(data.scenarioMatrix.length > 0, 'scenario matrix query must return rows');
  assertTruthy(data.productReadiness.length > 0, 'product readiness query must return rows');
  assertTruthy(data.candidateReadiness.length > 0, 'candidate readiness query must return rows');
  assertTruthy(Array.isArray(data.governanceAttention), 'governance attention query must return a valid array');
  assertTruthy(Array.isArray(data.supplierOfferAttention), 'supplier offer attention query must return a valid array');
  assertTruthy(data.supplierOfferAttention.length > 0, 'supplier offer attention query must return rows');
  assertContainsAll(RELEASE_BASELINES, EXPECTED_BASELINES, 'release baseline config');
  assertContainsAll(data.releaseBaseline.baselines.map((row) => row.tag), EXPECTED_BASELINES, 'release baseline overview');

  const labels = new Set([
    ...data.productReadiness.map((row) => row.readiness_label),
    ...data.candidateReadiness.map((row) => row.readiness_label),
    ...data.supplierOfferAttention.map((row) => row.attention_label),
  ]);
  assertTruthy(labels.has('ready') || labels.has('poc_only') || labels.has('needs_attention'), 'runtime labels must be present');
}

function assertBackofficeRender(data) {
  const html = renderBackofficePage(data, 'all');
  assertTruthy(html.includes('QA dashboard summary'), 'backoffice render must show QA summary');
  assertTruthy(html.includes('Scenario matrix'), 'backoffice render must show scenario matrix');
  assertTruthy(html.includes('Product readiness'), 'backoffice render must show product readiness');
  assertTruthy(html.includes('Candidate readiness'), 'backoffice render must show candidate readiness');
  assertTruthy(html.includes('Governance attention'), 'backoffice render must show governance attention');
  assertTruthy(html.includes('Supplier offer attention'), 'backoffice render must show supplier offer attention');
  assertTruthy(html.includes('Release baseline'), 'backoffice render must show release baseline');
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const client = new Client({ connectionString: process.env.IOE_PG_URL });
  await client.connect();
  try {
    const data = await loadBackofficeData(client);
    assertBackofficeData(data);
    assertBackofficeRender(data);

    assertEqual(data.qaSummary.blocking_total, 0, 'QA blocking');
    assertEqual(data.qaSummary.generated_lines_without_sources, 0, 'generated lines without sources');
    assertEqual(data.qaSummary.generated_line_producttype_mismatch, 0, 'generated line producttype mismatch');
    assertEqual(await countForbiddenTables(client), 0, 'forbidden backoffice/release tables');
    assertEqual(await countRuntimeLabelsAsEnums(client), 0, 'runtime labels must not be database enum labels');
    assertEqual(await countForbiddenSupplierOfferColumns(client), 0, 'supplier_offer forbidden columns');

    console.log(`backoffice hardening regression passed (scenario rows ${data.scenarioMatrix.length}, product rows ${data.productReadiness.length}, candidate rows ${data.candidateReadiness.length})`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
