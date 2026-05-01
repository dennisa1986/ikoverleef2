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

const FORBIDDEN_ACTIVE_CTA_PATTERN = />\s*(bestel nu|afrekenen|betalen|in winkelmand|plaats bestelling)\s*</i;
const FORBIDDEN_LINK_PATTERN = /(?:href|action)="[^"]*(payment|betaling|cart|winkelmand|order|login|register)[^"]*"/i;

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

function assertEqual(actual, expected, label) {
  if (String(actual) !== String(expected)) fail(`${label}: expected ${expected}, got ${actual}`);
}

function assertTruthy(value, label) {
  if (!value) fail(label);
}

function assertContains(text, expected, label) {
  for (const value of expected) {
    if (!text.includes(value)) fail(`${label}: missing ${value}`);
  }
}

function assertNoForbiddenCommercialScope(html, label) {
  if (FORBIDDEN_ACTIVE_CTA_PATTERN.test(html) || FORBIDDEN_LINK_PATTERN.test(html)) {
    fail(`${label}: forbidden checkout/payment/account/cart/order CTA or link present`);
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

async function assertRoute(pathname, expectedText, label) {
  const response = await requestPath(pathname);
  assertEqual(response.statusCode, 200, `${label}: HTTP status`);
  assertContains(response.body, expectedText, label);
  assertNoForbiddenCommercialScope(response.body, label);
  return response;
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
  process.stdout.write(`Public funnel: ${scriptName} ... `);
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

  const query = 'tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72';
  const fullQuery = `package=basispakket&${query}`;

  await assertRoute('/', ['Ik overleef', 'Start je pakketadvies', 'uitlegbaar noodpakketadvies'], 'homepage');
  await assertRoute('/pakket/start', ['Stap 1', 'Basis', 'Basis+', 'indicatief vanaf €149', 'indicatief vanaf €249'], 'pakket start');
  await assertRoute('/pakket/addons?tier=basis_plus', ['Waar wil je op voorbereid zijn?', 'Basiszekerheid', 'Zorg &amp; huishouden', 'Omgeving &amp; verplaatsing', 'Persoonlijke checks'], 'pakket addons');
  await assertRoute(`/pakket/huishouden?${fullQuery}`, ['Volwassenen', 'Kinderen', 'Huisdieren', 'Duur in uren', 'Standaard 72 uur'], 'pakket huishouden');
  await assertRoute(`/pakket/advies?${fullQuery}`, ['Adviesoverzicht', 'Kernitems', 'Accessoires', 'Backup/ondersteuning', 'Taken en aandachtspunten'], 'pakket advies');
  await assertRoute(`/pakket/account?${fullQuery}`, ['houdbaarheidsdata bijhouden', 'Herinneringen', 'Pakket jaarlijks herzien', 'Ga verder als gast', 'Gratis account later activeren', 'geen account aangemaakt en niets opgeslagen'], 'pakket account');
  await assertRoute(`/pakket/checkout?${fullQuery}&account_intent=later`, ['Checkout-preview', 'Geen bestelling', 'Demo-prijsindicatie', 'Samenvatting items', 'Taken/aandachtspunten', 'Accountkeuze'], 'pakket checkout');

  await assertRoute('/mvp', ['Stel je noodpakketadvies samen', 'Advies bekijken'], '/mvp');
  await assertRoute(`/mvp/recommendation?${query}`, ['Je pakketadvies', 'Kern van je pakket', 'Wat kun je nu doen?'], '/mvp/recommendation');
  await assertRoute('/internal/recommendation-poc?addon=drinkwater&tier=basis_plus', ['Interne recommendation POC'], '/internal/recommendation-poc');
  await assertRoute('/internal/backoffice-poc', ['Backoffice POC', 'QA dashboard summary'], '/internal/backoffice-poc');

  const output = await ensureRecommendationData(funnelInputFromSearchParams(new URLSearchParams(fullQuery)));
  assertEqual(output.qa_summary.blocking_total, 0, 'QA blocking');
  assertEqual(output.qa_summary.generated_lines_without_sources, 0, 'generated lines without sources');
  assertEqual(output.qa_summary.generated_line_producttype_mismatch, 0, 'generated line producttype mismatch');
  assertTruthy(output.sections.core_items.length > 0, 'recommendation core items visible');

  await assertScriptGreen('test:end-user-framing-poc');
  await assertScriptGreen('test:mvp-rc-poc');

  console.log('public funnel checkout shell regression passed');
  console.log('routes=ok; recommendation-output=ok; demo-prices=indicative; QA blocking=0; forbidden UI links/CTAs=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
