const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

function inputForSelection(tierSlug, addonSlug) {
  const normalizedAddon = ['stroomuitval', 'drinkwater', 'voedsel_bereiding', 'hygiene_sanitatie_afval', 'ehbo_persoonlijke_zorg', 'warmte_droog_shelter_light'].includes(addonSlug)
    ? addonSlug
    : 'stroomuitval';
  return {
    ...DEFAULT_POC_INPUT,
    tier_slug: tierSlug === 'basis' ? 'basis' : 'basis_plus',
    addon_slugs: [normalizedAddon],
    duration_hours: 72,
  };
}

const BLOCKING_QA_VIEWS = [
  'qa_active_scenarios_without_needs',
  'qa_active_needs_without_capabilities',
  'qa_scenario_needs_without_product_rules',
  'qa_product_types_without_capabilities',
  'qa_active_items_without_capabilities',
  'qa_variant_item_product_type_mismatch',
  'qa_default_candidate_conflicts',
  'qa_items_with_claimed_primary_coverage',
  'qa_required_accessories_missing_candidate_items',
  'qa_active_consumables_without_quantity_policy',
  'qa_claim_governance_scope_invalid',
  'qa_quantity_policy_invalid_scope',
];

const WARNING_QA_VIEWS = [
  'qa_active_accessory_items_without_capabilities',
  'qa_supplier_offers_stale',
  'qa_evacuation_items_without_physical_specs',
  'qa_weather_items_without_environmental_specs',
];

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_PATH, 'utf8')
      .split(/\r?\n/)
      .filter(line => line && !line.trimStart().startsWith('#') && line.includes('='))
      .map(line => {
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

function roleLabel(line) {
  if (line.is_accessory) return 'accessory';
  if (line.product_type_slug === 'buitenkooktoestel-gas' || line.primary_reason === 'voedsel-verwarmen-ondersteunend') return 'supporting';
  if (['sanitair-absorptiemiddel', 'zipbags', 'nitril-handschoenen'].includes(line.product_type_slug)) return 'accessory';
  if (line.product_type_slug === 'verbandtape') return 'accessory';
  if (['paracord', 'tarp-haringen'].includes(line.product_type_slug)) return 'accessory';
  if (line.product_type_slug === 'thermometer' || line.primary_reason === 'temperatuur-controleren') return 'supporting';
  if (line.product_type_slug === 'nooddeken' || line.primary_reason === 'noodwarmte-backup') return 'supporting';
  if (line.product_type_slug === 'grondzeil' || line.primary_reason === 'grondvocht-barriere') return 'supporting';
  if (!line.is_core_line) return 'backup';
  return 'core';
}

async function countView(client, viewName) {
  const result = await client.query(`SELECT count(*)::int AS records FROM ${viewName}`);
  return { view: viewName, records: result.rows[0].records };
}

async function loadRecommendationData(input) {
  const connectionString = dbUrl();
  if (!connectionString) {
    throw new Error(`IOE_PG_URL ontbreekt. Zet deze in ${ENV_PATH} of de shell environment.`);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const run = await client.query(
      `SELECT rr.id, rr.status, rr.duration_hours, rr.household_adults,
              rr.household_children, rr.household_pets, rr.created_at,
              p.slug AS package_slug, p.name AS package_name,
              t.slug AS tier_slug, t.name AS tier_name,
              COALESCE(
                json_agg(json_build_object('slug', a.slug, 'name', a.name) ORDER BY a.slug)
                FILTER (WHERE a.id IS NOT NULL),
                '[]'::json
              ) AS addons
         FROM recommendation_run rr
         JOIN package p ON p.id = rr.package_id
         JOIN tier t ON t.id = rr.tier_id
         LEFT JOIN recommendation_run_addon rra ON rra.recommendation_run_id = rr.id
         LEFT JOIN addon a ON a.id = rra.addon_id
        WHERE p.slug = $1
          AND t.slug = $2
          AND rr.duration_hours = $3
          AND rr.household_adults = $4
          AND rr.household_children = $5
          AND rr.household_pets = $6
          AND EXISTS (
            SELECT 1
            FROM recommendation_run_addon rra_filter
            JOIN addon a_filter ON a_filter.id = rra_filter.addon_id
            WHERE rra_filter.recommendation_run_id = rr.id
              AND a_filter.slug = ANY($7)
          )
        GROUP BY rr.id, p.id, t.id
        ORDER BY rr.created_at DESC
        LIMIT 1`,
      [
        input.package_slug,
        input.tier_slug,
        input.duration_hours,
        input.household_adults,
        input.household_children,
        input.household_pets,
        input.addon_slugs,
      ],
    );

    if (!run.rows.length) {
      throw new Error(`Geen generated recommendation_run gevonden voor tier=${input.tier_slug}, addon=${input.addon_slugs.join(',')}. Draai eerst de recommendation engine voor deze input.`);
    }

    const runId = run.rows[0].id;
    const lines = await client.query(
      `SELECT gpl.id, i.title, i.sku, gpl.quantity, gpl.is_accessory, gpl.is_core_line,
              gpl.selection_score, gpl.explanation_public, gpl.explanation_internal,
              pt.slug AS product_type_slug,
              COALESCE(n.slug, '') AS primary_reason,
              (SELECT count(*)::int FROM generated_line_source gls WHERE gls.generated_package_line_id = gpl.id) AS source_count,
              (SELECT count(*)::int FROM generated_line_coverage glc WHERE glc.generated_package_line_id = gpl.id) AS coverage_count
         FROM generated_package_line gpl
         JOIN item i ON i.id = gpl.item_id
         JOIN product_type pt ON pt.id = gpl.product_type_id
         LEFT JOIN scenario_need sn ON sn.id = gpl.primary_reason_scenario_need_id
         LEFT JOIN need n ON n.id = sn.need_id
        WHERE gpl.recommendation_run_id = $1
        ORDER BY gpl.is_accessory ASC, i.title ASC`,
      [runId],
    );

    const usageConstraints = await client.query(
      `SELECT gpl.id AS line_id, iuc.constraint_type, iuc.severity,
              iuc.public_warning, iuc.internal_notes, iuc.blocks_recommendation
         FROM generated_package_line gpl
         JOIN item_usage_constraint iuc ON iuc.item_id = gpl.item_id AND iuc.status = 'active'
        WHERE gpl.recommendation_run_id = $1
        ORDER BY gpl.id, iuc.severity DESC, iuc.constraint_type`,
      [runId],
    );

    const tasks = await client.query(
      `WITH run_context AS (
          SELECT rr.id, rr.package_id
          FROM recommendation_run rr
          WHERE rr.id = $1
        ),
        active_scenarios AS (
          SELECT ps.scenario_id
          FROM package_scenario ps
          JOIN run_context rc ON rc.package_id = ps.package_id
          UNION
          SELECT ag.scenario_id
          FROM recommendation_run_addon rra
          JOIN addon_scenario ag ON ag.addon_id = rra.addon_id
          JOIN run_context rc ON rc.id = rra.recommendation_run_id
        )
        SELECT pt.task_slug, pt.title, pt.description_public, pt.internal_notes,
               pt.priority, pt.requires_completion, n.slug AS need_slug
        FROM preparedness_task pt
        JOIN scenario_need sn ON sn.id = pt.scenario_need_id
        JOIN need n ON n.id = sn.need_id
        JOIN active_scenarios act ON act.scenario_id = sn.scenario_id
        WHERE pt.status = 'active'
        ORDER BY pt.priority, pt.task_slug`,
      [runId],
    );

    const sources = await client.query(
      `SELECT gpl.id AS line_id, gls.source_type, n.slug AS scenario_need,
              parent_i.title AS parent_item, gls.explanation
         FROM generated_line_source gls
         JOIN generated_package_line gpl ON gpl.id = gls.generated_package_line_id
         LEFT JOIN scenario_need sn ON sn.id = gls.scenario_need_id
         LEFT JOIN need n ON n.id = sn.need_id
         LEFT JOIN generated_package_line parent_gpl ON parent_gpl.id = gls.parent_generated_package_line_id
         LEFT JOIN item parent_i ON parent_i.id = parent_gpl.item_id
        WHERE gpl.recommendation_run_id = $1
        ORDER BY gpl.id, gls.source_type, parent_i.title`,
      [runId],
    );

    const coverage = await client.query(
      `SELECT gpl.id AS line_id, n.slug AS need, c.slug AS capability,
              glc.coverage_strength, glc.counted_as_sufficient, glc.notes
         FROM generated_line_coverage glc
         JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
         JOIN scenario_need sn ON sn.id = glc.scenario_need_id
         JOIN need n ON n.id = sn.need_id
         JOIN capability c ON c.id = glc.capability_id
        WHERE gpl.recommendation_run_id = $1
        ORDER BY gpl.id, n.slug, c.slug`,
      [runId],
    );

    const blockingQa = [];
    for (const view of BLOCKING_QA_VIEWS) {
      blockingQa.push(await countView(client, view));
    }

    const warningQa = [];
    for (const view of WARNING_QA_VIEWS) {
      warningQa.push(await countView(client, view));
    }
    const generatedQa = {
      withoutSources: await countView(client, 'qa_generated_lines_without_sources'),
      productTypeMismatch: await countView(client, 'qa_generated_line_product_type_mismatch'),
    };

    return {
      input,
      run: run.rows[0],
      lines: lines.rows,
      tasks: tasks.rows,
      sources: sources.rows,
      coverage: coverage.rows,
      usageConstraints: usageConstraints.rows,
      blockingQa,
      warningQa,
      generatedQa,
    };
  } finally {
    await client.end();
  }
}

function rowsByLine(rows) {
  return rows.reduce((acc, row) => {
    if (!acc.has(row.line_id)) acc.set(row.line_id, []);
    acc.get(row.line_id).push(row);
    return acc;
  }, new Map());
}

function renderQaPanel(data) {
  const blockingTotal = data.blockingQa.reduce((sum, row) => sum + row.records, 0);
  const warningTotal = data.warningQa.reduce((sum, row) => sum + row.records, 0);
  const qaOk = blockingTotal === 0 &&
    warningTotal === 0 &&
    data.generatedQa.withoutSources.records === 0 &&
    data.generatedQa.productTypeMismatch.records === 0;

  return `
    <section class="band">
      <div class="section-head">
        <h2>QA-paneel</h2>
        <span class="status ${qaOk ? 'ok' : 'warn'}">${qaOk ? 'alles 0' : 'aandacht nodig'}</span>
      </div>
      <div class="metrics">
        <div><strong>${blockingTotal}</strong><span>blocking QA count</span></div>
        <div><strong>${warningTotal}</strong><span>warning QA count</span></div>
        <div><strong>${data.generatedQa.withoutSources.records}</strong><span>generated lines without sources</span></div>
        <div><strong>${data.generatedQa.productTypeMismatch.records}</strong><span>generated line producttype mismatch</span></div>
      </div>
      <details>
        <summary>Blocking views</summary>
        <table>
          <thead><tr><th>View</th><th>Records</th></tr></thead>
          <tbody>${data.blockingQa.map(row => `<tr><td>${escapeHtml(row.view)}</td><td>${row.records}</td></tr>`).join('')}</tbody>
        </table>
      </details>
      <details>
        <summary>Warning/context views</summary>
        <table>
          <thead><tr><th>View</th><th>Records</th></tr></thead>
          <tbody>${data.warningQa.map(row => `<tr><td>${escapeHtml(row.view)}</td><td>${row.records}</td></tr>`).join('')}</tbody>
        </table>
      </details>
    </section>`;
}

function renderPage(data) {
  const sourcesByLine = rowsByLine(data.sources);
  const coverageByLine = rowsByLine(data.coverage);
  const usageByLine = rowsByLine(data.usageConstraints);
  const blockingTotal = data.blockingQa.reduce((sum, row) => sum + row.records, 0);
  const warningTotal = data.warningQa.reduce((sum, row) => sum + row.records, 0);
  const qaStatus = blockingTotal === 0 && warningTotal === 0 ? 'clean' : 'attention';
  const currentAddon = data.input.addon_slugs[0] || 'stroomuitval';

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
    main { max-width: 1420px; margin: 0 auto; padding: 24px 32px 48px; }
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
    pre {
      overflow: auto;
      background: #101820;
      color: #e5edf5;
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
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
    .pill {
      display: inline-block;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 12px;
      color: #374151;
      background: white;
    }
    .pill.good { border-color: #99d4cc; background: #e8f7f4; color: #0f766e; }
    .pill.backup { border-color: #f4c27d; background: #fff7ed; color: #92400e; }
    .governance {
      border-left: 4px solid var(--warn);
      background: #fff7ed;
      padding: 12px;
      margin-top: 12px;
      border-radius: 4px;
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
    <div class="subtle">Alle data komt uit bestaande generated recommendation output. Geen checkout, account of betaalflow.</div>
  </header>
  <main>
    <section class="band">
      <div class="section-head">
        <h2>Recommendation summary</h2>
        <span class="status ${qaStatus === 'clean' ? 'ok' : 'warn'}">QA ${escapeHtml(qaStatus)}</span>
      </div>
      <div style="margin-bottom:14px">
        <a class="pill ${currentAddon === 'stroomuitval' ? 'good' : ''}" href="/internal/recommendation-poc?addon=stroomuitval&tier=${escapeHtml(data.input.tier_slug)}">Stroomuitval</a>
        <a class="pill ${currentAddon === 'drinkwater' ? 'good' : ''}" href="/internal/recommendation-poc?addon=drinkwater&tier=${escapeHtml(data.input.tier_slug)}">Drinkwater</a>
        <a class="pill ${currentAddon === 'voedsel_bereiding' ? 'good' : ''}" href="/internal/recommendation-poc?addon=voedsel_bereiding&tier=${escapeHtml(data.input.tier_slug)}">Voedsel</a>
        <a class="pill ${currentAddon === 'hygiene_sanitatie_afval' ? 'good' : ''}" href="/internal/recommendation-poc?addon=hygiene_sanitatie_afval&tier=${escapeHtml(data.input.tier_slug)}">Hygiene</a>
        <a class="pill ${currentAddon === 'ehbo_persoonlijke_zorg' ? 'good' : ''}" href="/internal/recommendation-poc?addon=ehbo_persoonlijke_zorg&tier=${escapeHtml(data.input.tier_slug)}">EHBO</a>
        <a class="pill ${currentAddon === 'warmte_droog_shelter_light' ? 'good' : ''}" href="/internal/recommendation-poc?addon=warmte_droog_shelter_light&tier=${escapeHtml(data.input.tier_slug)}">Warmte/Droog</a>
        <span class="subtle" style="margin-left:8px">Interne add-onkeuze voor bestaande POC-output.</span>
      </div>
      <div style="margin-bottom:14px">
        <a class="pill ${data.input.tier_slug === 'basis' ? 'good' : ''}" href="/internal/recommendation-poc?addon=${escapeHtml(currentAddon)}&tier=basis">Basis</a>
        <a class="pill ${data.input.tier_slug === 'basis_plus' ? 'good' : ''}" href="/internal/recommendation-poc?addon=${escapeHtml(currentAddon)}&tier=basis_plus">Basis+</a>
        <span class="subtle" style="margin-left:8px">Tierkeuze voor dezelfde interne POC-input.</span>
      </div>
      <div class="summary-grid">
        <div><span>recommendation_run_id</span><strong>${escapeHtml(data.run.id)}</strong></div>
        <div><span>status</span><strong>${escapeHtml(data.run.status)}</strong></div>
        <div><span>package</span><strong>${escapeHtml(data.run.package_name)} (${escapeHtml(data.run.package_slug)})</strong></div>
        <div><span>tier</span><strong>${escapeHtml(data.run.tier_name)} (${escapeHtml(data.run.tier_slug)})</strong></div>
        <div><span>add-ons</span><strong>${data.run.addons.map(a => `${escapeHtml(a.name)} (${escapeHtml(a.slug)})`).join(', ')}</strong></div>
        <div><span>duration_hours</span><strong>${data.run.duration_hours}</strong></div>
        <div><span>household_adults</span><strong>${data.run.household_adults}</strong></div>
        <div><span>QA-status</span><strong>${escapeHtml(qaStatus)}</strong></div>
      </div>
      <h3 style="margin-top:16px">Gebruikte input</h3>
      <pre>${escapeHtml(JSON.stringify(data.input, null, 2))}</pre>
    </section>

    <section class="band">
      <div class="section-head">
        <h2>Pakketregels</h2>
        <span class="pill">${data.lines.length} regels</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>SKU</th>
            <th class="num">Qty</th>
            <th>Role</th>
            <th class="num">Score</th>
            <th>Public explanation</th>
            <th class="num">Sources</th>
            <th class="num">Coverage</th>
          </tr>
        </thead>
        <tbody>
          ${data.lines.map(line => `
            <tr>
              <td class="line-title">${escapeHtml(line.title)}</td>
              <td>${escapeHtml(line.sku)}</td>
              <td class="num">${escapeHtml(line.quantity)}</td>
              <td>${escapeHtml(roleLabel(line))}</td>
              <td class="num">${escapeHtml(line.selection_score)}</td>
              <td>${escapeHtml(line.explanation_public)}</td>
              <td class="num">${line.source_count}</td>
              <td class="num">${line.coverage_count}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="band">
      <h2>Sources en coverage per item</h2>
      ${data.lines.map(line => {
        const lineSources = sourcesByLine.get(line.id) || [];
        const lineCoverage = coverageByLine.get(line.id) || [];
        const lineUsage = usageByLine.get(line.id) || [];
        const isRadio = line.sku === 'IOE-RADIO-AAUSB-PLUS';
        const isFoodPrep = ['IOE-COOKER-OUTDOOR-GAS-BASIC', 'IOE-COOKER-OUTDOOR-GAS-PLUS', 'IOE-FUEL-GAS-230G-BASIC', 'IOE-FUEL-GAS-230G-PLUS'].includes(line.sku);
        const isHygieneGoverned = ['IOE-HANDGEL-BASIC', 'IOE-HANDGEL-PLUS', 'IOE-HYGIENE-WIPES-BASIC', 'IOE-HYGIENE-WIPES-PLUS', 'IOE-GLOVES-NITRILE-BASIC', 'IOE-GLOVES-NITRILE-PLUS'].includes(line.sku);
        const isSanitationGoverned = ['IOE-TOILET-BAGS-BASIC', 'IOE-TOILET-BAGS-PLUS', 'IOE-ABSORBENT-BASIC', 'IOE-ABSORBENT-PLUS', 'IOE-WASTE-BAGS-BASIC', 'IOE-WASTE-BAGS-PLUS', 'IOE-ZIPBAGS-BASIC', 'IOE-ZIPBAGS-PLUS'].includes(line.sku);
        const isEhboGoverned = ['IOE-FIRSTAID-KIT-BASIC', 'IOE-FIRSTAID-KIT-PLUS', 'IOE-PLASTERS-BASIC', 'IOE-PLASTERS-PLUS', 'IOE-STERILE-GAUZE-BASIC', 'IOE-STERILE-GAUZE-PLUS', 'IOE-WOUND-CLEANING-BASIC', 'IOE-WOUND-CLEANING-PLUS', 'IOE-MEDICAL-TAPE-BASIC', 'IOE-MEDICAL-TAPE-PLUS', 'IOE-THERMOMETER-PLUS'].includes(line.sku);
        const isWarmthGoverned = ['IOE-THERMAL-BLANKET-BASIC', 'IOE-THERMAL-BLANKET-PLUS', 'IOE-EMERGENCY-BLANKET-BASIC', 'IOE-EMERGENCY-BIVVY-PLUS'].includes(line.sku);
        const isShelterLightGoverned = ['IOE-PONCHO-BASIC', 'IOE-PONCHO-PLUS', 'IOE-TARP-LIGHT-BASIC', 'IOE-TARP-LIGHT-PLUS', 'IOE-PARACORD-BASIC', 'IOE-PARACORD-PLUS', 'IOE-TARP-PEGS-BASIC', 'IOE-TARP-PEGS-PLUS', 'IOE-GROUNDSHEET-PLUS'].includes(line.sku);
        return `
          <details>
            <summary>${escapeHtml(line.title)} <span class="pill">${escapeHtml(line.sku)}</span> <span class="pill ${roleLabel(line) === 'core' ? 'good' : 'backup'}">${escapeHtml(roleLabel(line))}</span></summary>
            ${isRadio ? `<div class="governance">Laad- en lampfuncties tellen alleen als backup en vervangen geen powerbank, hoofdlamp of lantaarn.</div>` : ''}
            ${isFoodPrep ? `<div class="governance">Voedselbereiding is ondersteunend. Gas, brandstof en open vuur worden niet als primary voedseldekking geteld.</div>` : ''}
            ${isHygieneGoverned ? `<div class="governance">Hygiene-items claimen geen medische bescherming, steriliteit of volledige infectiepreventie.</div>` : ''}
            ${isSanitationGoverned ? `<div class="governance">Sanitatie- en afvalitems zijn bedoeld voor tijdelijke containment en niet voor gevaarlijk, chemisch of medisch afval.</div>` : ''}
            ${isEhboGoverned ? `<div class="governance">EHBO-items ondersteunen kleine incidenten en observatie. Ze vervangen geen arts, diagnose, behandeling of noodhulp.</div>` : ''}
            ${isWarmthGoverned ? `<div class="governance">Warmte-items ondersteunen warmtebehoud. Ze vervangen geen slaapcomfort en behandelen geen onderkoeling. Houd ze uit de buurt van open vuur.</div>` : ''}
            ${isShelterLightGoverned ? `<div class="governance">Shelter-light items zijn tijdelijke afscherming en persoonlijke regenbescherming. Ze zijn geen tent, geen warmtebron, geen volledige shelter en geen garantie tegen extreem weer.</div>` : ''}
            <h3 style="margin-top:12px">Sources</h3>
            <table>
              <thead><tr><th>source_type</th><th>scenario_need</th><th>parent item</th><th>explanation</th></tr></thead>
              <tbody>
                ${lineSources.map(src => `
                  <tr>
                    <td>${escapeHtml(src.source_type)}</td>
                    <td>${escapeHtml(src.scenario_need)}</td>
                    <td>${escapeHtml(src.parent_item || '')}</td>
                    <td>${escapeHtml(src.explanation)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
            <h3 style="margin-top:12px">Coverage</h3>
            <table>
              <thead><tr><th>need</th><th>capability</th><th>coverage_strength</th><th>status</th><th>notes</th></tr></thead>
              <tbody>
                ${lineCoverage.map(cov => `
                  <tr>
                    <td>${escapeHtml(cov.need)}</td>
                    <td>${escapeHtml(cov.capability)}</td>
                    <td>${escapeHtml(cov.coverage_strength)}</td>
                    <td><span class="pill ${cov.counted_as_sufficient ? 'good' : 'backup'}">${fmtBool(cov.counted_as_sufficient)}</span></td>
                    <td>${escapeHtml(cov.notes)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
            ${lineUsage.length ? `
              <h3 style="margin-top:12px">Usage constraints</h3>
              <table>
                <thead><tr><th>constraint</th><th>severity</th><th>public warning</th><th>internal notes</th></tr></thead>
                <tbody>
                  ${lineUsage.map(rule => `
                    <tr>
                      <td>${escapeHtml(rule.constraint_type)}</td>
                      <td>${escapeHtml(rule.severity)}</td>
                      <td>${escapeHtml(rule.public_warning)}</td>
                      <td>${escapeHtml(rule.internal_notes)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>` : ''}
          </details>`;
      }).join('')}
    </section>

    ${data.tasks.length ? `
      <section class="band">
        <div class="section-head">
          <h2>Tasks en persoonlijke zorgchecks</h2>
          <span class="pill">${data.tasks.length} tasks</span>
        </div>
        <div class="governance">Persoonlijke medicatie en pijnstilling worden hier als task/check getoond, niet als generiek item, supplier offer of doseringsadvies.</div>
        <table>
          <thead><tr><th>Task</th><th>Need</th><th>Priority</th><th>Public note</th><th>Internal note</th></tr></thead>
          <tbody>
            ${data.tasks.map(task => `
              <tr>
                <td class="line-title">${escapeHtml(task.title)}<br><span class="subtle">${escapeHtml(task.task_slug)}</span></td>
                <td>${escapeHtml(task.need_slug)}</td>
                <td>${escapeHtml(task.priority)}</td>
                <td>${escapeHtml(task.description_public)}</td>
                <td>${escapeHtml(task.internal_notes)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </section>` : ''}

    ${renderQaPanel(data)}
  </main>
</body>
</html>`;
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/') {
      res.writeHead(302, { Location: '/internal/recommendation-poc' });
      res.end();
      return;
    }

    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (url.pathname !== '/internal/recommendation-poc') {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const tier = url.searchParams.get('tier') === 'basis' ? 'basis' : 'basis_plus';
    const addonParam = url.searchParams.get('addon');
    const addon = ['stroomuitval', 'drinkwater', 'voedsel_bereiding', 'hygiene_sanitatie_afval', 'ehbo_persoonlijke_zorg', 'warmte_droog_shelter_light'].includes(addonParam) ? addonParam : 'stroomuitval';
    const data = await loadRecommendationData(inputForSelection(tier, addon));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderPage(data));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Internal POC error:\n${error.stack || error.message}`);
  }
}

http.createServer(handleRequest).listen(PORT, HOST, () => {
  console.log(`Internal recommendation POC: http://${HOST}:${PORT}/internal/recommendation-poc`);
});
