const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { loadRecommendationOutputForInput, main: calculateRecommendation } = require('../../backend/calculate');
const { loadBackofficeData } = require('../../backend/backoffice_queries');

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const ENV_PATH = path.join(WORKSPACE_ROOT, '.env.local');

const DEFAULT_POC_INPUT = {
  package_slug: 'basispakket',
  tier_slug: 'basis_plus',
  addon_slugs: ['stroomuitval'],
  duration_hours: 72,
  household_adults: 2,
  household_children: 0,
  household_pets: 0,
};

const ALLOWED_ADDONS = [
  'stroomuitval',
  'drinkwater',
  'voedsel_bereiding',
  'hygiene_sanitatie_afval',
  'ehbo_persoonlijke_zorg',
  'warmte_droog_shelter_light',
  'evacuatie',
  'taken_profielen',
];

const ADDON_PRESETS = [
  { slugs: ['stroomuitval'], label: 'Stroomuitval' },
  { slugs: ['drinkwater'], label: 'Drinkwater' },
  { slugs: ['evacuatie'], label: 'Evacuatie' },
  { slugs: ['taken_profielen'], label: 'Taken/Profielen' },
  { slugs: ['evacuatie', 'drinkwater'], label: 'Evacuatie + Drinkwater' },
  { slugs: ['evacuatie', 'stroomuitval'], label: 'Evacuatie + Stroomuitval' },
  { slugs: ['drinkwater', 'taken_profielen'], label: 'Drinkwater + Taken/Profielen' },
  { slugs: ['stroomuitval', 'drinkwater', 'voedsel_bereiding', 'hygiene_sanitatie_afval', 'ehbo_persoonlijke_zorg', 'warmte_droog_shelter_light', 'evacuatie', 'taken_profielen'], label: 'MVP stressrun' },
];

const MVP_ADDONS = [
  { slug: 'stroomuitval', label: 'Stroomuitval', note: 'Licht, laden en informatie.' },
  { slug: 'drinkwater', label: 'Drinkwater', note: 'Voorraad en behandeling.' },
  { slug: 'voedsel_bereiding', label: 'Voedsel', note: 'Voedselzekerheid en bereiding.' },
  { slug: 'hygiene_sanitatie_afval', label: 'Hygiene', note: 'Reiniging, sanitatie en afval.' },
  { slug: 'ehbo_persoonlijke_zorg', label: 'EHBO', note: 'Wondzorg en persoonlijke zorg.' },
  { slug: 'warmte_droog_shelter_light', label: 'Warmte/droog', note: 'Warmtebehoud en droog blijven.' },
  { slug: 'evacuatie', label: 'Evacuatie', note: 'Dragen, signaleren en documenten.' },
  { slug: 'taken_profielen', label: 'Taken', note: 'Checks naast producten.' },
];

const MVP_PRESETS = [
  {
    slug: 'mvp_start',
    label: 'Aanbevolen MVP-start',
    addon_slugs: ['stroomuitval', 'drinkwater', 'evacuatie'],
  },
  {
    slug: 'complete_72h',
    label: 'Complete 72u POC',
    addon_slugs: ALLOWED_ADDONS,
  },
];

function parsePositiveInt(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function normalizeAddonSlugs(value) {
  const raw = Array.isArray(value) ? value.join(',') : String(value || '');
  const normalized = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => ALLOWED_ADDONS.includes(part));
  const unique = [...new Set(normalized)];
  return unique.length ? unique : ['stroomuitval'];
}

function inputForSelection(tierSlug, addonValue, overrides = {}) {
  return {
    ...DEFAULT_POC_INPUT,
    tier_slug: tierSlug === 'basis' ? 'basis' : 'basis_plus',
    addon_slugs: normalizeAddonSlugs(addonValue),
    duration_hours: parsePositiveInt(overrides.duration_hours, 72),
    household_adults: Math.max(1, parsePositiveInt(overrides.household_adults, DEFAULT_POC_INPUT.household_adults)),
    household_children: parsePositiveInt(overrides.household_children, DEFAULT_POC_INPUT.household_children),
    household_pets: parsePositiveInt(overrides.household_pets, DEFAULT_POC_INPUT.household_pets),
  };
}

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_PATH, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  );
}

function dbUrl() {
  const env = loadLocalEnv();
  return process.env.IOE_PG_URL || env.IOE_PG_URL;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fmtBool(value) {
  return value ? 'telt mee' : 'ondersteunend / backup / niet voldoende';
}

function sectionTitle(key) {
  switch (key) {
    case 'core_items': return 'Core items';
    case 'accessories': return 'Accessoires';
    case 'supporting_items': return 'Supporting items';
    case 'backup_items': return 'Backup items';
    case 'optional_additions': return 'Optional additions';
    default: return key;
  }
}

async function loadRecommendationData(input) {
  const connectionString = dbUrl();
  if (!connectionString) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await loadRecommendationOutputForInput(client, input);
  } finally {
    await client.end();
  }
}

async function ensureRecommendationData(input) {
  try {
    return await loadRecommendationData(input);
  } catch (error) {
    if (!String(error.message || '').includes('Geen recommendation_run gevonden')) {
      throw error;
    }

    const originalLog = console.log;
    const originalWarn = console.warn;
    console.log = () => {};
    console.warn = () => {};
    try {
      await calculateRecommendation(input, { throwOnError: true });
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
    }
    return loadRecommendationData(input);
  }
}

async function loadBackofficePocData() {
  const connectionString = dbUrl();
  if (!connectionString) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await loadBackofficeData(client);
  } finally {
    await client.end();
  }
}

function renderAddonPresetLinks(data, querySuffix) {
  const current = data.input.addon_slugs.join(',');
  return ADDON_PRESETS.map((preset) => {
    const value = preset.slugs.join(',');
    const isActive = value === current;
    return `<a class="pill ${isActive ? 'good' : ''}" href="/internal/recommendation-poc?addon=${encodeURIComponent(value)}&tier=${escapeHtml(data.input.tier_slug)}${querySuffix}">${escapeHtml(preset.label)}</a>`;
  }).join('');
}

