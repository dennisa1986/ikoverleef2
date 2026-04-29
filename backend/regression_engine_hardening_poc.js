const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const {
  DEFAULT_INPUT,
  BLOCKING_QA_VIEWS,
  countView,
  latestRunWithExactAddons,
  loadRecommendationOutput,
  main: calculateRecommendation,
} = require('./calculate');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

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

function assertSectionShape(output, label) {
  assertTruthy(output.sections && typeof output.sections === 'object', `${label}: sections missing`);
  assertTruthy(Array.isArray(output.sections.core_items), `${label}: core_items missing`);
  assertTruthy(Array.isArray(output.sections.accessories), `${label}: accessories missing`);
  assertTruthy(Array.isArray(output.sections.supporting_items), `${label}: supporting_items missing`);
  assertTruthy(Array.isArray(output.sections.backup_items), `${label}: backup_items missing`);
  assertTruthy(Array.isArray(output.sections.optional_additions), `${label}: optional_additions missing`);
  assertTruthy(Array.isArray(output.tasks), `${label}: tasks section missing`);
  assertTruthy(Array.isArray(output.warnings), `${label}: warnings section missing`);
  assertTruthy(output.qa_summary && typeof output.qa_summary === 'object', `${label}: qa_summary missing`);
}

function linesBySku(output) {
  return new Map(output.lines.map((line) => [line.sku, line]));
}

function assertSingleLine(output, sku, label) {
  const matches = output.lines.filter((line) => line.sku === sku);
  assertEqual(matches.length, 1, `${label}: expected single line for ${sku}`);
  return matches[0];
}

function assertNeedsAndCoveragePreserved(line, minNeeds, label) {
  const sourceNeeds = new Set(line.sources.map((row) => row.scenario_need).filter(Boolean));
  const coverageNeeds = new Set(line.coverage.map((row) => row.need).filter(Boolean));
  assertTruthy(sourceNeeds.size >= minNeeds, `${label}: expected at least ${minNeeds} source needs`);
  assertTruthy(coverageNeeds.size >= minNeeds, `${label}: expected at least ${minNeeds} coverage needs`);
}

function assertQaClean(output, label) {
  assertEqual(output.qa_summary.blocking_total, 0, `${label}: QA blocking`);
  assertEqual(output.qa_summary.generated_lines_without_sources, 0, `${label}: generated lines without sources`);
  assertEqual(output.qa_summary.generated_line_producttype_mismatch, 0, `${label}: generated line producttype mismatch`);
}

async function calculateAndLoadOutput(client, input) {
  await runEngine(input);
  const runId = await latestRunWithExactAddons(client, input);
  const output = await loadRecommendationOutput(client, runId, input);
  return { runId, output };
}

async function checkPowerEvacuationCombo(client) {
  const input = {
    ...DEFAULT_INPUT,
    tier_slug: 'basis_plus',
    addon_slugs: ['stroomuitval', 'evacuatie'],
  };

  const { runId, output } = await calculateAndLoadOutput(client, input);
  assertSectionShape(output, 'stroomuitval+evacuatie');
  assertQaClean(output, 'stroomuitval+evacuatie');

  const headlamp = assertSingleLine(output, 'IOE-HEADLAMP-AAA-PLUS', 'stroomuitval+evacuatie');
  assertNeedsAndCoveragePreserved(headlamp, 2, 'headlamp dedupe');
  assertTruthy(output.sections.core_items.some((line) => line.sku === 'IOE-HEADLAMP-AAA-PLUS'), 'headlamp should remain core');
  assertTruthy(output.sections.accessories.some((line) => line.sku === 'IOE-BATT-AAA-12'), 'AAA batteries should remain accessory');

  return runId;
}

