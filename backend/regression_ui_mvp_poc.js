const fs = require('fs');
const path = require('path');
const {
  handleRequest,
  mvpInputFromSearchParams,
  renderMvpConfiguratorPage,
  renderMvpRecommendationPage,
  ensureRecommendationData,
} = require('../apps/internal-poc/server');

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

function assertTruthy(value, label) {
  if (!value) fail(label);
}

function assertNotContains(text, forbidden, label) {
  const lower = text.toLowerCase();
  for (const word of forbidden) {
    if (lower.includes(word)) fail(`${label}: contains forbidden UI term ${word}`);
  }
}

function requestPath(pathname) {
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

function assertMvpSections(html) {
  assertTruthy(html.includes('Kern van je pakket'), 'core section visible');
  assertTruthy(html.includes('Accessoires'), 'Accessories section visible');
  assertTruthy(html.includes('Backup en ondersteuning'), 'supporting/backup section visible');
  assertTruthy(html.includes('Persoonlijke taken'), 'Tasks section visible');
  assertTruthy(html.includes('Aandachtspunten'), 'Warnings section visible');
  assertTruthy(html.includes('Wat kun je nu doen?'), 'next steps visible');
}

async function main() {
  loadEnvFile();
  if (!process.env.IOE_PG_URL) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const basisInput = mvpInputFromSearchParams(new URLSearchParams('tier=basis&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72'));
  const basisPlusInput = mvpInputFromSearchParams(new URLSearchParams('tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72'));

  const configuratorHtml = renderMvpConfiguratorPage(basisPlusInput);
  assertTruthy(configuratorHtml.includes('Stel je noodpakketadvies samen'), 'configurator render works');
  assertTruthy(configuratorHtml.includes('Advies bekijken'), 'configurator CTA visible');
  assertNotContains(configuratorHtml, ['checkout', 'betaling', 'winkelmand', 'account'], 'configurator');

  const basisOutput = await ensureRecommendationData(basisInput);
  const basisHtml = renderMvpRecommendationPage(basisOutput);
  assertTruthy(basisHtml.includes('Je pakketadvies'), 'basis recommendation render works');
  assertTruthy(basisOutput.input.tier_slug === 'basis', 'Basis run works');
  assertTruthy(basisOutput.sections.core_items.length > 0, 'Basis core items exist');
  assertMvpSections(basisHtml);
  assertNotContains(basisHtml, ['checkout', 'betaling', 'winkelmand', 'account'], 'basis recommendation');

  const basisPlusOutput = await ensureRecommendationData(basisPlusInput);
  const basisPlusHtml = renderMvpRecommendationPage(basisPlusOutput);
  assertTruthy(basisPlusOutput.input.tier_slug === 'basis_plus', 'Basis+ run works');
  assertTruthy(basisPlusOutput.input.addon_slugs.length > 1, 'multi-add-on run works');
  assertTruthy(basisPlusOutput.input.household_children === 1, 'children parameter processed');
  assertTruthy(basisPlusOutput.input.household_pets === 1, 'pets parameter processed');
  assertTruthy(basisPlusOutput.input.duration_hours === 72, 'duration parameter processed');
  assertTruthy(basisPlusOutput.tasks.length > 0, 'tasks present');
  assertTruthy(Array.isArray(basisPlusOutput.warnings), 'warnings present');
  assertMvpSections(basisPlusHtml);
  assertNotContains(basisPlusHtml, ['checkout', 'betaling', 'winkelmand', 'account'], 'basis_plus recommendation');

  const mvpRoute = await requestPath('/mvp');
  assertTruthy(mvpRoute.statusCode === 200, '/mvp route returns 200');
  assertTruthy(mvpRoute.body.includes('Stel je noodpakketadvies samen'), '/mvp route renders configurator');

  const recommendationRoute = await requestPath('/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72');
  assertTruthy(recommendationRoute.statusCode === 200, '/mvp/recommendation route returns 200');
  assertMvpSections(recommendationRoute.body);

  const internalRecommendation = await requestPath('/internal/recommendation-poc?addon=drinkwater&tier=basis_plus');
  assertTruthy(internalRecommendation.statusCode === 200, '/internal/recommendation-poc still works');

  const backoffice = await requestPath('/internal/backoffice-poc');
  assertTruthy(backoffice.statusCode === 200, '/internal/backoffice-poc still works');

  assertTruthy(basisPlusOutput.qa_summary.blocking_total === 0, 'QA blocking = 0');
  assertTruthy(basisPlusOutput.qa_summary.generated_lines_without_sources === 0, 'generated lines without sources = 0');
  assertTruthy(basisPlusOutput.qa_summary.generated_line_producttype_mismatch === 0, 'generated line producttype mismatch = 0');

  console.log(`ui mvp regression passed (basis run ${basisOutput.run.id}, basis_plus run ${basisPlusOutput.run.id})`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
