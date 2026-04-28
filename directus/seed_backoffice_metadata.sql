-- Directus backoffice POC metadata for Ik overleef.
-- Database-first: this only configures Directus system metadata on top of the existing schema.

BEGIN;

UPDATE directus_roles
   SET name = 'Admin',
       icon = 'verified',
       description = 'Volledige lokale POC-admin.'
 WHERE name = 'Administrator';

UPDATE directus_policies
   SET name = 'Admin',
       description = 'Volledige lokale POC-admin policy.',
       admin_access = true,
       app_access = true
 WHERE name = 'Administrator';

WITH wanted_roles(name, icon, description) AS (
  VALUES
    ('Productbeheer', 'inventory_2', 'Beheer van productcatalogus, accessoires en leveranciersdata.'),
    ('Expert/QA', 'fact_check', 'Inhoudelijke review, QA-views en recommendation snapshots.')
)
INSERT INTO directus_roles (id, name, icon, description)
SELECT gen_random_uuid(), name, icon, description
FROM wanted_roles wr
WHERE NOT EXISTS (SELECT 1 FROM directus_roles r WHERE r.name = wr.name);

WITH wanted_policies(name, icon, description) AS (
  VALUES
    ('Productbeheer', 'inventory_2', 'App-toegang voor productbeheer POC.'),
    ('Expert/QA', 'fact_check', 'App-toegang voor expert- en QA-review POC.')
)
INSERT INTO directus_policies (id, name, icon, description, admin_access, app_access)
SELECT gen_random_uuid(), name, icon, description, false, true
FROM wanted_policies wp
WHERE NOT EXISTS (SELECT 1 FROM directus_policies p WHERE p.name = wp.name);

INSERT INTO directus_access (id, role, policy, sort)
SELECT gen_random_uuid(), r.id, p.id, 1
FROM directus_roles r
JOIN directus_policies p ON p.name = r.name
WHERE r.name IN ('Productbeheer', 'Expert/QA')
  AND NOT EXISTS (
    SELECT 1 FROM directus_access a WHERE a.role = r.id AND a.policy = p.id
  );

WITH groups(collection, label, icon, sort) AS (
  VALUES
    ('ioe_group_frontstage_keuzes', 'Frontstage keuzes', 'tune', 10),
    ('ioe_group_scenario_intelligence', 'Scenario-intelligence', 'psychology', 20),
    ('ioe_group_productcatalogus', 'Productcatalogus', 'category', 30),
    ('ioe_group_rules_policies', 'Rules & policies', 'rule', 40),
    ('ioe_group_accessoires_specs', 'Accessoires & fysieke specs', 'extension', 50),
    ('ioe_group_safety_governance', 'Safety & governance', 'health_and_safety', 60),
    ('ioe_group_supplier_commerce', 'Supplier & commerce', 'local_shipping', 70),
    ('ioe_group_recommendation_snapshots', 'Recommendation snapshots', 'receipt_long', 80),
    ('ioe_group_qa_dashboards', 'QA dashboards', 'dashboard', 90)
)
INSERT INTO directus_collections
  (collection, icon, note, hidden, singleton, translations, sort, collapse)
SELECT collection, icon, label, false, false,
       json_build_array(json_build_object('language', 'nl-NL', 'translation', label)),
       sort, 'open'
FROM groups g
ON CONFLICT (collection) DO UPDATE
SET icon = EXCLUDED.icon,
    note = EXCLUDED.note,
    hidden = false,
    singleton = false,
    translations = EXCLUDED.translations,
    sort = EXCLUDED.sort,
    collapse = 'open';

