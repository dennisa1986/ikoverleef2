const {
  BLOCKING_QA_VIEWS,
  WARNING_QA_VIEWS,
  countView,
} = require('./calculate');

const RELEASE_BASELINES = [
  'v0.1.0-stroomuitval-baseline',
  'v0.2.0-drinkwater-baseline',
  'v0.3.0-voedsel-bereiding-baseline',
  'v0.4.0-hygiene-sanitatie-baseline',
  'v0.5.0-ehbo-baseline',
  'v0.6.0-warmte-droog-shelter-light-baseline',
  'v0.7.0-evacuatie-baseline',
  'v0.8.0-taken-profielen-baseline',
  'v0.9.0-engine-hardening-baseline',
  'v0.10.0-backoffice-hardening-baseline',
];

async function loadQaDashboardSummary(client) {
  const blockingViews = [];
  for (const view of BLOCKING_QA_VIEWS) {
    blockingViews.push(await countView(client, view));
  }

  const warningViews = [];
  for (const view of WARNING_QA_VIEWS) {
    warningViews.push(await countView(client, view));
  }

  const generatedLinesWithoutSources = await countView(client, 'qa_generated_lines_without_sources');
  const generatedLineProducttypeMismatch = await countView(client, 'qa_generated_line_product_type_mismatch');
  const blockingTotal = blockingViews.reduce((sum, row) => sum + row.records, 0);
  const warningTotal = warningViews.reduce((sum, row) => sum + row.records, 0);

  return {
    blocking_total: blockingTotal,
    warning_total: warningTotal,
    generated_lines_without_sources: generatedLinesWithoutSources.records,
    generated_line_producttype_mismatch: generatedLineProducttypeMismatch.records,
    status: blockingTotal > 0
      ? 'blocking'
      : (warningTotal > 0 || generatedLinesWithoutSources.records > 0 || generatedLineProducttypeMismatch.records > 0 ? 'attention' : 'clean'),
    per_view_records: [
      ...blockingViews.map((row) => ({ ...row, category: 'blocking' })),
      ...warningViews.map((row) => ({ ...row, category: 'warning' })),
      { view: generatedLinesWithoutSources.view, records: generatedLinesWithoutSources.records, category: 'generated' },
      { view: generatedLineProducttypeMismatch.view, records: generatedLineProducttypeMismatch.records, category: 'generated' },
    ],
  };
}

async function loadScenarioMatrix(client, limit = 250) {
  const result = await client.query(
    `SELECT s.slug AS scenario_slug,
            s.status::text AS scenario_status,
            n.slug AS need_slug,
            n.status::text AS need_status,
            n.content_only AS need_content_only,
            (SELECT count(*)::int
               FROM need_capability nc
              WHERE nc.need_id = n.id) AS capability_count,
            (SELECT count(*)::int
               FROM scenario_need_product_rule snpr
              WHERE snpr.scenario_need_id = sn.id
                AND snpr.status = 'active') AS product_rule_count,
            (SELECT count(DISTINCT vic.id)::int
               FROM scenario_need_product_rule snpr
               JOIN product_variant pv ON pv.product_type_id = snpr.product_type_id
               JOIN variant_item_candidate vic ON vic.product_variant_id = pv.id
               JOIN tier t ON t.id = vic.tier_id
              WHERE snpr.scenario_need_id = sn.id
                AND snpr.status = 'active'
                AND pv.status = 'active'
                AND vic.status = 'active'
                AND t.slug = 'basis') AS active_candidate_count_basis,
            (SELECT count(DISTINCT vic.id)::int
               FROM scenario_need_product_rule snpr
               JOIN product_variant pv ON pv.product_type_id = snpr.product_type_id
               JOIN variant_item_candidate vic ON vic.product_variant_id = pv.id
               JOIN tier t ON t.id = vic.tier_id
              WHERE snpr.scenario_need_id = sn.id
                AND snpr.status = 'active'
                AND pv.status = 'active'
                AND vic.status = 'active'
                AND t.slug = 'basis_plus') AS active_candidate_count_basis_plus,
            EXISTS (
              SELECT 1
                FROM scenario_need_product_rule snpr
                JOIN product_variant pv ON pv.product_type_id = snpr.product_type_id
                JOIN variant_item_candidate vic ON vic.product_variant_id = pv.id
                JOIN item i ON i.id = vic.item_id
                JOIN item_capability ic ON ic.item_id = i.id
                JOIN need_capability nc ON nc.need_id = n.id AND nc.capability_id = ic.capability_id
               WHERE snpr.scenario_need_id = sn.id
                 AND snpr.status = 'active'
                 AND pv.status = 'active'
                 AND vic.status = 'active'
                 AND i.status = 'active'
                 AND ic.coverage_strength = 'primary'
            ) AS has_primary_coverage_candidate,
            EXISTS (
              SELECT 1
                FROM scenario_need_product_rule snpr
                JOIN product_variant pv ON pv.product_type_id = snpr.product_type_id
                JOIN variant_item_candidate vic ON vic.product_variant_id = pv.id
                JOIN item_accessory_requirement iar ON iar.item_id = vic.item_id
               WHERE snpr.scenario_need_id = sn.id
                 AND snpr.status = 'active'
                 AND pv.status = 'active'
                 AND vic.status = 'active'
                 AND iar.status = 'active'
            ) AS has_accessory_requirements,
            (SELECT count(*)::int
               FROM claim_governance_rule cgr
              WHERE cgr.status = 'active'
                AND (
                  cgr.scenario_id = s.id
                  OR cgr.product_type_id IN (
                    SELECT snpr.product_type_id
                      FROM scenario_need_product_rule snpr
                     WHERE snpr.scenario_need_id = sn.id
                       AND snpr.status = 'active'
                  )
                )) AS governance_flag_count
       FROM scenario_need sn
       JOIN scenario s ON s.id = sn.scenario_id
       JOIN need n ON n.id = sn.need_id
      ORDER BY s.slug, n.slug
      LIMIT $1`,
    [limit],
  );
  return result.rows;
}

