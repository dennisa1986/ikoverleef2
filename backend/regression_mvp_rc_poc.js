const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  handleRequest,
  mvpInputFromSearchParams,
  ensureRecommendationData,
} = require('../apps/internal-poc/server');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const RELEASE_NOTE_PATH = path.join(
  ROOT,
  'handoff',
  'ikoverleef_agent_handoff_v1',
  'release_notes',
  'release_note_v1.0.0_mvp_rc1.md',
);

const FORBIDDEN_SKU_PATTERNS = [
  /IOE-.*PAINKILL/i,
  /IOE-.*PAIN.*KILL/i,
  /IOE-.*PERSONAL.*MEDICATION/i,
  /IOE-.*MEDICATION/i,
  /IOE-.*ANTIBIOTIC/i,
  /IOE-DOCUMENTS/i,
  /IOE-ID/i,
  /IOE-PASSPORT/i,
  /IOE-CASH/i,
  /IOE-KEYS/i,
  /IOE-CONTACTS/i,
  /IOE-.*BABY/i,
  /IOE-.*PET/i,
  /IOE-.*HUISDIER/i,
];

const FORBIDDEN_PRODUCT_TYPES = new Set([
  'persoonlijke-medicatie',
  'pijnstillers',
  'antibiotica',
  'receptmedicatie',
  'documenten',
  'identiteitsbewijs',
  'paspoort',
  'cash',
  'sleutels',
  'contactpersonen',
  'babyspullen',
  'huisdiervoer',
  'huisdiermedicatie',
]);

const FORBIDDEN_LINK_OR_CTA_PATTERN = /(?:href|action)="[^"]*(checkout|cart|winkelmand|betaling|payment|account|login|register)[^"]*"|>\s*(bestel nu|checkout|winkelmand|betalen|login|registreer|register)\s*</i;

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

function assertTruthy(value, label) {
  if (!value) fail(label);
}

function assertEqual(actual, expected, label) {
  if (String(actual) !== String(expected)) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertContains(text, expected, label) {
  for (const value of expected) {
    if (!text.includes(value)) fail(`${label}: missing ${value}`);
  }
}

function assertNoForbiddenLinksOrCtas(html, label) {
  if (FORBIDDEN_LINK_OR_CTA_PATTERN.test(html)) {
    fail(`${label}: forbidden checkout/payment/account/cart link or CTA present`);
  }
}

function assertSectionShape(output, label) {
  assertTruthy(output.sections && typeof output.sections === 'object', `${label}: sections missing`);
  assertTruthy(Array.isArray(output.sections.core_items), `${label}: core_items missing`);
  assertTruthy(Array.isArray(output.sections.accessories), `${label}: accessories missing`);
  assertTruthy(Array.isArray(output.sections.supporting_items), `${label}: supporting_items missing`);
  assertTruthy(Array.isArray(output.sections.backup_items), `${label}: backup_items missing`);
  assertTruthy(Array.isArray(output.sections.optional_additions), `${label}: optional_additions missing`);
  assertTruthy(Array.isArray(output.tasks), `${label}: tasks missing`);
  assertTruthy(Array.isArray(output.warnings), `${label}: warnings missing`);
  assertTruthy(output.qa_summary && typeof output.qa_summary === 'object', `${label}: qa_summary missing`);
}

function assertQaClean(output, label) {
  assertEqual(output.qa_summary.blocking_total, 0, `${label}: QA blocking`);
  assertEqual(output.qa_summary.generated_lines_without_sources, 0, `${label}: generated lines without sources`);
  assertEqual(output.qa_summary.generated_line_producttype_mismatch, 0, `${label}: generated line producttype mismatch`);
}

function assertForbiddenProductItemsAbsent(output, label) {
  for (const line of output.lines) {
    const sku = line.sku || '';
    const productType = line.product_type_slug || '';
    if (FORBIDDEN_PRODUCT_TYPES.has(productType)) {
      fail(`${label}: forbidden product_type ${productType} generated for ${sku}`);
    }
    for (const pattern of FORBIDDEN_SKU_PATTERNS) {
      if (pattern.test(sku)) fail(`${label}: forbidden SKU generated ${sku}`);
    }
  }
}

async function requestPath(pathname) {
  return new Promise((resolve, reject) => {
    const req = {
      url: pathname,
      headers: { host: '127.0.0.1:4173' },
    };
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = headers || {};
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      },
    };

    Promise.resolve(handleRequest(req, res)).catch(reject);
  });
}

function inputFromQuery(query) {
  return mvpInputFromSearchParams(new URLSearchParams(query));
}

