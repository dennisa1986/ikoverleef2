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

const REGRESSION_SCRIPTS = [
  'test:stroomuitval-poc',
  'test:drinkwater-poc',
  'test:voedsel-poc',
  'test:hygiene-sanitatie-poc',
  'test:ehbo-poc',
  'test:warmte-droog-shelter-poc',
  'test:evacuatie-poc',
  'test:taken-profielen-poc',
  'test:engine-hardening-poc',
  'test:backoffice-hardening-poc',
  'test:ui-mvp-poc',
];

const ROUTE_SMOKES = [
  {
    path: '/mvp',
    label: 'MVP configurator',
    mustContain: ['Stel je noodpakketadvies samen', 'Advies bekijken'],
  },
  {
    path: '/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72',
    label: 'MVP recommendation',
    mustContain: ['Je pakketadvies', 'Kern van je pakket', 'Wat kun je nu doen?'],
  },
  {
    path: '/internal/recommendation-poc?addon=drinkwater&tier=basis_plus',
    label: 'Recommendation POC drinkwater',
    mustContain: ['Interne recommendation POC'],
  },
  {
    path: '/internal/recommendation-poc?addon=stroomuitval,drinkwater,evacuatie,taken_profielen&tier=basis_plus&adults=2&children=1&pets=1&duration_hours=72',
    label: 'Recommendation POC multi-add-on',
    mustContain: ['Interne recommendation POC'],
  },
  {
    path: '/internal/backoffice-poc',
    label: 'Backoffice POC',
    mustContain: ['Backoffice POC', 'QA dashboard summary'],
  },
  {
    path: '/internal/backoffice-poc?domain=qa',
    label: 'Backoffice QA',
    mustContain: ['QA dashboard summary'],
  },
  {
    path: '/internal/backoffice-poc?domain=readiness',
    label: 'Backoffice readiness',
    mustContain: ['Product readiness', 'Candidate readiness'],
  },
];

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