WITH collection_groups(collection, group_name, label, icon, sort) AS (
  VALUES
    ('package', 'ioe_group_frontstage_keuzes', 'Packages', 'inventory', 11),
    ('addon', 'ioe_group_frontstage_keuzes', 'Add-ons', 'add_box', 12),
    ('tier', 'ioe_group_frontstage_keuzes', 'Tiers', 'stairs', 13),

    ('scenario', 'ioe_group_scenario_intelligence', 'Scenarios', 'hub', 21),
    ('need', 'ioe_group_scenario_intelligence', 'Needs', 'assignment', 22),
    ('capability', 'ioe_group_scenario_intelligence', 'Capabilities', 'bolt', 23),
    ('package_scenario', 'ioe_group_scenario_intelligence', 'Package scenarios', 'link', 24),
    ('addon_scenario', 'ioe_group_scenario_intelligence', 'Addon scenarios', 'link', 25),
    ('scenario_need', 'ioe_group_scenario_intelligence', 'Scenario needs', 'schema', 26),
    ('need_capability', 'ioe_group_scenario_intelligence', 'Need capabilities', 'schema', 27),
    ('scenario_need_capability_policy', 'ioe_group_scenario_intelligence', 'Scenario need capability policies', 'policy', 28),

    ('product_type', 'ioe_group_productcatalogus', 'Product types', 'category', 31),
    ('product_variant', 'ioe_group_productcatalogus', 'Product variants', 'view_module', 32),
    ('item', 'ioe_group_productcatalogus', 'Items', 'inventory_2', 33),
    ('variant_item_candidate', 'ioe_group_productcatalogus', 'Variant item candidates', 'checklist', 34),
    ('item_capability', 'ioe_group_productcatalogus', 'Item capabilities', 'bolt', 35),
    ('product_type_capability', 'ioe_group_productcatalogus', 'Product type capabilities', 'bolt', 36),

    ('scenario_need_product_rule', 'ioe_group_rules_policies', 'Scenario need product rules', 'rule', 41),
    ('quantity_policy', 'ioe_group_rules_policies', 'Quantity policies', 'calculate', 42),
    ('dependent_quantity_policy', 'ioe_group_rules_policies', 'Dependent quantity policies', 'functions', 43),
    ('tier_selection_policy', 'ioe_group_rules_policies', 'Tier selection policies', 'tune', 44),

    ('item_accessory_requirement', 'ioe_group_accessoires_specs', 'Item accessory requirements', 'extension', 51),
    ('item_container_rule', 'ioe_group_accessoires_specs', 'Item container rules', 'inventory', 52),
    ('item_physical_spec', 'ioe_group_accessoires_specs', 'Item physical specs', 'straighten', 53),
    ('item_environmental_spec', 'ioe_group_accessoires_specs', 'Item environmental specs', 'thermostat', 54),
    ('scenario_physical_policy', 'ioe_group_accessoires_specs', 'Scenario physical policies', 'straighten', 55),
    ('scenario_environmental_policy', 'ioe_group_accessoires_specs', 'Scenario environmental policies', 'device_thermostat', 56),

    ('item_usage_constraint', 'ioe_group_safety_governance', 'Item usage constraints', 'warning', 61),
    ('claim_governance_rule', 'ioe_group_safety_governance', 'Claim governance rules', 'gavel', 62),
    ('preparedness_task', 'ioe_group_safety_governance', 'Preparedness tasks', 'task_alt', 63),

    ('supplier_offer', 'ioe_group_supplier_commerce', 'Supplier offers', 'local_shipping', 71),

    ('recommendation_run', 'ioe_group_recommendation_snapshots', 'Recommendation runs', 'receipt_long', 81),
    ('recommendation_run_addon', 'ioe_group_recommendation_snapshots', 'Recommendation run addons', 'add_link', 82),
    ('generated_package_line', 'ioe_group_recommendation_snapshots', 'Generated package lines', 'format_list_bulleted', 83),
    ('generated_line_source', 'ioe_group_recommendation_snapshots', 'Generated line sources', 'source', 84),
    ('generated_line_coverage', 'ioe_group_recommendation_snapshots', 'Generated line coverage', 'verified', 85),
    ('household_member_profile', 'ioe_group_recommendation_snapshots', 'Household member profiles', 'groups', 86),
    ('pet_profile', 'ioe_group_recommendation_snapshots', 'Pet profiles', 'pets', 87),

    ('qa_active_scenarios_without_needs', 'ioe_group_qa_dashboards', 'QA active scenarios without needs', 'report', 91),
    ('qa_active_needs_without_capabilities', 'ioe_group_qa_dashboards', 'QA active needs without capabilities', 'report', 92),
    ('qa_scenario_needs_without_product_rules', 'ioe_group_qa_dashboards', 'QA scenario needs without product rules', 'report', 93),
    ('qa_product_types_without_capabilities', 'ioe_group_qa_dashboards', 'QA product types without capabilities', 'report', 94),
    ('qa_active_items_without_capabilities', 'ioe_group_qa_dashboards', 'QA active items without capabilities', 'report', 95),
    ('qa_generated_lines_without_sources', 'ioe_group_qa_dashboards', 'QA generated lines without sources', 'report', 96)
)
INSERT INTO directus_collections
  (collection, icon, note, hidden, singleton, translations, sort, "group", collapse)
SELECT collection, icon, label, false, false,
       json_build_array(json_build_object('language', 'nl-NL', 'translation', label)),
       sort, group_name, 'open'
FROM collection_groups cg
ON CONFLICT (collection) DO UPDATE
SET icon = EXCLUDED.icon,
    note = EXCLUDED.note,
    hidden = false,
    singleton = false,
    translations = EXCLUDED.translations,
    sort = EXCLUDED.sort,
    "group" = EXCLUDED."group",
    collapse = 'open';