async function assertRoute(pathname, expectedStatus, expectedText, label) {
  const response = await requestPath(pathname);
  assertEqual(response.statusCode, expectedStatus, `${label}: HTTP status`);
  if (expectedText.length) assertContains(response.body, expectedText, label);
  assertNoForbiddenLinksOrCtas(response.body, label);
  return response;
}

async function checkRecommendationOutput(query, label, tasksRequired) {
  const output = await ensureRecommendationData(inputFromQuery(query));
  assertSectionShape(output, label);
  assertTruthy(output.sections.core_items.length > 0, `${label}: core_items has rows`);
  assertTruthy(output.sections.accessories.length > 0, `${label}: accessories has rows`);
  if (tasksRequired) assertTruthy(output.tasks.length > 0, `${label}: tasks visible`);
  assertTruthy(Array.isArray(output.warnings), `${label}: warnings section exists`);
  assertQaClean(output, label);
  assertForbiddenProductItemsAbsent(output, label);
  for (const line of output.lines) {
    assertTruthy(Array.isArray(line.sources) && line.sources.length > 0, `${label}: ${line.sku} sources missing`);
    assertTruthy(Array.isArray(line.coverage), `${label}: ${line.sku} coverage missing`);
  }
  return output;
}

function runScript(scriptName) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const childArgs = process.platform === 'win32' ? [] : ['run', scriptName];
  const childCommand = process.platform === 'win32' ? `${npmCommand} run ${scriptName}` : npmCommand;
  const start = Date.now();

  return new Promise((resolve) => {
    const child = spawn(childCommand, childArgs, {
      cwd: __dirname,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({
        code,
        durationMs: Date.now() - start,
        tail: `${stdout}\n${stderr}`.split(/\r?\n/).filter(Boolean).slice(-12),
      });
    });
    child.on('error', (error) => {
      resolve({ code: 1, durationMs: Date.now() - start, tail: [error.message] });
    });
  });
}

function assertReleaseNote() {
  assertTruthy(fs.existsSync(RELEASE_NOTE_PATH), 'release note exists');
  const note = fs.readFileSync(RELEASE_NOTE_PATH, 'utf8');
  assertContains(note, ['v1.0.0-mvp-rc1', 'MVP RC1', 'Regression suite'], 'release note');
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const root = await requestPath('/');
  if (root.statusCode === 302) {
    assertEqual(root.headers.Location, '/mvp', 'root route redirects to /mvp');
  } else {
    assertEqual(root.statusCode, 200, 'root route renders MVP entry');
    assertContains(root.body, ['Ik overleef', 'Start je pakketadvies'], 'root route MVP entry');
  }

  await assertRoute('/mvp', 200, ['Stel je noodpakketadvies samen', 'Advies bekijken'], '/mvp');
  await assertRoute(
    '/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72',
    200,
    ['Je pakketadvies', 'Kern van je pakket', 'Benodigde accessoires', 'Wat kun je nu doen?'],
    'MVP-startpakket route',
  );
  await assertRoute(
    '/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72',
    200,
    ['Je pakketadvies', 'Persoonlijke taken', 'Aandachtspunten', 'Wat kun je nu doen?'],
    'Complete 72u POC route',
  );
  await assertRoute('/internal/recommendation-poc?addon=drinkwater&tier=basis_plus', 200, ['Interne recommendation POC'], 'internal recommendation POC');
  await assertRoute('/internal/backoffice-poc', 200, ['Backoffice POC', 'QA dashboard summary'], 'internal backoffice POC');

  const startOutput = await checkRecommendationOutput(
    'package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72',
    'MVP-startpakket output',
    false,
  );
  const completeOutput = await checkRecommendationOutput(
    'package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72',
    'Complete 72u POC output',
    true,
  );

  assertReleaseNote();

  process.stdout.write('MVP RC: master suite ... ');
  const suite = await runScript('test:mvp-suite-poc');
  process.stdout.write(suite.code === 0 ? `groen (${suite.durationMs}ms)\n` : `rood (${suite.durationMs}ms)\n`);
  if (suite.code !== 0) {
    for (const line of suite.tail) console.error(`  ${line}`);
    fail('test:mvp-suite-poc failed inside MVP RC regression');
  }

  console.log(`mvp rc regression passed (start run ${startOutput.run.id}, complete run ${completeOutput.run.id})`);
  console.log('QA blocking=0; generated lines without sources=0; producttype mismatch=0; forbidden productitems=0; forbidden UI links/CTAs=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
