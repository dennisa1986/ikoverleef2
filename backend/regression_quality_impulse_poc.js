const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const README_PATH = path.join(ROOT, 'README.md');
const ROOT_PACKAGE_PATH = path.join(ROOT, 'package.json');
const SERVER_PATH = path.join(ROOT, 'apps', 'internal-poc', 'server.js');

const QUERY = 'package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=0&duration_hours=72';

const SECRET_PATTERNS = [
  /shpat_[a-z0-9_]+/i,
  /shpss_[a-z0-9_]+/i,
  /SHOPIFY_[A-Z0-9_]*TOKEN\s*=/i,
  /SHOPIFY_[A-Z0-9_]*SECRET\s*=/i,
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

function assertNoSecrets(text, label) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`${label}: possible Shopify token/secret present`);
  }
}

function freshHandleRequest() {
  delete require.cache[require.resolve('../apps/internal-poc/server')];
  return require('../apps/internal-poc/server').handleRequest;
}

async function requestPath(handleRequest, pathname) {
  return new Promise((resolve, reject) => {
    const req = { url: pathname, headers: { host: '127.0.0.1:4173' } };
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

async function requestJson(handleRequest, pathname) {
  const response = await requestPath(handleRequest, pathname);
  assertEqual(response.statusCode, 200, `${pathname}: HTTP status`);
  assertTruthy(String(response.headers['content-type'] || '').includes('application/json'), `${pathname}: JSON content-type`);
  try {
    return { payload: JSON.parse(response.body), body: response.body };
  } catch (error) {
    fail(`${pathname}: invalid JSON ${error.message}`);
  }
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const serverSource = fs.readFileSync(SERVER_PATH, 'utf8');
  assertNoSecrets(serverSource, 'server.js');
  assertTruthy(!/Storefront API|Admin API|createCart|checkoutCreate|shopify[_-]?token/i.test(serverSource), 'no Shopify API/client integration in server.js');
  assertTruthy(serverSource.includes('future_commerce_handoff'), 'server.js: future_commerce_handoff present');
  assertTruthy(!serverSource.includes('future_shopify_checkout'), 'server.js: future_shopify_checkout removed');
  assertTruthy(!/onclick="window\.print\(\)"/.test(serverSource), 'server.js: inline onclick window.print removed');

  const readme = fs.readFileSync(README_PATH, 'utf8');
  assertContains(readme, [
    'public funnel',
    '/pakket/checklist',
    '/api/recommendation',
    'commerce payload',
    'checkout-preview',
    'v1.1.1-quality-impulse',
  ], 'README.md');

  const rootPackage = JSON.parse(fs.readFileSync(ROOT_PACKAGE_PATH, 'utf8'));
  assertEqual(rootPackage.version, '1.1.1-quality-impulse', 'root package version');
  assertTruthy(rootPackage.scripts && rootPackage.scripts['test:quality-gate'], 'root test:quality-gate script');
  assertTruthy(rootPackage.scripts['test:all-poc'].includes('test:commerce-readiness-poc'), 'test:all-poc covers commerce-readiness');
  assertTruthy(rootPackage.scripts['test:all-poc'].includes('test:public-funnel-poc'), 'test:all-poc covers public-funnel');
  assertTruthy(rootPackage.scripts['test:all-poc'].includes('test:quality-impulse-poc'), 'test:all-poc covers quality-impulse');

  delete process.env.IOE_ALLOW_PUBLIC_DEBUG;
  delete process.env.POC_PUBLIC_DEBUG;
  let handleRequest = freshHandleRequest();

  const apiHealth = await requestJson(handleRequest, '/api/health');
  assertEqual(apiHealth.payload.status, 'ok', '/api/health status');
  assertEqual(apiHealth.payload.checkout_enabled, false, '/api/health checkout_enabled');
  assertEqual(apiHealth.payload.commerce_mode, 'preview', '/api/health commerce_mode');
  assertEqual(apiHealth.payload.mode, 'poc', '/api/health mode');

  const health = await requestJson(handleRequest, '/health');
  assertEqual(health.payload.status, apiHealth.payload.status, '/health status matches /api/health');
  assertEqual(health.payload.checkout_enabled, apiHealth.payload.checkout_enabled, '/health checkout_enabled matches');
  assertEqual(health.payload.commerce_mode, apiHealth.payload.commerce_mode, '/health commerce_mode matches');
  assertEqual(health.payload.mode, apiHealth.payload.mode, '/health mode matches');

  assertTruthy(!apiHealth.body.includes('\n  '), '/api/health is compact JSON by default');

  const recoNoFlag = await requestJson(handleRequest, `/api/recommendation?${QUERY}&debug=true&internal=true`);
  assertTruthy(!recoNoFlag.payload.debug, '/api/recommendation: no debug object without env flag');
  assertTruthy(!recoNoFlag.payload.qa_summary, '/api/recommendation: no raw qa_summary leaked');
  assertTruthy(!recoNoFlag.payload.run_id, '/api/recommendation: no run_id leaked');
  assertTruthy(!recoNoFlag.body.includes('\n  '), '/api/recommendation is compact JSON without env flag');

  process.env.IOE_ALLOW_PUBLIC_DEBUG = '1';
  handleRequest = freshHandleRequest();
  const recoWithFlag = await requestJson(handleRequest, `/api/recommendation?${QUERY}&debug=true`);
  assertTruthy(recoWithFlag.payload.debug, '/api/recommendation: debug object present with env flag');
  assertTruthy(recoWithFlag.payload.debug.run_id, '/api/recommendation: debug.run_id present (not undefined)');
  assertTruthy(recoWithFlag.payload.debug.qa_summary, '/api/recommendation: debug.qa_summary present');

  const commerce = await requestJson(handleRequest, `/api/recommendation/commerce-payload?${QUERY}`);
  assertEqual(commerce.payload.cart_eligible, false, 'commerce: cart_eligible=false');
  assertTruthy(!commerce.payload.cart_id, 'commerce: no cart_id');
  assertTruthy(!commerce.payload.checkout_url, 'commerce: no checkout_url');
  assertTruthy(!commerce.payload.order_id, 'commerce: no order_id');
  assertTruthy(Array.isArray(commerce.payload.next_actions), 'commerce: next_actions is array');
  assertTruthy(!commerce.payload.next_actions.includes('future_shopify_checkout'), 'commerce: future_shopify_checkout removed');
  const hasHandoff = commerce.payload.next_actions.includes('future_commerce_handoff')
    || commerce.payload.next_actions.includes('future_shopify_handoff');
  assertTruthy(hasHandoff, 'commerce: future_commerce_handoff (or future_shopify_handoff) present');
  for (const line of commerce.payload.lines) {
    assertEqual(line.cart_eligible, false, `commerce line cart_eligible ${line.sku}`);
    assertEqual(line.shopify_variant_id, null, `commerce line shopify_variant_id ${line.sku}`);
  }

  const checklistPage = await requestPath(handleRequest, `/pakket/checklist?${QUERY}`);
  assertEqual(checklistPage.statusCode, 200, '/pakket/checklist status');
  assertTruthy(!/onclick="window\.print\(\)"/.test(checklistPage.body), '/pakket/checklist: no inline onclick window.print');
  assertContains(checklistPage.body, ['ioe-print-button', "addEventListener('click'"], '/pakket/checklist: print handler bound via addEventListener');

  delete process.env.IOE_ALLOW_PUBLIC_DEBUG;
  handleRequest = freshHandleRequest();
  const recoNoFlagAgain = await requestJson(handleRequest, `/api/recommendation?${QUERY}&debug=true`);
  assertTruthy(!recoNoFlagAgain.payload.debug, '/api/recommendation: debug suppressed again after env flag removed');

  console.log('quality impulse regression passed');
  console.log('health=consistent; debug_gating=ok; future_commerce_handoff=ok; compact_json=ok; print_handler=ok; secrets=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
