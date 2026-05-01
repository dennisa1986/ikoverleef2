const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  handleRequest,
  ensureRecommendationData,
  funnelInputFromSearchParams,
} = require('../apps/internal-poc/server');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const PUBLIC_ROUTES = [
  '/',
  '/mvp',
  '/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72',
  '/pakket/start',
  '/pakket/addons?tier=basis_plus',
  '/pakket/huishouden?package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72',
  '/pakket/advies?package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=0&duration_hours=72',
  '/pakket/account?package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72',
  '/pakket/checkout?package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=0&duration_hours=72&account_intent=later',
];

const FORBIDDEN_VISIBLE_TERMS = [
  'basis_plus',
  'basispakket',
  'voedsel_bereiding',
  'hygiene_sanitatie_afval',
  'ehbo_persoonlijke_zorg',
  'warmte_droog_shelter_light',
  'taken_profielen',
  'priority must',
  'priority should',
  'documenten-checklist',
  'persoonlijke-gereedheid-checks',
  'hygiene_contamination_risk',
  'storage_safety',
  'child_safety',
  'dosage_warning',
  'medical_claim_limit',
  'fire_risk',
  'ventilation',
  'indoor_use',
  'fuel_compatibility',
  'expiry_sensitive',
  'backup/weak coverage',
  'primary sufficient',
  'not primary sufficient',
  'weak coverage',
  'controle zonder blokkades',
];

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  throw new Error(message);
}

function assertTruthy(value, label) {
  if (!value) fail(label);
}

function assertEqual(actual, expected, label) {
  if (String(actual) !== String(expected)) fail(`${label}: expected ${expected}, got ${actual}`);
}

function assertContains(text, expected, label) {
  for (const value of expected) {
    if (!text.includes(value)) fail(`${label}: missing ${value}`);
  }
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
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
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
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

async function assertScriptGreen(scriptName) {
  process.stdout.write(`Public funnel polish: ${scriptName} ... `);
  const result = await runScript(scriptName);
  process.stdout.write(result.code === 0 ? `groen (${result.durationMs}ms)\n` : `rood (${result.durationMs}ms)\n`);
  if (result.code !== 0) {
    for (const line of result.tail) console.error(`  ${line}`);
    fail(`${scriptName} failed`);
  }
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  for (const route of PUBLIC_ROUTES) {
    const response = await requestPath(route);
    assertEqual(response.statusCode, 200, `${route}: HTTP status`);
    const text = visibleText(response.body);
    for (const term of FORBIDDEN_VISIBLE_TERMS) {
      if (text.includes(term)) fail(`${route}: visible forbidden term ${term}`);
    }
  }

  const recommendation = await requestPath('/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=0&duration_hours=72');
  const recommendationText = visibleText(recommendation.body);
  assertContains(recommendationText, ['Basispakket', 'Basis+', 'Aandachtspunten', 'uniek', 'Print checklist', 'Advies opgehaald'], '/mvp/recommendation polish');
  assertTruthy(!recommendationText.includes('Bekijk interne onderbouwing'), 'debug link hidden without debug flag');

  const recommendationDebug = await requestPath('/mvp/recommendation?debug=true&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72');
  assertContains(visibleText(recommendationDebug.body), ['Bekijk interne onderbouwing'], 'debug link visible with debug flag');

  const output = await ensureRecommendationData(funnelInputFromSearchParams(new URLSearchParams('package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=0&duration_hours=72')));
  assertEqual(output.qa_summary.blocking_total, 0, 'QA blocking');
  assertEqual(output.qa_summary.generated_lines_without_sources, 0, 'generated lines without sources');
  assertEqual(output.qa_summary.generated_line_producttype_mismatch, 0, 'generated line producttype mismatch');

  await assertScriptGreen('test:public-funnel-poc');
  await assertScriptGreen('test:end-user-framing-poc');
  await assertScriptGreen('test:mvp-rc-poc');

  console.log('public funnel polish regression passed');
  console.log('sluglabels=ok; tasklabels=ok; warninglabels=ok; counts=consistent; debuglink=guarded; print=ok; QA blocking=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