WITH policies AS (
  SELECT id, name FROM directus_policies WHERE name IN ('Productbeheer', 'Expert/QA')
),
product_collections(collection) AS (
  VALUES
    ('product_type'), ('product_variant'), ('item'), ('variant_item_candidate'),
    ('item_capability'), ('product_type_capability'), ('item_accessory_requirement'),
    ('item_container_rule'), ('item_physical_spec'), ('item_environmental_spec'),
    ('supplier_offer')
),
expert_collections(collection) AS (
  VALUES
    ('scenario'), ('need'), ('capability'), ('scenario_need'), ('need_capability'),
    ('scenario_need_product_rule'), ('quantity_policy'), ('claim_governance_rule'),
    ('recommendation_run'), ('generated_package_line'), ('generated_line_source'),
    ('generated_line_coverage')
),
readable_collections(collection) AS (
  VALUES
    ('package'), ('addon'), ('tier'), ('scenario'), ('need'), ('capability'),
    ('product_type'), ('product_variant'), ('item'), ('supplier_offer'),
    ('recommendation_run'), ('generated_package_line'), ('generated_line_source'),
    ('generated_line_coverage'), ('qa_active_scenarios_without_needs'),
    ('qa_active_needs_without_capabilities'), ('qa_scenario_needs_without_product_rules'),
    ('qa_product_types_without_capabilities'), ('qa_active_items_without_capabilities'),
    ('qa_generated_lines_without_sources')
),
permission_rows(policy_id, collection, action) AS (
  SELECT p.id, rc.collection, 'read' FROM policies p CROSS JOIN readable_collections rc
  UNION ALL
  SELECT p.id, pc.collection, action
  FROM policies p
  CROSS JOIN product_collections pc
  CROSS JOIN (VALUES ('create'), ('update'), ('delete')) a(action)
  WHERE p.name = 'Productbeheer'
  UNION ALL
  SELECT p.id, ec.collection, action
  FROM policies p
  CROSS JOIN expert_collections ec
  CROSS JOIN (VALUES ('create'), ('update')) a(action)
  WHERE p.name = 'Expert/QA'
)
INSERT INTO directus_permissions (collection, action, permissions, validation, presets, fields, policy)
SELECT collection, action, '{}'::json, '{}'::json, NULL, '*', policy_id
FROM permission_rows pr
WHERE NOT EXISTS (
  SELECT 1
  FROM directus_permissions dp
  WHERE dp.policy = pr.policy_id
    AND dp.collection = pr.collection
    AND dp.action = pr.action
);

WITH admin_user AS (
  SELECT id FROM directus_users WHERE email = 'admin@ikoverleef.nl' LIMIT 1
),
dashboard AS (
  INSERT INTO directus_dashboards (id, name, icon, note, color, user_created)
  SELECT gen_random_uuid(), 'QA dashboard', 'fact_check',
         'Blocking en warning QA views voor de lokale database-first POC.',
         '#D97706', id
  FROM admin_user
  WHERE NOT EXISTS (SELECT 1 FROM directus_dashboards WHERE name = 'QA dashboard')
  RETURNING id
),
dashboard_id AS (
  SELECT id FROM dashboard
  UNION ALL
  SELECT id FROM directus_dashboards WHERE name = 'QA dashboard'
  LIMIT 1
)
INSERT INTO directus_panels
  (id, dashboard, name, icon, color, show_header, note, type, position_x, position_y, width, height, options, user_created)
SELECT gen_random_uuid(), d.id, p.name, p.icon, p.color, true, p.note, 'label',
       p.position_x, p.position_y, p.width, p.height, p.options::json, au.id
FROM dashboard_id d
CROSS JOIN admin_user au
CROSS JOIN (
  VALUES
    ('Blocking QA views', 'block', '#DC2626',
     'Alle blocking views horen 0 records te geven.',
     1, 1, 18, 8,
     '{"text":"Blocking QA: qa_active_scenarios_without_needs, qa_active_needs_without_capabilities, qa_scenario_needs_without_product_rules, qa_product_types_without_capabilities, qa_active_items_without_capabilities, qa_variant_item_product_type_mismatch, qa_default_candidate_conflicts, qa_items_with_claimed_primary_coverage, qa_required_accessories_missing_candidate_items, qa_active_consumables_without_quantity_policy, qa_claim_governance_scope_invalid, qa_quantity_policy_invalid_scope, qa_generated_lines_without_sources"}'),
    ('Warning QA views', 'warning', '#F59E0B',
     'Contextuele warning views horen in deze POC ook 0 records te geven.',
     1, 9, 18, 8,
     '{"text":"Warning/contextual QA: qa_active_accessory_items_without_capabilities, qa_supplier_offers_stale, qa_evacuation_items_without_physical_specs, qa_weather_items_without_environmental_specs"}')
) AS p(name, icon, color, note, position_x, position_y, width, height, options)
WHERE NOT EXISTS (
  SELECT 1 FROM directus_panels existing WHERE existing.dashboard = d.id AND existing.name = p.name
);

COMMIT;
