const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { handleRequest } = require('../apps/internal-poc/server');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const BLUEPRINT_PATH = path.join(ROOT, 'handoff', 'ikoverleef_agent_handoff_v1', 'docs', 'commerce_architecture_blueprint_v1.md');

const QUERY = 'package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=0&duration_hours=72';
const FORBIDDEN_ACTIVE_CTA_PATTERN = />\s*(bestel nu|afrekenen|betalen|in winkelmand|plaats bestelling)\s*</i;
const FORBIDDEN_LINK_PATTERN = /(?:href|action)="[^"]*(payment|betaling|cart|winkelmand|order|login|register)[^"]*"/i;
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

function assertNoForbiddenHtml(html, label) {
  if (FORBIDDEN_ACTIVE_CTA_PATTERN.test(html) || FORBIDDEN_LINK_PATTERN.test(html)) {
    fail(`${label}: forbidden checkout/payment/account/order CTA or link present`);
  }
}

function assertNoSecrets(text, label) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`${label}: possible Shopify token/secret present`);
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

async function requestJson(pathname) {
  const response = await requestPath(pathname);
  assertEqual(response.statusCode, 200, `${pathname}: HTTP status`);
  assertTruthy(String(response.headers['content-type'] || '').includes('application/json'), `${pathname}: JSON content-type`);
  try {
    return JSON.parse(response.body);
  } catch (error) {
    fail(`${pathname}: invalid JSON ${error.message}`);
  }
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
  process.stdout.write(`Commerce readiness: ${scriptName} ... `);
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

  assertTruthy(fs.existsSync(BLUEPRINT_PATH), 'commerce blueprint exists');
  const blueprint = fs.readFileSync(BLUEPRINT_PATH, 'utf8');
  assertContains(blueprint, ['headless', 'Shopify', 'Directus', 'Ownership matrix', 'one-way sync'], 'commerce blueprint');
  assertNoSecrets(blueprint, 'commerce blueprint');

  const health = await requestJson('/api/health');
  assertEqual(health.status, 'ok', '/api/health status');
  assertEqual(health.checkout_enabled, false, '/api/health checkout disabled');

  const recommendation = await requestJson(`/api/recommendation?${QUERY}`);
  assertEqual(recommendation.mode, 'preview', '/api/recommendation mode');
  assertTruthy(recommendation.input && recommendation.input.package_label === 'Basispakket', 'recommendation input labels');
  assertTruthy(recommendation.sections && Array.isArray(recommendation.sections.core_items), 'recommendation sections');
  assertTruthy(Array.isArray(recommendation.tasks), 'recommendation tasks');
  assertTruthy(Array.isArray(recommendation.warnings), 'recommendation warnings');
  assertTruthy(recommendation.summary && recommendation.summary.warning_count_label, 'recommendation summary');
  assertTruthy(!recommendation.run_id, 'public recommendation has no raw run_id');

  const commerce = await requestJson(`/api/recommendation/commerce-payload?${QUERY}`);
  assertEqual(commerce.commerce_mode, 'preview', 'commerce mode');
  assertEqual(commerce.commerce_provider_target, 'shopify_headless_future', 'commerce provider target');
  assertEqual(commerce.cart_eligible, false, 'commerce cart_eligible');
  assertTruthy(commerce.pricing && commerce.pricing.status === 'indicative_demo' && commerce.pricing.is_final === false, 'commerce pricing');
  assertTruthy(Array.isArray(commerce.lines) && commerce.lines.length > 0, 'commerce lines');
  for (const line of commerce.lines) {
    assertTruthy(line.sku && line.title && Number(line.quantity) >= 1 && line.section && line.commerce_action, `commerce line shape ${line.sku || line.title}`);
    assertEqual(line.cart_eligible, false, `commerce line cart_eligible ${line.sku}`);
    assertEqual(line.shopify_variant_id, null, `commerce line shopify variant ${line.sku}`);
  }
  assertTruthy(!commerce.cart_id && !commerce.checkout_url && !commerce.order_id, 'commerce payload creates no cart/checkout/order');

  const checklist = await requestJson(`/api/recommendation/checklist?${QUERY}`);
  assertEqual(checklist.mode, 'checklist_preview', 'checklist mode');
  assertTruthy(checklist.generated_at && !Number.isNaN(Date.parse(checklist.generated_at)), 'checklist generated_at');
  assertTruthy(Array.isArray(checklist.items) && checklist.items.length > 0, 'checklist items');
  assertTruthy(Array.isArray(checklist.tasks), 'checklist tasks');
  assertTruthy(Array.isArray(checklist.warnings), 'checklist warnings');

  const checklistPage = await requestPath(`/pakket/checklist?${QUERY}`);
  assertEqual(checklistPage.statusCode, 200, '/pakket/checklist status');
  assertContains(checklistPage.body, ['Printvriendelijke checklist', 'Print checklist', 'Checklist-preview'], '/pakket/checklist');
  assertNoForbiddenHtml(checklistPage.body, '/pakket/checklist');

  const funnel = await requestPath(`/pakket/advies?${QUERY}`);
  assertEqual(funnel.statusCode, 200, '/pakket/advies still works');
  assertContains(funnel.body, ['Adviesoverzicht', 'Open checklist'], '/pakket/advies checklist link');
  assertNoForbiddenHtml(funnel.body, '/pakket/advies');

  const codeText = fs.readFileSync(path.join(ROOT, 'apps', 'internal-poc', 'server.js'), 'utf8');
  assertNoSecrets(codeText, 'server.js');
  assertTruthy(!/Storefront API|Admin API|createCart|checkoutCreate|shopify[_-]?token/i.test(codeText), 'no Shopify API/client integration in server.js');

  assertEqual(recommendation.summary.qa_status, 'clean', 'recommendation QA clean');

  await assertScriptGreen('test:public-funnel-polish-poc');
  await assertScriptGreen('test:public-funnel-poc');
  await assertScriptGreen('test:mvp-rc-poc');

  console.log('commerce readiness API/checklist regression passed');
  console.log('api=ok; commerce_payload=preview; cart_eligible=false; checklist=ok; QA blocking=0; Shopify secrets=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
