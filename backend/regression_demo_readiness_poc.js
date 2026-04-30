const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { handleRequest } = require('../apps/internal-poc/server');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const FILES = {
  readme: path.join(ROOT, 'README.md'),
  contributing: path.join(ROOT, 'CONTRIBUTING.md'),
  rootEnvExample: path.join(ROOT, '.env.example'),
  backendEnvExample: path.join(__dirname, '.env.example'),
  startScript: path.join(ROOT, 'scripts', 'start_mvp.js'),
  acceptanceNote: path.join(ROOT, 'handoff', 'ikoverleef_agent_handoff_v1', 'release_notes', 'acceptance_note_v1.0.0_mvp_rc1.md'),
  releaseNote: path.join(ROOT, 'handoff', 'ikoverleef_agent_handoff_v1', 'release_notes', 'release_note_v1.0.1_demo_readiness_baseline.md'),
  rootPackage: path.join(ROOT, 'package.json'),
};

const FORBIDDEN_LINK_OR_CTA_PATTERN = /(?:href|action)="[^"]*(checkout|cart|winkelmand|betaling|payment|account|login|register)[^"]*"|>\s*(bestel nu|checkout|winkelmand|betalen|login|registreer|register)\s*</i;
const SECRET_PATTERNS = [
  /postgresql:\/\/[^:\s]+:[^<\s][^@\s]+@/i,
  /password\s*=\s*(?!<password>|changeme|example|placeholder)/i,
  /secret\s*=\s*(?!<secret>|changeme|example|placeholder)/i,
  /api[_-]?key\s*=\s*(?!<api-key>|changeme|example|placeholder)/i,
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

function assertFileExists(filePath, label) {
  assertTruthy(fs.existsSync(filePath), `${label} exists`);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(text, expected, label) {
  for (const value of expected) {
    if (!text.includes(value)) fail(`${label}: missing ${value}`);
  }
}

function assertNoSecrets(text, label) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`${label}: looks like it contains a real secret`);
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

function checkDocumentation() {
  assertFileExists(FILES.readme, 'README.md');
  const readme = readText(FILES.readme);
  assertContains(readme, ['Ik overleef', 'npm run dev:mvp', 'IOE_PG_URL', '/mvp', 'test:all-poc'], 'README.md');
  assertNoSecrets(readme, 'README.md');

  assertFileExists(FILES.contributing, 'CONTRIBUTING.md');
  const contributing = readText(FILES.contributing);
  assertContains(contributing, ['specificatie', 'implementation mapping', 'mapping-check', 'Geen schemawijzigingen', 'Commit geen'], 'CONTRIBUTING.md');
  assertNoSecrets(contributing, 'CONTRIBUTING.md');

  assertFileExists(FILES.acceptanceNote, 'acceptance note');
  assertContains(readText(FILES.acceptanceNote), ['v1.0.0-mvp-rc1', 'functioneel geaccepteerd', 'geen checkout'], 'acceptance note');

  assertFileExists(FILES.releaseNote, 'release note');
  assertContains(readText(FILES.releaseNote), ['v1.0.1-demo-readiness', 'demo-ready', 'npm run test:demo-readiness-poc'], 'release note');
}

function checkEnvironmentFiles() {
  assertFileExists(FILES.rootEnvExample, '.env.example');
  assertFileExists(FILES.backendEnvExample, 'backend/.env.example');
  assertFileExists(FILES.startScript, 'scripts/start_mvp.js');
  assertFileExists(FILES.rootPackage, 'package.json');

  for (const file of [FILES.rootEnvExample, FILES.backendEnvExample, FILES.startScript, FILES.rootPackage]) {
    const text = readText(file);
    assertContains(text, file.endsWith('.json') ? ['dev:mvp'] : ['IOE_PG_URL'], path.basename(file));
    assertNoSecrets(text, path.basename(file));
  }
}

async function checkRoutes() {
  const mvp = await requestPath('/mvp');
  assertEqual(mvp.statusCode, 200, '/mvp status');
  assertContains(mvp.body, ['Configurator', 'Advies bekijken'], '/mvp');
  assertNoForbiddenLinksOrCtas(mvp.body, '/mvp');

  const recommendation = await requestPath('/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72');
  assertEqual(recommendation.statusCode, 200, '/mvp/recommendation status');
  assertContains(recommendation.body, ['Je pakketadvies', 'Kernitems', 'Interne QA-status'], '/mvp/recommendation');
  assertNoForbiddenLinksOrCtas(recommendation.body, '/mvp/recommendation');

  const invalidInput = await requestPath('/mvp/recommendation?tier=bogus&addons=unknown&adults=-4&children=-2&pets=-3&duration_hours=1');
  assertEqual(invalidInput.statusCode, 200, 'invalid input fallback status');
  assertContains(invalidInput.body, ['Je pakketadvies', 'Kernitems'], 'invalid input fallback');
  assertNoForbiddenLinksOrCtas(invalidInput.body, 'invalid input fallback');
}

async function checkMvpRcRegression() {
  process.stdout.write('Demo readiness: MVP RC regression ... ');
  const result = await runScript('test:mvp-rc-poc');
  process.stdout.write(result.code === 0 ? `groen (${result.durationMs}ms)\n` : `rood (${result.durationMs}ms)\n`);
  if (result.code !== 0) {
    for (const line of result.tail) console.error(`  ${line}`);
    fail('test:mvp-rc-poc failed inside demo readiness regression');
  }
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  checkDocumentation();
  checkEnvironmentFiles();
  await checkRoutes();
  await checkMvpRcRegression();

  console.log('demo readiness regression passed');
  console.log('README=ok; CONTRIBUTING=ok; env examples=ok; startscript=ok; invalid input=ok; forbidden UI links/CTAs=0');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