async function checkWaterEvacuationCombo(client) {
  const input = {
    ...DEFAULT_INPUT,
    tier_slug: 'basis_plus',
    addon_slugs: ['drinkwater', 'evacuatie'],
  };

  const { runId, output } = await calculateAndLoadOutput(client, input);
  assertSectionShape(output, 'drinkwater+evacuatie');
  assertQaClean(output, 'drinkwater+evacuatie');

  const bottle = assertSingleLine(output, 'IOE-BOTTLE-1L-PLUS', 'drinkwater+evacuatie');
  assertTruthy(bottle.sources.length >= 1, 'drink bottle must keep source');
  assertTruthy(bottle.coverage.length >= 1, 'drink bottle must keep coverage');

  const filterBottle = assertSingleLine(output, 'IOE-FILTERBOTTLE-PLUS', 'drinkwater+evacuatie');
  assertTruthy(['backup_items', 'supporting_items'].includes(filterBottle.runtime_section), 'filter bottle must stay backup/supporting');
  assertTruthy(output.warnings.length > 0, 'drinkwater+evacuatie should expose warnings');

  return runId;
}

async function checkProfileCombo(client) {
  const input = {
    ...DEFAULT_INPUT,
    tier_slug: 'basis_plus',
    addon_slugs: ['drinkwater', 'taken_profielen'],
    household_adults: 2,
    household_children: 1,
    household_pets: 1,
    duration_hours: 72,
  };

  const { runId, output } = await calculateAndLoadOutput(client, input);
  assertSectionShape(output, 'drinkwater+taken_profielen');
  assertQaClean(output, 'drinkwater+taken_profielen');
  assertTruthy(output.tasks.length > 0, 'taken_profielen tasks must be visible');
  assertTruthy(output.tasks.some((task) => task.task_slug === 'duur-en-huishouden-controleren'), 'profile duration task missing');
  assertTruthy(output.tasks.some((task) => task.task_slug === 'persoonlijke-medicatie-controleren'), 'medication task missing');

  const bySku = linesBySku(output);
  assertEqual(bySku.get('IOE-WATER-PACK-6L-PLUS')?.quantity, 4, 'profile combo water pack quantity');

  return runId;
}

async function checkFullStressRun(client) {
  const input = {
    ...DEFAULT_INPUT,
    tier_slug: 'basis_plus',
    addon_slugs: [
      'stroomuitval',
      'drinkwater',
      'voedsel_bereiding',
      'hygiene_sanitatie_afval',
      'ehbo_persoonlijke_zorg',
      'warmte_droog_shelter_light',
      'evacuatie',
      'taken_profielen',
    ],
    household_adults: 2,
    household_children: 1,
    household_pets: 1,
    duration_hours: 72,
  };

  const { runId, output } = await calculateAndLoadOutput(client, input);
  assertSectionShape(output, 'full stressrun');
  assertQaClean(output, 'full stressrun');
  assertTruthy(output.lines.length > 0, 'full stressrun must generate product lines');
  assertTruthy(output.tasks.length > 0, 'full stressrun must keep tasks');
  assertTruthy(output.warnings.length > 0, 'full stressrun must keep warnings');
  assertTruthy(Array.isArray(output.sections.optional_additions), 'optional_additions section must exist');

  const gloves = assertSingleLine(output, 'IOE-GLOVES-NITRILE-PLUS', 'full stressrun');
  assertNeedsAndCoveragePreserved(gloves, 2, 'nitrile gloves dedupe');

  return runId;
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const client = new Client({ connectionString: process.env.IOE_PG_URL });
  await client.connect();
  try {
    const runA = await checkPowerEvacuationCombo(client);
    const runB = await checkWaterEvacuationCombo(client);
    const runC = await checkProfileCombo(client);
    const runD = await checkFullStressRun(client);

    for (const viewName of BLOCKING_QA_VIEWS) {
      assertEqual((await countView(client, viewName)).records, 0, viewName);
    }
    assertEqual((await countView(client, 'qa_generated_lines_without_sources')).records, 0, 'qa_generated_lines_without_sources');
    assertEqual((await countView(client, 'qa_generated_line_product_type_mismatch')).records, 0, 'qa_generated_line_product_type_mismatch');

    console.log(`engine hardening regression passed (runs ${runA}, ${runB}, ${runC}, ${runD})`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
