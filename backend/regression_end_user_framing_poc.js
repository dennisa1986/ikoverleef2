const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { handleRequest } = require('../apps/internal-poc/server');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const FORBIDDEN_LINK_OR_CTA_PATTERN = /(?:href|action)="[^"]*(checkout|cart|winkelmand|betaling|payment|account|login|register)[^"]*"|>\s*(bestel nu|afrekenen|in winkelmand|checkout|winkelmand|betalen|login|registreer|register)\s*</i;
const INTERNAL_TERMS = [
  'scenario_need',
  'coverage_strength',
  'Run ID',
  'Run-ID',
  'Interne QA-status',
  'accessory_requirement',
  'counted_as_sufficient',
  'product_type_slug',
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
  if (String(actual) !== String(expected)) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertContains(text, expected, label) {
  for (const value of expected) {
    if (!text.includes(value)) fail(`${label}: missing ${value}`);
  }
}

function assertNotContains(text, forbidden, label) {
  for (const value of forbidden) {
    if (text.includes(value)) fail(`${label}: contains internal term ${value}`);
  }
}

function assertNoForbiddenLinksOrCtas(html, label) {
  if (FORBIDDEN_LINK_OR_CTA_PATTERN.test(html)) {
    fail(`${label}: forbidden checkout/payment/account/cart link or CTA present`);
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
        tail: `${stdout}\n${stderr}`.split(/\r?\n/).filter(Boolean).slice(-10),
      });
    });
    child.on('error', (error) => {
      resolve({ code: 1, durationMs: Date.now() - start, tail: [error.message] });
    });
  });
}

async function assertScriptGreen(scriptName) {
  process.stdout.write(`End-user framing: ${scriptName} ... `);
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

  const configurator = await requestPath('/mvp');
  assertEqual(configurator.statusCode, 200, '/mvp status');
  assertContains(configurator.body, [
    'Stel je noodpakketadvies samen',
    'Dit is een adviespreview, nog geen webshop of bestelling.',
    'Basiszekerheid',
    'Zorg &amp; huishouden',
    'Omgeving &amp; verplaatsing',
    'Persoonlijke checks',
  ], '/mvp end-user framing');
  assertNoForbiddenLinksOrCtas(configurator.body, '/mvp');

  const recommendation = await requestPath('/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72');
  assertEqual(recommendation.statusCode, 200, '/mvp/recommendation status');
  assertContains(recommendation.body, [
    'Dit advies laat zien welke producten en acties logisch zijn voor jouw gekozen situatie.',
    'Kern van je pakket',
    'Benodigde accessoires',
    'Backup en ondersteuning',
    'Persoonlijke taken',
    'Aandachtspunten',
    'Wat kun je nu doen?',
    'Print of bewaar deze checklist',
    'Demo-advies',
  ], '/mvp/recommendation end-user framing');
  assertNotContains(recommendation.body, INTERNAL_TERMS, '/mvp/recommendation');
  assertNoForbiddenLinksOrCtas(recommendation.body, '/mvp/recommendation');
  assertTruthy((recommendation.body.match(/<article class="item-card">/g) || []).length > 0, 'product items remain visible');
  assertTruthy(recommendation.body.includes('Water &amp; voedselveiligheid') || recommendation.body.includes('Opslag &amp; houdbaarheid') || recommendation.body.includes('Vuur, gas &amp; gebruiksveiligheid'), 'warnings are grouped');
  assertTruthy(recommendation.body.includes('Toon meer aandachtspunten') || recommendation.body.includes('Belangrijke waarschuwingen, gegroepeerd en ontdubbeld.'), 'warnings are grouped/deduped');

  const internalRecommendation = await requestPath('/internal/recommendation-poc?addon=drinkwater&tier=basis_plus');
  assertEqual(internalRecommendation.statusCode, 200, '/internal/recommendation-poc status');
  assertContains(internalRecommendation.body, ['Interne recommendation POC'], '/internal/recommendation-poc');

  const backoffice = await requestPath('/internal/backoffice-poc');
  assertEqual(backoffice.statusCode, 200, '/internal/backoffice-poc status');
  assertContains(backoffice.body, ['Backoffice POC', 'QA dashboard summary'], '/internal/backoffice-poc');

  await assertScriptGreen('test:demo-readiness-poc');
  await assertScriptGreen('test:mvp-rc-poc');

  console.log('end-user framing regression passed');
  console.log('routes=ok; expectation=ok; next_step=ok; internal_terms=hidden; forbidden UI links/CTAs=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