async function loadProductReadiness(client, limit = 250) {
  const result = await client.query(
    `WITH item_counts AS (
       SELECT i.id AS item_id,
              count(DISTINCT ic.capability_id)::int AS capability_count,
              count(DISTINCT so.id)::int AS supplier_offer_count,
              count(DISTINCT iuc.id)::int AS usage_constraint_count,
              count(DISTINCT cgr.id)::int AS governance_rule_count,
              count(DISTINCT vic.id)::int AS candidate_count,
              bool_or(COALESCE(iuc.blocks_recommendation, false)) AS has_blocking_constraint
         FROM item i
         LEFT JOIN item_capability ic ON ic.item_id = i.id
         LEFT JOIN supplier_offer so ON so.item_id = i.id AND so.status = 'active'
         LEFT JOIN item_usage_constraint iuc ON iuc.item_id = i.id AND iuc.status = 'active'
         LEFT JOIN claim_governance_rule cgr ON cgr.status = 'active' AND (cgr.item_id = i.id OR cgr.product_type_id = i.product_type_id)
         LEFT JOIN variant_item_candidate vic ON vic.item_id = i.id AND vic.status = 'active'
        GROUP BY i.id
      )
      SELECT i.sku AS item_sku,
             i.title AS item_title,
             i.status::text AS item_status,
             pt.slug AS product_type_slug,
             ic.capability_count,
             ic.supplier_offer_count,
             ic.usage_constraint_count,
             ic.governance_rule_count,
             ic.candidate_count,
             CASE
               WHEN i.status <> 'active' OR ic.has_blocking_constraint THEN 'blocked'
               WHEN ic.supplier_offer_count = 0 THEN 'poc_only'
               WHEN ic.capability_count = 0 OR ic.candidate_count = 0 THEN 'needs_attention'
               ELSE 'ready'
             END AS readiness_label,
             concat_ws('; ',
               CASE WHEN i.status <> 'active' THEN 'item is not active' END,
               CASE WHEN ic.has_blocking_constraint THEN 'item has blocking usage constraint' END,
               CASE WHEN ic.supplier_offer_count = 0 THEN 'supplier offer ontbreekt of is POC-only' END,
               CASE WHEN ic.capability_count = 0 THEN 'capabilities ontbreken' END,
               CASE WHEN ic.candidate_count = 0 THEN 'geen actieve candidate-koppeling' END,
               CASE WHEN ic.usage_constraint_count > 0 THEN 'usage constraints zichtbaar' END,
               CASE WHEN ic.governance_rule_count > 0 THEN 'governance rules zichtbaar' END
             ) AS readiness_reason
        FROM item i
        JOIN product_type pt ON pt.id = i.product_type_id
        JOIN item_counts ic ON ic.item_id = i.id
       ORDER BY readiness_label DESC, pt.slug, i.sku
       LIMIT $1`,
    [limit],
  );
  return result.rows;
}

async function loadCandidateReadiness(client, limit = 250) {
  const result = await client.query(
    `SELECT t.slug AS tier_slug,
            pt.slug AS product_type_slug,
            i.sku AS item_sku,
            vic.is_default_candidate,
            i.status::text AS item_status,
            (i.product_type_id = pv.product_type_id) AS product_type_match,
            (SELECT count(*)::int FROM supplier_offer so WHERE so.item_id = i.id AND so.status = 'active') AS supplier_offer_count,
            (SELECT count(*)::int FROM item_capability ic WHERE ic.item_id = i.id) AS capability_count,
            CASE
              WHEN i.status <> 'active' OR i.product_type_id <> pv.product_type_id THEN 'blocked'
              WHEN (SELECT count(*) FROM supplier_offer so WHERE so.item_id = i.id AND so.status = 'active') = 0 THEN 'poc_only'
              WHEN (SELECT count(*) FROM item_capability ic WHERE ic.item_id = i.id) = 0 THEN 'needs_attention'
              ELSE 'ready'
            END AS readiness_label
       FROM variant_item_candidate vic
       JOIN product_variant pv ON pv.id = vic.product_variant_id
       JOIN product_type pt ON pt.id = pv.product_type_id
       JOIN tier t ON t.id = vic.tier_id
       JOIN item i ON i.id = vic.item_id
      WHERE vic.status = 'active'
      ORDER BY t.slug, pt.slug, vic.is_default_candidate DESC, i.sku
      LIMIT $1`,
    [limit],
  );
  return result.rows;
}