function renderSectionTable(lines, emptyText) {
  if (!lines.length) {
    return `<div class="empty-note">${escapeHtml(emptyText)}</div>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th class="num">Qty</th>
          <th>Role</th>
          <th class="num">Score</th>
          <th class="num">Sources</th>
          <th class="num">Coverage</th>
          <th>Waarom zit dit erin?</th>
        </tr>
      </thead>
      <tbody>
        ${lines.map((line) => `
          <tr>
            <td class="line-title">${escapeHtml(line.title)}</td>
            <td>${escapeHtml(line.sku)}</td>
            <td class="num">${escapeHtml(line.quantity)}</td>
            <td><span class="pill ${line.runtime_role === 'core' ? 'good' : 'backup'}">${escapeHtml(line.runtime_role)}</span></td>
            <td class="num">${escapeHtml(line.selection_score)}</td>
            <td class="num">${escapeHtml(line.sources.length)}</td>
            <td class="num">${escapeHtml(line.coverage.length)}</td>
            <td>${escapeHtml(line.explanation_public)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderWarnings(data) {
  return `
    <section class="band">
      <div class="section-head">
        <h2>Warnings</h2>
        <span class="pill ${data.warnings.length ? 'backup' : 'good'}">${data.warnings.length}</span>
      </div>
      ${data.warnings.length ? `
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Source</th>
              <th>Blocks</th>
              <th>Public warning</th>
              <th>Internal notes</th>
            </tr>
          </thead>
          <tbody>
            ${data.warnings.map((warning) => `
              <tr>
                <td>${escapeHtml(warning.item_title || '')}</td>
                <td>${escapeHtml(warning.sku || '')}</td>
                <td>${escapeHtml(warning.warning_type)}</td>
                <td>${escapeHtml(warning.severity || '')}</td>
                <td>${escapeHtml(warning.source)}</td>
                <td>${warning.blocks_recommendation ? 'ja' : 'nee'}</td>
                <td>${escapeHtml(warning.public_warning || '')}</td>
                <td>${escapeHtml(warning.internal_notes || '')}</td>
              </tr>`).join('')}
          </tbody>
        </table>` : `
        <div class="empty-note">Geen aparte warnings verzameld voor deze run. Usage constraints en governance blijven wel zichtbaar per item in debug details.</div>`}
    </section>`;
}

function renderTasks(data) {
  return `
    <section class="band">
      <div class="section-head">
        <h2>Tasks</h2>
        <span class="pill ${data.tasks.length ? 'good' : ''}">${data.tasks.length}</span>
      </div>
      <div class="governance">Tasks en checks blijven naast producten zichtbaar. Dit zijn persoonlijke readiness-acties, geen generieke productregels.</div>
      ${data.tasks.length ? `
        <table>
          <thead><tr><th>Task</th><th>Need</th><th>Priority</th><th>Public note</th><th>Internal note</th></tr></thead>
          <tbody>
            ${data.tasks.map((task) => `
              <tr>
                <td class="line-title">${escapeHtml(task.title)}<br><span class="subtle">${escapeHtml(task.task_slug)}</span></td>
                <td>${escapeHtml(task.need_slug)}</td>
                <td>${escapeHtml(task.priority)}</td>
                <td>${escapeHtml(task.description_public)}</td>
                <td>${escapeHtml(task.internal_notes)}</td>
              </tr>`).join('')}
          </tbody>
        </table>` : `<div class="empty-note">Geen tasks voor deze run.</div>`}
    </section>`;
}

function renderQaPanel(data) {
  return `
    <section class="band">
      <div class="section-head">
        <h2>QA summary</h2>
        <span class="status ${data.qa_summary.status === 'clean' ? 'ok' : 'warn'}">${escapeHtml(data.qa_summary.status)}</span>
      </div>
      <div class="metrics">
        <div><strong>${data.qa_summary.blocking_total}</strong><span>blocking QA total</span></div>
        <div><strong>${data.qa_summary.warning_total}</strong><span>warning/context QA total</span></div>
        <div><strong>${data.qa_summary.generated_lines_without_sources}</strong><span>generated lines without sources</span></div>
        <div><strong>${data.qa_summary.generated_line_producttype_mismatch}</strong><span>generated line producttype mismatch</span></div>
      </div>
      <details>
        <summary>Blocking views</summary>
        <table>
          <thead><tr><th>View</th><th>Records</th></tr></thead>
          <tbody>${data.qa_summary.blocking_views.map((row) => `<tr><td>${escapeHtml(row.view)}</td><td>${row.records}</td></tr>`).join('')}</tbody>
        </table>
      </details>
      <details>
        <summary>Warning/context views</summary>
        <table>
          <thead><tr><th>View</th><th>Records</th></tr></thead>
          <tbody>${data.qa_summary.warning_views.map((row) => `<tr><td>${escapeHtml(row.view)}</td><td>${row.records}</td></tr>`).join('')}</tbody>
        </table>
      </details>
    </section>`;
}

function renderDebugDetails(data) {
  return `
    <section class="band">
      <div class="section-head">
        <h2>Debug details per item</h2>
        <span class="pill">${data.lines.length}</span>
      </div>
      ${data.lines.map((line) => `
        <details>
          <summary>${escapeHtml(line.title)} <span class="pill">${escapeHtml(line.sku)}</span> <span class="pill ${line.runtime_role === 'core' ? 'good' : 'backup'}">${escapeHtml(line.runtime_role)}</span></summary>
          <div class="summary-grid" style="margin-top:12px">
            <div><span>runtime_section</span><strong>${escapeHtml(line.runtime_section)}</strong></div>
            <div><span>product_type</span><strong>${escapeHtml(line.product_type_slug)}</strong></div>
            <div><span>primary_reason</span><strong>${escapeHtml(line.primary_reason || '')}</strong></div>
            <div><span>selection_score</span><strong>${escapeHtml(line.selection_score)}</strong></div>
          </div>
          <h3 style="margin-top:12px">Sources</h3>
          <table>
            <thead><tr><th>source_type</th><th>scenario_need</th><th>parent item</th><th>explanation</th></tr></thead>
            <tbody>
              ${line.sources.map((src) => `
                <tr>
                  <td>${escapeHtml(src.source_type)}</td>
                  <td>${escapeHtml(src.scenario_need || '')}</td>
                  <td>${escapeHtml(src.parent_item || '')}</td>
                  <td>${escapeHtml(src.explanation || '')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <h3 style="margin-top:12px">Coverage</h3>
          <table>
            <thead><tr><th>Need</th><th>Capability</th><th>Strength</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>
              ${line.coverage.map((cov) => `
                <tr>
                  <td>${escapeHtml(cov.need)}</td>
                  <td>${escapeHtml(cov.capability)}</td>
                  <td>${escapeHtml(cov.coverage_strength)}</td>
                  <td><span class="pill ${cov.counted_as_sufficient ? 'good' : 'backup'}">${fmtBool(cov.counted_as_sufficient)}</span></td>
                  <td>${escapeHtml(cov.notes || '')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          ${line.usage_constraints.length ? `
            <h3 style="margin-top:12px">Usage constraints</h3>
            <table>
              <thead><tr><th>Constraint</th><th>Severity</th><th>Public warning</th><th>Internal notes</th></tr></thead>
              <tbody>
                ${line.usage_constraints.map((rule) => `
                  <tr>
                    <td>${escapeHtml(rule.constraint_type)}</td>
                    <td>${escapeHtml(rule.severity)}</td>
                    <td>${escapeHtml(rule.public_warning)}</td>
                    <td>${escapeHtml(rule.internal_notes)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>` : '<div class="empty-note" style="margin-top:12px">Geen usage constraints op itemniveau.</div>'}
          <h3 style="margin-top:12px">Internal explanation</h3>
          <pre>${escapeHtml(line.explanation_internal || '')}</pre>
        </details>`).join('')}
    </section>`;
}

function renderObjectTable(rows, columns, emptyText) {
  if (!rows.length) return `<div class="empty-note">${escapeHtml(emptyText)}</div>`;
  return `
    <table>
      <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            ${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderBackofficePage(data, domain = 'all') {
  const show = (section) => domain === 'all' || domain === section;
  const qa = data.qaSummary;

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ik overleef - backoffice POC</title>
  <style>
    :root {
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f2933;
      --muted: #5f6b7a;
      --line: #d7dde5;
      --ok: #0f766e;
      --warn: #b45309;
      --dark: #17202a;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); font-size: 15px; line-height: 1.45; }
    header { background: var(--dark); color: white; padding: 24px 32px; }
    main { max-width: 1480px; margin: 0 auto; padding: 24px 32px 48px; }
    h1, h2, h3 { margin: 0; font-weight: 700; letter-spacing: 0; }
    h1 { font-size: 24px; }
    h2 { font-size: 18px; }
    .subtle { color: var(--muted); }
    header .subtle { color: #cbd5e1; margin-top: 6px; }
    .band { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; margin-bottom: 18px; padding: 18px; }
    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .metrics div { border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; min-width: 0; }
    .metrics span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
    .metrics strong { display: block; font-size: 24px; color: var(--dark); overflow-wrap: anywhere; }
    .status { border-radius: 999px; padding: 4px 10px; color: white; white-space: nowrap; font-size: 13px; }
    .status.ok { background: var(--ok); }
    .status.warn { background: var(--warn); }
    .pill { display: inline-block; border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px; font-size: 12px; color: #374151; background: white; margin: 0 6px 6px 0; }
    .pill.good { border-color: #99d4cc; background: #e8f7f4; color: #0f766e; }
    .pill.backup { border-color: #f4c27d; background: #fff7ed; color: #92400e; }
    .empty-note, .governance { border-left: 4px solid var(--warn); background: #fff7ed; padding: 12px; margin-top: 12px; border-radius: 4px; }
    .empty-note { border-left-color: var(--line); background: #fbfcfd; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 8px; text-align: left; vertical-align: top; }
    th { color: #374151; font-size: 12px; text-transform: uppercase; background: #eef2f6; }
    details { border: 1px solid var(--line); border-radius: 6px; margin-top: 10px; padding: 10px 12px; background: #fbfcfd; }
    summary { cursor: pointer; font-weight: 700; }
    @media (max-width: 760px) { main, header { padding-left: 16px; padding-right: 16px; } table { font-size: 13px; } th, td { padding: 7px 6px; } }
  </style>
</head>
<body>
  <header>
    <h1>Backoffice POC</h1>
    <div class="subtle">Read-only inspectie op bestaande data. Runtime labels zijn geen database-enums.</div>
  </header>
  <main>
    <section class="band">
      <div class="section-head">
        <h2>Backoffice navigatie</h2>
        <span class="status ${qa.status === 'clean' ? 'ok' : 'warn'}">${escapeHtml(qa.status)}</span>
      </div>
      <a class="pill ${domain === 'all' ? 'good' : ''}" href="/internal/backoffice-poc">Alles</a>
      <a class="pill ${domain === 'qa' ? 'good' : ''}" href="/internal/backoffice-poc?domain=qa">QA</a>
      <a class="pill ${domain === 'scenarios' ? 'good' : ''}" href="/internal/backoffice-poc?domain=scenarios">Scenario matrix</a>
      <a class="pill ${domain === 'readiness' ? 'good' : ''}" href="/internal/backoffice-poc?domain=readiness">Readiness</a>
      <a class="pill ${domain === 'governance' ? 'good' : ''}" href="/internal/backoffice-poc?domain=governance">Governance</a>
      <div class="governance">Release baseline wordt runtime/static getoond; er is geen database release registry.</div>
    </section>

    ${show('qa') ? `
      <section class="band">
        <div class="section-head"><h2>QA dashboard summary</h2><span class="status ${qa.status === 'clean' ? 'ok' : 'warn'}">${escapeHtml(qa.status)}</span></div>
        <div class="metrics">
          <div><strong>${qa.blocking_total}</strong><span>blocking total</span></div>
          <div><strong>${qa.warning_total}</strong><span>warning total</span></div>
          <div><strong>${qa.generated_lines_without_sources}</strong><span>generated lines without sources</span></div>
          <div><strong>${qa.generated_line_producttype_mismatch}</strong><span>producttype mismatch</span></div>
        </div>
        ${renderObjectTable(qa.per_view_records, [
          { key: 'category', label: 'category' },
          { key: 'view', label: 'view' },
          { key: 'records', label: 'records' },
        ], 'Geen QA views gevonden.')}
      </section>` : ''}

    ${show('scenarios') ? `
      <section class="band">
        <div class="section-head"><h2>Scenario matrix</h2><span class="pill">${data.scenarioMatrix.length}</span></div>
        ${renderObjectTable(data.scenarioMatrix, [
          { key: 'scenario_slug', label: 'scenario' },
          { key: 'scenario_status', label: 'scenario status' },
          { key: 'need_slug', label: 'need' },
          { key: 'need_content_only', label: 'content only' },
          { key: 'capability_count', label: 'capabilities' },
          { key: 'product_rule_count', label: 'rules' },
          { key: 'active_candidate_count_basis', label: 'basis candidates' },
          { key: 'active_candidate_count_basis_plus', label: 'basis+ candidates' },
          { key: 'has_primary_coverage_candidate', label: 'primary candidate' },
          { key: 'has_accessory_requirements', label: 'accessories' },
          { key: 'governance_flag_count', label: 'governance flags' },
        ], 'Scenario matrix is leeg.')}
      </section>` : ''}

    ${show('readiness') ? `
      <section class="band">
        <div class="section-head"><h2>Product readiness</h2><span class="pill">${data.productReadiness.length}</span></div>
        ${renderObjectTable(data.productReadiness, [
          { key: 'item_sku', label: 'sku' },
          { key: 'item_title', label: 'item' },
          { key: 'item_status', label: 'status' },
          { key: 'product_type_slug', label: 'product type' },
          { key: 'capability_count', label: 'capabilities' },
          { key: 'supplier_offer_count', label: 'offers' },
          { key: 'usage_constraint_count', label: 'constraints' },
          { key: 'governance_rule_count', label: 'governance' },
          { key: 'candidate_count', label: 'candidates' },
          { key: 'readiness_label', label: 'label' },
          { key: 'readiness_reason', label: 'reason' },
        ], 'Product readiness is leeg.')}
      </section>
      <section class="band">
        <div class="section-head"><h2>Candidate readiness</h2><span class="pill">${data.candidateReadiness.length}</span></div>
        ${renderObjectTable(data.candidateReadiness, [
          { key: 'tier_slug', label: 'tier' },
          { key: 'product_type_slug', label: 'product type' },
          { key: 'item_sku', label: 'sku' },
          { key: 'is_default_candidate', label: 'default' },
          { key: 'item_status', label: 'status' },
          { key: 'product_type_match', label: 'type match' },
          { key: 'supplier_offer_count', label: 'offers' },
          { key: 'capability_count', label: 'capabilities' },
          { key: 'readiness_label', label: 'label' },
        ], 'Candidate readiness is leeg.')}
      </section>
      <section class="band">
        <div class="section-head"><h2>Supplier offer attention</h2><span class="pill">${data.supplierOfferAttention.length}</span></div>
        ${renderObjectTable(data.supplierOfferAttention, [
          { key: 'item_sku', label: 'sku' },
          { key: 'supplier_offer_count', label: 'offers' },
          { key: 'attention_label', label: 'label' },
          { key: 'attention_reason', label: 'reason' },
        ], 'Supplier offer attention is leeg.')}
      </section>` : ''}

    ${show('governance') ? `
      <section class="band">
        <div class="section-head"><h2>Governance attention</h2><span class="pill">${data.governanceAttention.length}</span></div>
        ${renderObjectTable(data.governanceAttention, [
          { key: 'item_sku', label: 'sku' },
          { key: 'product_type_slug', label: 'product type' },
          { key: 'constraint_type', label: 'constraint' },
          { key: 'severity', label: 'severity' },
          { key: 'blocks_recommendation', label: 'blocks' },
          { key: 'public_warning', label: 'public warning' },
          { key: 'internal_notes', label: 'internal notes' },
          { key: 'governance_context', label: 'context' },
        ], 'Governance attention is leeg.')}
      </section>` : ''}

    <section class="band">
      <div class="section-head"><h2>Release baseline</h2><span class="pill">${data.releaseBaseline.baselines.length}</span></div>
      <div class="governance">${escapeHtml(data.releaseBaseline.note)}</div>
      ${renderObjectTable(data.releaseBaseline.baselines, [
        { key: 'order', label: '#' },
        { key: 'tag', label: 'tag' },
        { key: 'status', label: 'status' },
      ], 'Geen baselineconfig gevonden.')}
    </section>

    <section class="band">
      <div class="section-head"><h2>Open attention points</h2><span class="pill">${data.openAttentionPoints.length}</span></div>
      <ul>
        ${data.openAttentionPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
      </ul>
    </section>
  </main>
</body>
</html>`;
}

function mvpInputFromSearchParams(params) {
  const addonValues = params.getAll('addons').filter(Boolean);
  const addonValue = addonValues.length ? addonValues.join(',') : (params.get('addon') || MVP_PRESETS[0].addon_slugs.join(','));
  const input = inputForSelection(params.get('tier') || 'basis_plus', addonValue, {
    household_adults: params.get('adults'),
    household_children: params.get('children'),
    household_pets: params.get('pets'),
    duration_hours: params.get('duration_hours'),
  });
  input.duration_hours = Math.max(24, Number(input.duration_hours) || 72);
  return input;
}

function mvpQueryForInput(input) {
  return new URLSearchParams({
    package: input.package_slug,
    tier: input.tier_slug,
    addons: input.addon_slugs.join(','),
    adults: String(input.household_adults),
    children: String(input.household_children),
    pets: String(input.household_pets),
    duration_hours: String(input.duration_hours),
  }).toString();
}

function sectionDescription(key) {
  switch (key) {
    case 'core_items': return 'Essentiele items voor primaire dekking.';
    case 'accessories': return 'Benodigdheden die gekozen oplossingen bruikbaar maken.';
    case 'supporting_items': return 'Ondersteunend: nuttig, maar geen vervanging van primaire dekking.';
    case 'backup_items': return 'Reserve of fallback, met beperkingen in de uitleg.';
    case 'optional_additions': return 'Ruimte voor latere uitbreidingen. Mag nu leeg zijn.';
    default: return '';
  }
}

function renderMvpStyles() {
  return `
    :root {
      --bg: #f4f6f4;
      --panel: #ffffff;
      --text: #1d2521;
      --muted: #5d6a64;
      --line: #d7ddd8;
      --accent: #19675d;
      --accent-soft: #e4f1ee;
      --warn: #995b13;
      --warn-soft: #fff4e5;
      --ink: #17201d;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); font-size: 15px; line-height: 1.5; }
    header { background: var(--ink); color: white; padding: 24px 32px; }
    main { max-width: 1180px; margin: 0 auto; padding: 24px 32px 48px; }
    h1, h2, h3 { margin: 0; letter-spacing: 0; }
    h1 { font-size: 26px; }
    h2 { font-size: 19px; }
    h3 { font-size: 16px; }
    a { color: var(--accent); }
    .subtle { color: var(--muted); }
    header .subtle { color: #c7d3cf; margin-top: 6px; }
    .band { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 18px; padding: 18px; }
    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    label { display: block; font-weight: 700; margin-bottom: 6px; }
    input, select { width: 100%; border: 1px solid var(--line); border-radius: 6px; padding: 10px 11px; font: inherit; background: white; color: var(--text); }
    .choice { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: #fbfcfb; min-height: 92px; }
    .choice input { width: auto; margin-right: 8px; }
    .choice strong { display: inline-block; margin-bottom: 4px; }
    .preset-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .button { display: inline-block; border: 0; border-radius: 6px; background: var(--accent); color: white; padding: 11px 15px; text-decoration: none; font-weight: 700; cursor: pointer; font: inherit; }
    .button.secondary { background: white; color: var(--accent); border: 1px solid var(--accent); }
    .pill { display: inline-block; border: 1px solid var(--line); border-radius: 999px; padding: 3px 9px; font-size: 12px; margin: 0 6px 6px 0; background: white; }
    .pill.good { border-color: #9dcbc3; background: var(--accent-soft); color: var(--accent); }
    .pill.warn { border-color: #efc27c; background: var(--warn-soft); color: var(--warn); }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .metric { border: 1px solid var(--line); border-radius: 8px; padding: 11px 12px; background: #fbfcfb; }
    .metric span { display: block; color: var(--muted); font-size: 12px; }
    .metric strong { display: block; font-size: 22px; margin-top: 2px; }
    .item-card { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: #fbfcfb; margin-top: 10px; }
    .item-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
    .qty { min-width: 48px; text-align: center; border-radius: 6px; background: var(--accent-soft); color: var(--accent); padding: 6px 8px; font-weight: 700; }
    details { border: 1px solid var(--line); border-radius: 6px; margin-top: 10px; padding: 10px 12px; background: white; }
    summary { cursor: pointer; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid var(--line); padding: 8px 7px; text-align: left; vertical-align: top; }
    th { background: #eef2ef; font-size: 12px; text-transform: uppercase; }
    .notice { border-left: 4px solid var(--warn); background: var(--warn-soft); padding: 12px; border-radius: 4px; }
    .empty { color: var(--muted); padding: 12px; border: 1px dashed var(--line); border-radius: 6px; background: #fbfcfb; }
    @media (max-width: 760px) { main, header { padding-left: 16px; padding-right: 16px; } .item-top { display: block; } .qty { display: inline-block; margin-top: 8px; } }
  `;
}

function renderMvpConfiguratorPage(input = DEFAULT_POC_INPUT) {
  const selected = new Set(input.addon_slugs || []);
  const presetLinks = MVP_PRESETS.map((preset) => {
    const presetInput = { ...input, addon_slugs: preset.addon_slugs };
    return `<a class="button secondary" href="/mvp?${mvpQueryForInput(presetInput)}">${escapeHtml(preset.label)}</a>`;
  }).join('');

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ik overleef - MVP configurator</title>
  <style>${renderMvpStyles()}</style>
</head>
<body>
  <header>
    <h1>Ik overleef</h1>
    <div class="subtle">Stel een praktisch noodpakketadvies samen op basis van bestaande scenario's.</div>
  </header>
  <main>
    <form class="band" method="get" action="/mvp/recommendation">
      <div class="section-head">
        <h2>Configurator</h2>
        <span class="pill good">MVP</span>
      </div>
      <input type="hidden" name="package" value="basispakket">
      <div class="form-grid">
        <div>
          <label for="tier">Pakketniveau</label>
          <select id="tier" name="tier">
            <option value="basis" ${input.tier_slug === 'basis' ? 'selected' : ''}>Basis</option>
            <option value="basis_plus" ${input.tier_slug === 'basis_plus' ? 'selected' : ''}>Basis+</option>
          </select>
        </div>
        <div>
          <label for="adults">Volwassenen</label>
          <input id="adults" name="adults" type="number" min="1" step="1" value="${escapeHtml(input.household_adults)}">
        </div>
        <div>
          <label for="children">Kinderen</label>
          <input id="children" name="children" type="number" min="0" step="1" value="${escapeHtml(input.household_children)}">
        </div>
        <div>
          <label for="pets">Huisdieren</label>
          <input id="pets" name="pets" type="number" min="0" step="1" value="${escapeHtml(input.household_pets)}">
        </div>
        <div>
          <label for="duration_hours">Duur in uren</label>
          <input id="duration_hours" name="duration_hours" type="number" min="24" step="24" value="${escapeHtml(input.duration_hours)}">
        </div>
      </div>
      <h3 style="margin-top:18px">Add-ons</h3>
      <div class="grid" style="margin-top:10px">
        ${MVP_ADDONS.map((addon) => `
          <label class="choice">
            <input type="checkbox" name="addons" value="${escapeHtml(addon.slug)}" ${selected.has(addon.slug) ? 'checked' : ''}>
            <strong>${escapeHtml(addon.label)}</strong>
            <div class="subtle">${escapeHtml(addon.note)}</div>
          </label>`).join('')}
      </div>
      <div class="preset-row">
        ${presetLinks}
      </div>
      <div style="margin-top:18px">
        <button class="button" type="submit">Advies bekijken</button>
      </div>
    </form>
  </main>
</body>
</html>`;
}

function renderMvpItemCard(line, sectionKey) {
  return `
    <article class="item-card">
      <div class="item-top">
        <div>
          <h3>${escapeHtml(line.title)}</h3>
          <div style="margin-top:6px">
            <span class="pill good">${escapeHtml(sectionTitle(sectionKey))}</span>
            <span class="pill">${escapeHtml(line.runtime_role)}</span>
          </div>
        </div>
        <div class="qty">x${escapeHtml(line.quantity)}</div>
      </div>
      <p>${escapeHtml(line.explanation_public)}</p>
      <details>
        <summary>Uitleg en details</summary>
        <p class="subtle">SKU: ${escapeHtml(line.sku)}</p>
        <h3>Bronnen</h3>
        <table>
          <thead><tr><th>Need</th><th>Type</th><th>Uitleg</th></tr></thead>
          <tbody>
            ${line.sources.map((src) => `<tr><td>${escapeHtml(src.scenario_need || '')}</td><td>${escapeHtml(src.source_type)}</td><td>${escapeHtml(src.explanation || '')}</td></tr>`).join('')}
          </tbody>
        </table>
        <h3 style="margin-top:12px">Dekking</h3>
        <table>
          <thead><tr><th>Need</th><th>Capability</th><th>Sterkte</th><th>Status</th></tr></thead>
          <tbody>
            ${line.coverage.map((cov) => `<tr><td>${escapeHtml(cov.need)}</td><td>${escapeHtml(cov.capability)}</td><td>${escapeHtml(cov.coverage_strength)}</td><td>${fmtBool(cov.counted_as_sufficient)}</td></tr>`).join('')}
          </tbody>
        </table>
        ${line.usage_constraints.length ? `
          <h3 style="margin-top:12px">Waarschuwingen</h3>
          <table>
            <thead><tr><th>Type</th><th>Waarschuwing</th></tr></thead>
            <tbody>
              ${line.usage_constraints.map((rule) => `<tr><td>${escapeHtml(rule.constraint_type)}</td><td>${escapeHtml(rule.public_warning)}</td></tr>`).join('')}
            </tbody>
          </table>` : ''}
      </details>
    </article>`;
}

function renderMvpSection(data, key) {
  const lines = data.sections[key] || [];
  return `
    <section class="band">
      <div class="section-head">
        <div>
          <h2>${sectionTitle(key)}</h2>
          <div class="subtle">${escapeHtml(sectionDescription(key))}</div>
        </div>
        <span class="pill ${lines.length ? 'good' : ''}">${lines.length}</span>
      </div>
      ${lines.length ? lines.map((line) => renderMvpItemCard(line, key)).join('') : '<div class="empty">Deze sectie is leeg voor deze adviesrun.</div>'}
    </section>`;
}

function renderMvpTasks(data) {
  return `
    <section class="band">
      <div class="section-head">
        <h2>Tasks</h2>
        <span class="pill ${data.tasks.length ? 'good' : ''}">${data.tasks.length}</span>
      </div>
      ${data.tasks.length ? data.tasks.map((task) => `
        <article class="item-card">
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description_public)}</p>
          <div class="subtle">${escapeHtml(task.need_slug)} · priority ${escapeHtml(task.priority)}</div>
        </article>`).join('') : '<div class="empty">Geen tasks voor deze run.</div>'}
    </section>`;
}

function renderMvpWarnings(data) {
  return `
    <section class="band">
      <div class="section-head">
        <h2>Warnings</h2>
        <span class="pill ${data.warnings.length ? 'warn' : 'good'}">${data.warnings.length}</span>
      </div>
      ${data.warnings.length ? data.warnings.slice(0, 80).map((warning) => `
        <div class="notice" style="margin-top:10px">
          <strong>${escapeHtml(warning.item_title || warning.warning_type)}</strong>
          <div>${escapeHtml(warning.public_warning || warning.internal_notes || '')}</div>
        </div>`).join('') : '<div class="empty">Geen warnings voor deze run.</div>'}
    </section>`;
}

function renderMvpRecommendationPage(data) {
  const query = mvpQueryForInput(data.input);
  const counts = {
    core: data.sections.core_items.length,
    accessories: data.sections.accessories.length,
    supporting: data.sections.supporting_items.length,
    backup: data.sections.backup_items.length,
    optional: data.sections.optional_additions.length,
    tasks: data.tasks.length,
    warnings: data.warnings.length,
  };

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ik overleef - advies</title>
  <style>${renderMvpStyles()}</style>
</head>
<body>
  <header>
    <h1>Je pakketadvies</h1>
    <div class="subtle">Gebaseerd op bestaande scenario's, productregels, tasks, warnings en QA-output.</div>
  </header>
  <main>
    <section class="band">
      <div class="section-head">
        <h2>Samenvatting</h2>
        <span class="pill ${data.qa_summary.status === 'clean' ? 'good' : 'warn'}">QA ${escapeHtml(data.qa_summary.status)}</span>
      </div>
      <div class="metrics">
        <div class="metric"><span>Pakket</span><strong>${escapeHtml(data.input.package_slug)}</strong></div>
        <div class="metric"><span>Niveau</span><strong>${escapeHtml(data.input.tier_slug)}</strong></div>
        <div class="metric"><span>Add-ons</span><strong>${data.input.addon_slugs.length}</strong></div>
        <div class="metric"><span>Volwassenen</span><strong>${escapeHtml(data.input.household_adults)}</strong></div>
        <div class="metric"><span>Kinderen</span><strong>${escapeHtml(data.input.household_children)}</strong></div>
        <div class="metric"><span>Huisdieren</span><strong>${escapeHtml(data.input.household_pets)}</strong></div>
        <div class="metric"><span>Duur</span><strong>${escapeHtml(data.input.duration_hours)}u</strong></div>
        <div class="metric"><span>Core</span><strong>${counts.core}</strong></div>
        <div class="metric"><span>Accessoires</span><strong>${counts.accessories}</strong></div>
        <div class="metric"><span>Supporting</span><strong>${counts.supporting}</strong></div>
        <div class="metric"><span>Backup</span><strong>${counts.backup}</strong></div>
        <div class="metric"><span>Tasks</span><strong>${counts.tasks}</strong></div>
        <div class="metric"><span>Warnings</span><strong>${counts.warnings}</strong></div>
      </div>
      <div style="margin-top:12px">
        ${data.input.addon_slugs.map((slug) => `<span class="pill good">${escapeHtml(slug)}</span>`).join('')}
      </div>
      <div style="margin-top:16px">
        <a class="button secondary" href="/mvp?${query}">Keuzes aanpassen</a>
        <a class="button secondary" href="/internal/backoffice-poc">Interne backoffice bekijken</a>
      </div>
    </section>

    ${renderMvpSection(data, 'core_items')}
    ${renderMvpSection(data, 'accessories')}
    ${renderMvpSection(data, 'supporting_items')}
    ${renderMvpSection(data, 'backup_items')}
    ${renderMvpSection(data, 'optional_additions')}
    ${renderMvpTasks(data)}
    ${renderMvpWarnings(data)}

    <section class="band">
      <div class="section-head">
        <h2>QA summary</h2>
        <span class="pill ${data.qa_summary.status === 'clean' ? 'good' : 'warn'}">${escapeHtml(data.qa_summary.status)}</span>
      </div>
      <div class="metrics">
        <div class="metric"><span>blocking</span><strong>${data.qa_summary.blocking_total}</strong></div>
        <div class="metric"><span>warning/context</span><strong>${data.qa_summary.warning_total}</strong></div>
        <div class="metric"><span>without sources</span><strong>${data.qa_summary.generated_lines_without_sources}</strong></div>
        <div class="metric"><span>type mismatch</span><strong>${data.qa_summary.generated_line_producttype_mismatch}</strong></div>
      </div>
      <details>
        <summary>Debug run details</summary>
        <p>Run ID: ${escapeHtml(data.run.id)}</p>
        <p>Actieve add-ons: ${data.input.addon_slugs.map((slug) => escapeHtml(slug)).join(', ')}</p>
      </details>
    </section>
  </main>
</body>
</html>`;
}

function renderPage(data) {
  const currentAddonValue = data.input.addon_slugs.join(',');
  const querySuffix = `&adults=${encodeURIComponent(data.input.household_adults)}&children=${encodeURIComponent(data.input.household_children)}&pets=${encodeURIComponent(data.input.household_pets)}&duration_hours=${encodeURIComponent(data.input.duration_hours)}`;

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ik overleef - interne recommendation POC</title>
  <style>
    :root {
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f2933;
      --muted: #5f6b7a;
      --line: #d7dde5;
      --ok: #0f766e;
      --warn: #b45309;
      --dark: #17202a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 15px;
      line-height: 1.45;
    }
    header {
      background: var(--dark);
      color: white;
      padding: 24px 32px;
    }
    main { max-width: 1480px; margin: 0 auto; padding: 24px 32px 48px; }
    h1, h2, h3 { margin: 0; font-weight: 700; letter-spacing: 0; }
    h1 { font-size: 24px; }
    h2 { font-size: 18px; }
    h3 { font-size: 15px; }
    .subtle { color: var(--muted); }
    header .subtle { color: #cbd5e1; margin-top: 6px; }
    .band {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      margin-bottom: 18px;
      padding: 18px;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .summary-grid, .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 10px;
    }
    .summary-grid div, .metrics div {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px 12px;
      min-width: 0;
    }
    .summary-grid span, .metrics span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 4px;
    }
    .summary-grid strong, .metrics strong {
      display: block;
      overflow-wrap: anywhere;
    }
    .metrics strong { font-size: 24px; color: var(--dark); }
    .status {
      border-radius: 999px;
      padding: 4px 10px;
      color: white;
      white-space: nowrap;
      font-size: 13px;
    }
    .status.ok { background: var(--ok); }
    .status.warn { background: var(--warn); }
    .pill {
      display: inline-block;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 12px;
      color: #374151;
      background: white;
      margin: 0 6px 6px 0;
    }
    .pill.good { border-color: #99d4cc; background: #e8f7f4; color: #0f766e; }
    .pill.backup { border-color: #f4c27d; background: #fff7ed; color: #92400e; }
    .governance, .empty-note {
      border-left: 4px solid var(--warn);
      background: #fff7ed;
      padding: 12px;
      margin-top: 12px;
      border-radius: 4px;
    }
    .empty-note {
      border-left-color: var(--line);
      background: #fbfcfd;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 9px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      background: #eef2f6;
    }
    td.num, th.num { text-align: right; }
    details {
      border: 1px solid var(--line);
      border-radius: 6px;
      margin-top: 10px;
      padding: 10px 12px;
      background: #fbfcfd;
    }
    summary { cursor: pointer; font-weight: 700; }
    .line-title { font-weight: 700; }
    pre {
      overflow: auto;
      background: #101820;
      color: #e5edf5;
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
    }
    @media (max-width: 760px) {
      main, header { padding-left: 16px; padding-right: 16px; }
      table { font-size: 13px; }
      th, td { padding: 7px 6px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Interne recommendation POC</h1>
    <div class="subtle">MVP-outputstructuur op bestaande generated data. Geen nieuwe schema-objecten, geen checkout, geen accountflow.</div>
  </header>
  <main>
    <section class="band">
      <div class="section-head">
        <h2>Input summary</h2>
        <span class="status ${data.qa_summary.status === 'clean' ? 'ok' : 'warn'}">QA ${escapeHtml(data.qa_summary.status)}</span>
      </div>
      <div style="margin-bottom:14px">
        ${renderAddonPresetLinks(data, querySuffix)}
      </div>
      <div style="margin-bottom:14px">
        <a class="pill ${data.input.tier_slug === 'basis' ? 'good' : ''}" href="/internal/recommendation-poc?addon=${encodeURIComponent(currentAddonValue)}&tier=basis${querySuffix}">Basis</a>
        <a class="pill ${data.input.tier_slug === 'basis_plus' ? 'good' : ''}" href="/internal/recommendation-poc?addon=${encodeURIComponent(currentAddonValue)}&tier=basis_plus${querySuffix}">Basis+</a>
      </div>
      <div class="summary-grid">
        <div><span>recommendation_run_id</span><strong>${escapeHtml(data.run.id)}</strong></div>
        <div><span>package</span><strong>${escapeHtml(data.run.package_name)} (${escapeHtml(data.run.package_slug)})</strong></div>
        <div><span>tier</span><strong>${escapeHtml(data.run.tier_name)} (${escapeHtml(data.run.tier_slug)})</strong></div>
        <div><span>actieve add-ons</span><strong>${data.input.addon_slugs.map((slug) => escapeHtml(slug)).join(', ')}</strong></div>
        <div><span>duration_hours</span><strong>${data.run.duration_hours}</strong></div>
        <div><span>household_adults</span><strong>${data.run.household_adults}</strong></div>
        <div><span>household_children</span><strong>${data.run.household_children}</strong></div>
        <div><span>household_pets</span><strong>${data.run.household_pets}</strong></div>
        <div><span>QA-status</span><strong>${escapeHtml(data.qa_summary.status)}</strong></div>
      </div>
      <h3 style="margin-top:16px">Gebruikte input</h3>
      <pre>${escapeHtml(JSON.stringify(data.input, null, 2))}</pre>
    </section>

    <section class="band">
      <div class="section-head">
        <h2>${sectionTitle('core_items')}</h2>
        <span class="pill ${data.sections.core_items.length ? 'good' : ''}">${data.sections.core_items.length}</span>
      </div>
      ${renderSectionTable(data.sections.core_items, 'Geen core items in deze run.')}
    </section>

    <section class="band">
      <div class="section-head">
        <h2>${sectionTitle('accessories')}</h2>
        <span class="pill ${data.sections.accessories.length ? 'good' : ''}">${data.sections.accessories.length}</span>
      </div>
      ${renderSectionTable(data.sections.accessories, 'Geen accessoires in deze run.')}
    </section>

    <section class="band">
      <div class="section-head">
        <h2>${sectionTitle('supporting_items')}</h2>
        <span class="pill ${data.sections.supporting_items.length ? 'good' : ''}">${data.sections.supporting_items.length}</span>
      </div>
      ${renderSectionTable(data.sections.supporting_items, 'Geen supporting items in deze run.')}
    </section>

    <section class="band">
      <div class="section-head">
        <h2>${sectionTitle('backup_items')}</h2>
        <span class="pill ${data.sections.backup_items.length ? 'good' : ''}">${data.sections.backup_items.length}</span>
      </div>
      ${renderSectionTable(data.sections.backup_items, 'Geen backup items in deze run.')}
    </section>

    <section class="band">
      <div class="section-head">
        <h2>${sectionTitle('optional_additions')}</h2>
        <span class="pill ${data.sections.optional_additions.length ? 'good' : ''}">${data.sections.optional_additions.length}</span>
      </div>
      ${renderSectionTable(data.sections.optional_additions, 'Optional additions zijn in deze hardeningfase nog leeg toegestaan.')}
    </section>

    ${renderTasks(data)}
    ${renderWarnings(data)}
    ${renderQaPanel(data)}
    ${renderDebugDetails(data)}
  </main>
</body>
</html>`;
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/') {
      res.writeHead(302, { Location: '/mvp' });
      res.end();
      return;
    }

    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (url.pathname === '/internal/backoffice-poc') {
      const allowedDomains = new Set(['all', 'qa', 'readiness', 'governance', 'scenarios']);
      const domainParam = url.searchParams.get('domain') || 'all';
      const domain = allowedDomains.has(domainParam) ? domainParam : 'all';
      const data = await loadBackofficePocData();
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderBackofficePage(data, domain));
      return;
    }

    if (url.pathname === '/mvp') {
      const dataInput = mvpInputFromSearchParams(url.searchParams);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderMvpConfiguratorPage(dataInput));
      return;
    }

    if (url.pathname === '/mvp/recommendation') {
      const data = await ensureRecommendationData(mvpInputFromSearchParams(url.searchParams));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(renderMvpRecommendationPage(data));
      return;
    }

    if (url.pathname !== '/internal/recommendation-poc') {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const tier = url.searchParams.get('tier') === 'basis' ? 'basis' : 'basis_plus';
    const addonValue = url.searchParams.get('addon') || url.searchParams.get('addons') || DEFAULT_POC_INPUT.addon_slugs.join(',');
    const data = await loadRecommendationData(inputForSelection(tier, addonValue, {
      household_adults: url.searchParams.get('adults'),
      household_children: url.searchParams.get('children'),
      household_pets: url.searchParams.get('pets'),
      duration_hours: url.searchParams.get('duration_hours'),
    }));

    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderPage(data));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Internal POC error:\n${error.stack || error.message}`);
  }
}

if (require.main === module) {
  http.createServer(handleRequest).listen(PORT, HOST, () => {
    console.log(`Internal recommendation POC: http://${HOST}:${PORT}/internal/recommendation-poc`);
    console.log(`Internal backoffice POC: http://${HOST}:${PORT}/internal/backoffice-poc`);
    console.log(`MVP configurator: http://${HOST}:${PORT}/mvp`);
  });
}

module.exports = {
  inputForSelection,
  loadRecommendationData,
  ensureRecommendationData,
  loadBackofficePocData,
  mvpInputFromSearchParams,
  renderMvpConfiguratorPage,
  renderMvpRecommendationPage,
  renderBackofficePage,
  handleRequest,
};