const FORBIDDEN_UI_TERMS = [
  'betaling',
  'winkelmand',
  'bestel nu',
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

function assertNoForbiddenUiTerms(text, label) {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_UI_TERMS) {
    if (lower.includes(term)) fail(`${label}: contains forbidden UI term ${term}`);
  }
  if (/href="[^"]*(checkout|cart|winkelmand|payment|betaling|account)[^"]*"/i.test(text)) {
    fail(`${label}: contains forbidden checkout/payment/account link`);
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

function hasAnyLine(output, patterns) {
  return output.lines.some((line) => {
    const haystack = `${line.sku || ''} ${line.title || ''} ${line.product_type_slug || ''} ${line.primary_reason || ''}`.toLowerCase();
    return patterns.some((pattern) => haystack.includes(pattern));
  });
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

async function checkMvpStartPackage() {
  const output = await ensureRecommendationData(inputFromQuery(
    'package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72',
  ));
  assertSectionShape(output, 'MVP-startpakket');
  assertTruthy(output.sections.core_items.length > 0, 'MVP-startpakket: core items aanwezig');
  assertTruthy(output.sections.accessories.length > 0, 'MVP-startpakket: accessories aanwezig');
  assertTruthy(Array.isArray(output.warnings), 'MVP-startpakket: warnings-sectie bestaat');
  assertQaClean(output, 'MVP-startpakket');
  assertForbiddenProductItemsAbsent(output, 'MVP-startpakket');
  return output.run.id;
}

async function checkComplete72hPoc() {
  const output = await ensureRecommendationData(inputFromQuery(
    'package=basispakket&tier=basis_plus&addons=stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72',
  ));
  assertSectionShape(output, 'Complete 72u POC');
  assertTruthy(output.sections.core_items.length > 0, 'Complete 72u POC: core_items bevat regels');
  assertTruthy(output.sections.accessories.length > 0, 'Complete 72u POC: accessories bevat regels');
  assertTruthy(output.tasks.length > 0, 'Complete 72u POC: tasks aanwezig');
  assertTruthy(Array.isArray(output.warnings), 'Complete 72u POC: warnings-sectie bestaat');
  assertQaClean(output, 'Complete 72u POC');
  assertForbiddenProductItemsAbsent(output, 'Complete 72u POC');
  return output.run.id;
}

async function checkBasisMinimal() {
  const output = await ensureRecommendationData(inputFromQuery(
    'package=basispakket&tier=basis&addons=stroomuitval,drinkwater&adults=1&children=0&pets=0&duration_hours=72',
  ));
  assertSectionShape(output, 'Basis minimal sanity');
  assertTruthy(hasAnyLine(output, ['water', 'drink']), 'Basis minimal sanity: water blijft aanwezig');
  assertTruthy(hasAnyLine(output, ['zaklamp', 'lamp', 'batterij', 'radio', 'powerbank']), 'Basis minimal sanity: stroomuitval blijft aanwezig');
  assertQaClean(output, 'Basis minimal sanity');
  assertForbiddenProductItemsAbsent(output, 'Basis minimal sanity');
  return output.run.id;
}

async function runRouteSmokeTests() {
  const results = [];
  for (const route of ROUTE_SMOKES) {
    const response = await requestPath(route.path);
    assertEqual(response.statusCode, 200, `${route.label}: HTTP status`);
    assertContains(response.body, route.mustContain, route.label);
    assertNoForbiddenUiTerms(response.body, route.label);
    results.push(route.label);
  }
  return results;
}

function runScript(scriptName) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const start = Date.now();

  return new Promise((resolve) => {
    const childArgs = process.platform === 'win32' ? [] : ['run', scriptName];
    const childCommand = process.platform === 'win32' ? `${npmCommand} run ${scriptName}` : npmCommand;
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
      const durationMs = Date.now() - start;
      const lines = `${stdout}\n${stderr}`
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const interestingLines = lines
        .filter((line) => /passed|QA blocking|run|runs|recommendation_run/i.test(line))
        .slice(-6);
      resolve({
        scriptName,
        code,
        durationMs,
        output: interestingLines,
        errorTail: lines.slice(-10),
      });
    });
    child.on('error', (error) => {
      resolve({
        scriptName,
        code: 1,
        durationMs: Date.now() - start,
        output: [],
        errorTail: [error.message],
      });
    });
  });
}

async function runRegressionScripts() {
  const results = [];
  for (const scriptName of REGRESSION_SCRIPTS) {
    process.stdout.write(`- ${scriptName} ... `);
    const result = await runScript(scriptName);
    results.push(result);
    process.stdout.write(result.code === 0 ? `groen (${result.durationMs}ms)\n` : `rood (${result.durationMs}ms)\n`);
    for (const line of result.output) {
      console.log(`    ${line}`);
    }
    if (result.code !== 0) {
      for (const line of result.errorTail) {
        console.error(`    ${line}`);
      }
    }
  }
  return results;
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  console.log('MVP suite: bestaande regressions');
  const scriptResults = await runRegressionScripts();
  const failedScripts = scriptResults.filter((result) => result.code !== 0);

  console.log('\nMVP suite: scenario sanity checks');
  const startRun = await checkMvpStartPackage();
  console.log(`- MVP-startpakket groen (run ${startRun})`);
  const completeRun = await checkComplete72hPoc();
  console.log(`- Complete 72u POC groen (run ${completeRun})`);
  const minimalRun = await checkBasisMinimal();
  console.log(`- Basis minimal sanity groen (run ${minimalRun})`);

  console.log('\nMVP suite: route smoke tests');
  const routes = await runRouteSmokeTests();
  for (const route of routes) {
    console.log(`- ${route} groen`);
  }

  if (failedScripts.length) {
    throw new Error(`MVP suite failed: ${failedScripts.map((result) => result.scriptName).join(', ')}`);
  }

  console.log('\nMVP regression suite passed');
  console.log(`scripts=${REGRESSION_SCRIPTS.length}; scenario_runs=${[startRun, completeRun, minimalRun].join(', ')}; routes=${routes.length}; QA blocking=0; generated lines without sources=0; producttype mismatch=0`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