async function loadGovernanceAttention(client, limit = 250) {
  const result = await client.query(
    `SELECT i.sku AS item_sku,
            pt.slug AS product_type_slug,
            iuc.constraint_type::text AS constraint_type,
            iuc.severity::text AS severity,
            iuc.blocks_recommendation,
            iuc.public_warning,
            iuc.internal_notes,
            COALESCE(gov.governance_context, 'usage_constraint') AS governance_context
       FROM item_usage_constraint iuc
       JOIN item i ON i.id = iuc.item_id
       JOIN product_type pt ON pt.id = i.product_type_id
       LEFT JOIN LATERAL (
         SELECT string_agg(
                  concat_ws(': ', cgr.category, COALESCE(cgr.prohibited_claim, cgr.allowed_framing, cgr.internal_rationale)),
                  ' | '
                ) AS governance_context
           FROM claim_governance_rule cgr
          WHERE cgr.status = 'active'
            AND (cgr.item_id = i.id OR cgr.product_type_id = pt.id)
       ) gov ON true
      WHERE iuc.status = 'active'
      ORDER BY iuc.blocks_recommendation DESC, iuc.severity DESC, pt.slug, i.sku
      LIMIT $1`,
    [limit],
  );
  return result.rows;
}

async function loadSupplierOfferAttention(client, limit = 250) {
  const result = await client.query(
    `SELECT i.sku AS item_sku,
            count(so.id)::int AS supplier_offer_count,
            CASE
              WHEN count(so.id) = 0 THEN 'needs_attention'
              WHEN bool_or(so.is_preferred) THEN 'ready'
              ELSE 'poc_only'
            END AS attention_label,
            CASE
              WHEN count(so.id) = 0 THEN 'Geen actieve supplier_offer; beheerder moet POC/source controleren.'
              WHEN bool_or(so.is_preferred) THEN 'Heeft actieve preferred supplier offer.'
              ELSE 'Heeft actieve supplier offer, maar geen preferred offer.'
            END AS attention_reason
       FROM item i
       LEFT JOIN supplier_offer so ON so.item_id = i.id AND so.status = 'active'
      WHERE i.status = 'active'
      GROUP BY i.id, i.sku
      ORDER BY attention_label DESC, i.sku
      LIMIT $1`,
    [limit],
  );
  return result.rows;
}

function loadReleaseBaselineOverview() {
  return {
    baselines: RELEASE_BASELINES.map((tag, index) => ({
      tag,
      order: index + 1,
      status: tag === 'v0.10.0-backoffice-hardening-baseline' ? 'target' : 'released',
    })),
    latest_input_baseline: 'v0.9.0-engine-hardening-baseline',
    target_baseline: 'v0.10.0-backoffice-hardening-baseline',
    note: 'Runtime/static baseline-overzicht; geen database release registry.',
  };
}

function buildOpenAttentionPoints(data) {
  const points = [];
  const qa = data.qaSummary;
  if (qa.blocking_total > 0) points.push('Blocking QA views hebben records.');
  if (qa.generated_lines_without_sources > 0) points.push('Generated lines without sources vereist inspectie.');
  if (qa.generated_line_producttype_mismatch > 0) points.push('Generated line producttype mismatch vereist inspectie.');
  const pocOnlyItems = data.productReadiness.filter((row) => row.readiness_label === 'poc_only').length;
  if (pocOnlyItems > 0) points.push(`${pocOnlyItems} items hebben runtime label poc_only door ontbrekende actieve supplier offer.`);
  const blockedItems = data.productReadiness.filter((row) => row.readiness_label === 'blocked').length;
  if (blockedItems > 0) points.push(`${blockedItems} items hebben runtime label blocked.`);
  if (!points.length) points.push('Geen blocking backoffice-aandachtspunten in deze inspectie.');
  return points;
}

async function loadBackofficeData(client) {
  const data = {
    qaSummary: await loadQaDashboardSummary(client),
    scenarioMatrix: await loadScenarioMatrix(client),
    productReadiness: await loadProductReadiness(client),
    candidateReadiness: await loadCandidateReadiness(client),
    governanceAttention: await loadGovernanceAttention(client),
    supplierOfferAttention: await loadSupplierOfferAttention(client),
    releaseBaseline: loadReleaseBaselineOverview(),
  };
  data.openAttentionPoints = buildOpenAttentionPoints(data);
  return data;
}

module.exports = {
  RELEASE_BASELINES,
  loadQaDashboardSummary,
  loadScenarioMatrix,
  loadProductReadiness,
  loadCandidateReadiness,
  loadGovernanceAttention,
  loadSupplierOfferAttention,
  loadReleaseBaselineOverview,
  loadBackofficeData,
};
