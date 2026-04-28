-- Ik overleef - Contentbatch 2 Drinkwaterzekerheid v1.
-- Adds drinkwaterzekerheid for home, limited evacuation-water masterdata,
-- tiered Basis/Basis+ candidates, quantity policies, constraints, and governance.

BEGIN;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('drinkwater-verstoring-thuis','Drinkwaterverstoring thuis','Drinkwater thuis geregeld','Een huishouden moet bij tijdelijke verstoring van drinkwaterlevering of drinkwaterkwaliteit voldoende drinkwater kunnen opslaan, beschikbaar houden en waar nodig veilig behandelen.',72,'home','elevated','active'),
('evacuatie-water-basis','Evacuatie water basis','Drinkwater onderweg','Bij een mogelijke evacuatie moet een persoon een compacte hoeveelheid drinkwater kunnen meenemen en waar nodig onderweg water kunnen filteren volgens productspecificatie.',24,'evacuation','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('drinkwater','Drinkwater','Voor situaties waarin drinkwater tijdelijk niet beschikbaar of niet betrouwbaar is.','Drinkwater beschikbaar hebben, kunnen opslaan en waar nodig veilig behandelen.','active',30),
('evacuatie','Evacuatie','Voor situaties waarin je snel en georganiseerd weg moet kunnen.','Essentiele zaken compact kunnen meenemen als je tijdelijk weg moet.','draft',40)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('drinkwater','drinkwater-verstoring-thuis','Contentbatch 2: activeert thuis-drinkwaterzekerheid.'),
('evacuatie','evacuatie-water-basis','Beperkte waterlogica ter voorbereiding op latere evacuatiebatch.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug=v.addon_slug
JOIN scenario s ON s.slug=v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('drinkwaterzekerheid','Drinkwaterzekerheid','hydration','De gebruiker moet voldoende drinkwater beschikbaar hebben, kunnen opslaan en waar nodig veilig kunnen behandelen binnen de context van het scenario.','We zorgen dat je niet zelf hoeft te bepalen welke wateropslag, meeneemoplossing of behandeling nodig is.',false,'active'),
('drinkwater-meenemen','Drinkwater meenemen','hydration','De gebruiker moet een compacte hoeveelheid drinkwater kunnen meenemen bij verplaatsing of evacuatie.','We zorgen dat je onderweg drinkwater praktisch kunt meenemen.',false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, 'critical', 5, true, v.customer_reason, v.internal_reason, true, true, 'active'
FROM (VALUES
('drinkwater-verstoring-thuis','drinkwaterzekerheid','Bij verstoring van drinkwater moet je voldoende drinkwater beschikbaar hebben voor het huishouden.','Thuiscontext vereist primaire opslag en/of voorraad plus beperkte behandeling als back-up. Waterfilterfles vervangt thuisopslag niet.'),
('evacuatie-water-basis','drinkwater-meenemen','Als je weg moet, moet je drinkwater compact kunnen meenemen.','Evacuatiecontext vereist draagbare watercapaciteit. Thuisjerrycan is ongeschikt als primaire evacuatieoplossing.')
) AS v(scenario_slug, need_slug, customer_reason, internal_reason)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('drinkwater-opslaan','Drinkwater opslaan','hydration','Drinkwater veilig kunnen opslaan voor later gebruik.','liter','active'),
('drinkwater-voorraad-houden','Drinkwatervoorraad houden','hydration','Een directe drinkbare voorraad beschikbaar hebben.','liter','active'),
('drinkwater-meenemen','Drinkwater meenemen','hydration','Drinkwater compact kunnen meenemen bij verplaatsing.','liter','active'),
('water-filteren','Water filteren','hydration','Water kunnen filteren volgens productspecificatie.','liter/filterklasse','active'),
('water-chemisch-behandelen','Water chemisch behandelen','hydration','Water kunnen behandelen met tabletten of vergelijkbare middelen volgens instructie.','tabletten/liter','active'),
('water-tappen-of-schenken','Water tappen of schenken','hydration','Water praktisch uit opslag kunnen gebruiken zonder veel morsen of vervuiling.','nvt','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('drinkwaterzekerheid','drinkwater-voorraad-houden','must','primary',5,'Er moet directe drinkbare voorraad beschikbaar zijn.'),
('drinkwaterzekerheid','drinkwater-opslaan','must','primary',5,'Opslag is nodig om voldoende water thuis beschikbaar te houden.'),
('drinkwaterzekerheid','water-tappen-of-schenken','should','secondary',3,'Praktisch gebruik van opgeslagen water voorkomt morsen en vervuiling.'),
('drinkwaterzekerheid','water-filteren','should','backup',3,'Filteren is nuttig als backup, maar vervangt thuisopslag niet.'),
('drinkwaterzekerheid','water-chemisch-behandelen','could','backup',2,'Chemische behandeling kan backup zijn, maar vraagt duidelijke instructies.'),
('drinkwater-meenemen','drinkwater-meenemen','must','primary',5,'Bij verplaatsing moet water compact meegenomen kunnen worden.'),
('drinkwater-meenemen','water-filteren','should','secondary',4,'Compact filteren kan onderweg nuttig zijn, maar alleen volgens productspecificatie.'),
('drinkwater-meenemen','water-chemisch-behandelen','could','backup',2,'Tabletten kunnen backup zijn, maar niet als simpele universele oplossing presenteren.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug=v.need_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, v.required_strength::ioe_coverage_strength, true, false, v.minimum_fit, v.notes
FROM (VALUES
('drinkwater-verstoring-thuis','drinkwaterzekerheid','drinkwater-voorraad-houden','primary',80,'Er moet voldoende drinkbare voorraad beschikbaar zijn.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','drinkwater-opslaan','primary',80,'Opslag thuis mag niet worden vervangen door alleen een filterfles.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','water-tappen-of-schenken','secondary',70,'Tappunt of schenkgemak is ondersteunend.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','water-filteren','backup',70,'Filter is backup, geen vervanging voor opslag.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','water-chemisch-behandelen','backup',60,'Alleen met duidelijke instructie en governance.'),
('evacuatie-water-basis','drinkwater-meenemen','drinkwater-meenemen','primary',80,'Draagbare hoeveelheid water is nodig.'),
('evacuatie-water-basis','drinkwater-meenemen','water-filteren','secondary',70,'Filterfles of compact filter kan ondersteunen, maar claim niet overschatten.'),
('evacuatie-water-basis','drinkwater-meenemen','water-chemisch-behandelen','backup',60,'Backupmethode met instructie.')
) AS v(scenario_slug, need_slug, capability_slug, required_strength, minimum_fit, notes)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('water-jerrycan','Waterjerrycan','hydration','Herbruikbare container voor opslag van drinkwater thuis.','durable',NULL,false,'active'),
('drinkwater-voorraadverpakking','Drinkwater voorraadverpakking','hydration','Direct drinkbare verpakte waterhoeveelheid voor voorraad.','expiry_sensitive',24,false,'active'),
('wateropslag-zak','Wateropslagzak','hydration','Opvouwbare of flexibele wateropslag voor noodgebruik thuis.','durable',NULL,false,'active'),
('waterfilter','Waterfilter','hydration','Filteroplossing voor waterbehandeling volgens productspecificatie.','durable',NULL,false,'active'),
('waterzuiveringstabletten','Waterzuiveringstabletten','hydration','Tabletten voor chemische behandeling van water volgens gebruiksinstructie.','expiry_sensitive',36,false,'active'),
('drinkfles','Drinkfles','hydration','Draagbare fles om drinkwater mee te nemen.','durable',NULL,false,'active'),
('waterfilterfles','Waterfilterfles','hydration','Draagbare fles met filterfunctie volgens productspecificatie.','durable',NULL,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('water-jerrycan','drinkwater-opslaan','primary','inherent','Jerrycan biedt thuisopslag.'),
('water-jerrycan','water-tappen-of-schenken','secondary','typical','Schenken of tappen is ondersteunend.'),
('drinkwater-voorraadverpakking','drinkwater-voorraad-houden','primary','inherent','Direct drinkbare voorraad.'),
('wateropslag-zak','drinkwater-opslaan','primary','inherent','Flexibele wateropslag.'),
('wateropslag-zak','water-tappen-of-schenken','secondary','typical','Gebruiksgemak is ondersteunend.'),
('waterfilter','water-filteren','primary','verified_spec','Filtert volgens productspecificatie.'),
('waterzuiveringstabletten','water-chemisch-behandelen','backup','manufacturer_claim','Chemische behandeling volgens instructie.'),
('drinkfles','drinkwater-meenemen','primary','inherent','Draagbare watercapaciteit.'),
('waterfilterfles','drinkwater-meenemen','primary','inherent','Draagbare fles.'),
('waterfilterfles','water-filteren','secondary','manufacturer_claim','Filterfunctie volgens productspecificatie.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, v.module_scope::ioe_location_scope, v.tier_slug, t.id, v.compactness_required, 'active'
FROM (VALUES
('drinkwater-voorraadverpakking','drinkwater-voorraad-thuis-basis','basis','home',false,'Drinkwatervoorraad thuis Basis'),
('drinkwater-voorraadverpakking','drinkwater-voorraad-thuis-basis-plus','basis_plus','home',false,'Drinkwatervoorraad thuis Basis+'),
('water-jerrycan','wateropslag-thuis-basis','basis','home',false,'Waterjerrycan thuis Basis'),
('water-jerrycan','wateropslag-thuis-basis-plus','basis_plus','home',false,'Waterjerrycan thuis Basis+'),
('wateropslag-zak','wateropslag-flex-thuis-basis-plus','basis_plus','home',false,'Flexibele wateropslag thuis Basis+'),
('waterfilter','waterfilter-thuis-backup','basis','home',false,'Waterfilter thuis backup'),
('waterzuiveringstabletten','waterbehandeling-thuis-backup','basis','home',false,'Waterbehandeling thuis backup'),
('drinkfles','drinkfles-evacuatie-basis','basis','evacuation',true,'Drinkfles evacuatie Basis'),
('waterfilterfles','filterfles-evacuatie-basis-plus','basis_plus','evacuation',true,'Waterfilterfles evacuatie Basis+'),
('waterzuiveringstabletten','waterbehandeling-evacuatie-backup','basis','evacuation',true,'Waterbehandeling evacuatie backup')
) AS v(product_type_slug, slug, tier_slug, module_scope, compactness_required, name)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, false, 'active'
FROM (VALUES
('drinkwater-voorraadverpakking','AquaSafe','6L Basic','AquaSafe drinkwaterpak 6 liter','IOE-WATER-PACK-6L-BASIC',76,78,78),
('drinkwater-voorraadverpakking','AquaSafe','6L Premium','AquaSafe premium drinkwaterpak 6 liter','IOE-WATER-PACK-6L-PLUS',88,88,88),
('water-jerrycan','AquaStore','10L Basic','AquaStore waterjerrycan 10 liter','IOE-JERRYCAN-10L-BASIC',76,78,78),
('water-jerrycan','AquaStore','20L Plus Tap','AquaStore robuuste waterjerrycan 20 liter met kraan','IOE-JERRYCAN-20L-PLUS',90,90,90),
('wateropslag-zak','AquaFlex','10L Flex','AquaFlex wateropslagzak 10 liter','IOE-WATERBAG-10L-FLEX',78,76,74),
('waterfilter','ClearFlow','Compact','ClearFlow compact waterfilter','IOE-WATERFILTER-BASIC',76,76,74),
('waterfilter','ClearFlow','Pro','ClearFlow Pro waterfilter','IOE-WATERFILTER-PLUS',88,88,86),
('waterzuiveringstabletten','AquaTab','Basic','AquaTab waterzuiveringstabletten basis','IOE-WATER-TABS-BASIC',74,76,70),
('waterzuiveringstabletten','AquaTab','Plus','AquaTab waterzuiveringstabletten plus','IOE-WATER-TABS-PLUS',84,86,80),
('drinkfles','CarrySafe','1L Basic','CarrySafe drinkfles 1 liter','IOE-BOTTLE-1L-BASIC',76,78,80),
('drinkfles','CarrySafe','1L Plus','CarrySafe robuuste drinkfles 1 liter','IOE-BOTTLE-1L-PLUS',88,88,90),
('waterfilterfles','CarrySafe','Filter 1L','CarrySafe filterfles 1 liter','IOE-FILTERBOTTLE-PLUS',86,86,86)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score)
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit, v.notes
FROM (VALUES
('IOE-WATER-PACK-6L-BASIC','drinkwater-voorraad-houden','primary','verified_spec',true,78,'Direct drinkbare voorraad, 6 liter per pack.'),
('IOE-WATER-PACK-6L-PLUS','drinkwater-voorraad-houden','primary','verified_spec',true,88,'Robuustere drinkwatervoorraad, 6 liter per pack.'),
('IOE-JERRYCAN-10L-BASIC','drinkwater-opslaan','primary','verified_spec',true,78,'Basis opslagcapaciteit thuis, 10 liter.'),
('IOE-JERRYCAN-10L-BASIC','water-tappen-of-schenken','secondary','verified_spec',false,70,'Schenken is ondersteunend.'),
('IOE-JERRYCAN-20L-PLUS','drinkwater-opslaan','primary','verified_spec',true,90,'Robuuste opslagcapaciteit thuis, 20 liter.'),
('IOE-JERRYCAN-20L-PLUS','water-tappen-of-schenken','secondary','verified_spec',false,88,'Kraan/taphandling ondersteunt schoon gebruik.'),
('IOE-WATERBAG-10L-FLEX','drinkwater-opslaan','secondary','verified_spec',false,74,'Flexibele backupopslag, niet default primary thuisopslag.'),
('IOE-WATERBAG-10L-FLEX','water-tappen-of-schenken','backup','verified_spec',false,60,'Beperkt schenkgemak.'),
('IOE-WATERFILTER-BASIC','water-filteren','primary','verified_spec',false,74,'Backupfilter volgens productspecificatie; geen opslag.'),
('IOE-WATERFILTER-PLUS','water-filteren','primary','verified_spec',false,86,'Betere backupfilter volgens productspecificatie; geen opslag.'),
('IOE-WATER-TABS-BASIC','water-chemisch-behandelen','backup','manufacturer_claim',false,70,'Backupmethode volgens instructie.'),
('IOE-WATER-TABS-PLUS','water-chemisch-behandelen','backup','manufacturer_claim',false,80,'Backupmethode met betere verpakking/instructie.'),
('IOE-BOTTLE-1L-BASIC','drinkwater-meenemen','primary','verified_spec',true,80,'Draagbare watercapaciteit, 1 liter.'),
('IOE-BOTTLE-1L-PLUS','drinkwater-meenemen','primary','verified_spec',true,90,'Robuuste draagbare watercapaciteit, 1 liter.'),
('IOE-FILTERBOTTLE-PLUS','drinkwater-meenemen','primary','verified_spec',true,86,'Draagbare filterfles, 1 liter.'),
('IOE-FILTERBOTTLE-PLUS','water-filteren','secondary','manufacturer_claim',false,75,'Filterfunctie alleen volgens productspecificatie.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit, notes)
JOIN item i ON i.sku=v.sku
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, v.role::ioe_product_role, v.priority::ioe_priority, v.quantity_base, v.quantity_per_adult, v.quantity_per_child, v.min_quantity, v.max_quantity, false, v.explanation, 'active'
FROM (VALUES
('drinkwater-verstoring-thuis','drinkwaterzekerheid','drinkwater-voorraadverpakking','primary','must',0,NULL,NULL,1,NULL,'Direct drinkbare voorraad voor 72 uur.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','water-jerrycan','primary','must',1,NULL,NULL,1,1,'Opslagcapaciteit om water thuis veilig beschikbaar te houden.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','waterfilter','backup','should',1,NULL,NULL,1,1,'Backup voor behandelen/filteren volgens productspecificatie.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','waterzuiveringstabletten','backup','could',1,NULL,NULL,1,1,'Backupmethode met duidelijke instructie, niet als universele oplossing.'),
('evacuatie-water-basis','drinkwater-meenemen','drinkfles','primary','must',0,1,1,1,NULL,'Draagbare watercapaciteit per persoon.'),
('evacuatie-water-basis','drinkwater-meenemen','waterfilterfles','backup','should',0,1,1,1,NULL,'Compacte fles met filterfunctie als betere meeneemoplossing.'),
('evacuatie-water-basis','drinkwater-meenemen','waterzuiveringstabletten','backup','could',1,NULL,NULL,1,1,'Backupbehandeling onderweg volgens instructie.')
) AS v(scenario_slug, need_slug, product_type_slug, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, explanation)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, quantity_per_child=EXCLUDED.quantity_per_child, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, v.formula_type::ioe_quantity_formula_type, v.unit, v.base_amount, v.adult_factor, v.child_factor, v.duration_day_factor, v.pack_size, v.min_quantity, v.max_quantity, v.rounding_rule::ioe_rounding_rule, v.rationale, 'active'
FROM (VALUES
('drinkwater-verstoring-thuis','drinkwaterzekerheid','drinkwater-voorraadverpakking','primary','per_person_per_day','packs',0,3,2,1,6,1,NULL,'pack_size','3 liter per volwassene per dag, 2 liter per kind per dag, afgerond naar 6L packs.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','water-jerrycan','primary','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een thuisjerrycan als primaire opslagcapaciteit.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','waterfilter','backup','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een backupfilter volgens productspecificatie.'),
('drinkwater-verstoring-thuis','drinkwaterzekerheid','waterzuiveringstabletten','backup','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een backup-pack tabletten volgens instructie.'),
('evacuatie-water-basis','drinkwater-meenemen','drinkfles','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Minimaal 1L draagcapaciteit per persoon.'),
('evacuatie-water-basis','drinkwater-meenemen','waterfilterfles','backup','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Filterfles per persoon wanneer deze evacuatie-waterregel actief wordt gekozen.'),
('evacuatie-water-basis','drinkwater-meenemen','waterzuiveringstabletten','backup','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een backup-pack tabletten voor onderweg.')
) AS v(scenario_slug, need_slug, product_type_slug, role, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN scenario_need_product_rule snpr ON snpr.scenario_need_id=sn.id AND snpr.product_type_id=pt.id AND snpr.role=v.role::ioe_product_role
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.scenario_need_product_rule_id=snpr.id AND qp.status='active');

INSERT INTO variant_item_candidate (product_variant_id, item_id, tier_id, fit_score, is_default_candidate, selection_notes, status)
SELECT pv.id, i.id, t.id, v.fit_score, v.is_default, v.notes, 'active'
FROM (VALUES
('drinkwater-voorraadverpakking','drinkwater-voorraad-thuis-basis','IOE-WATER-PACK-6L-BASIC','basis',78,true,'Basis default drinkwatervoorraad.'),
('water-jerrycan','wateropslag-thuis-basis','IOE-JERRYCAN-10L-BASIC','basis',78,true,'Basis default wateropslag.'),
('waterfilter','waterfilter-thuis-backup','IOE-WATERFILTER-BASIC','basis',74,true,'Basis backupfilter.'),
('waterzuiveringstabletten','waterbehandeling-thuis-backup','IOE-WATER-TABS-BASIC','basis',70,true,'Basis backuptabletten.'),
('drinkwater-voorraadverpakking','drinkwater-voorraad-thuis-basis-plus','IOE-WATER-PACK-6L-PLUS','basis_plus',88,true,'Basis+ default drinkwatervoorraad.'),
('water-jerrycan','wateropslag-thuis-basis-plus','IOE-JERRYCAN-20L-PLUS','basis_plus',90,true,'Basis+ default wateropslag.'),
('wateropslag-zak','wateropslag-flex-thuis-basis-plus','IOE-WATERBAG-10L-FLEX','basis_plus',74,false,'Non-default flexibele backupopslag.'),
('waterfilter','waterfilter-thuis-backup','IOE-WATERFILTER-PLUS','basis_plus',86,true,'Basis+ backupfilter.'),
('waterzuiveringstabletten','waterbehandeling-thuis-backup','IOE-WATER-TABS-PLUS','basis_plus',80,true,'Basis+ backuptabletten.'),
('drinkfles','drinkfles-evacuatie-basis','IOE-BOTTLE-1L-BASIC','basis',80,true,'Basis drinkfles evacuatie-water.'),
('drinkfles','drinkfles-evacuatie-basis','IOE-BOTTLE-1L-PLUS','basis_plus',90,true,'Basis+ drinkfles evacuatie-water.'),
('waterfilterfles','filterfles-evacuatie-basis-plus','IOE-FILTERBOTTLE-PLUS','basis_plus',86,true,'Basis+ filterfles evacuatie-water.'),
('waterzuiveringstabletten','waterbehandeling-evacuatie-backup','IOE-WATER-TABS-BASIC','basis',70,true,'Basis backuptabletten evacuatie-water.'),
('waterzuiveringstabletten','waterbehandeling-evacuatie-backup','IOE-WATER-TABS-PLUS','basis_plus',80,true,'Basis+ backuptabletten evacuatie-water.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, is_default, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN product_variant pv ON pv.product_type_id=pt.id AND pv.slug=v.variant_slug
JOIN item i ON i.sku=v.sku
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, 70, v.is_preferred, now(), 'active'
FROM (VALUES
('IOE-WATER-PACK-6L-BASIC','SUP-WATER-PACK-6L-BASIC',5.95,true),
('IOE-WATER-PACK-6L-PLUS','SUP-WATER-PACK-6L-PLUS',8.95,true),
('IOE-JERRYCAN-10L-BASIC','SUP-JERRYCAN-10L-BASIC',12.95,true),
('IOE-JERRYCAN-20L-PLUS','SUP-JERRYCAN-20L-PLUS',24.95,true),
('IOE-WATERBAG-10L-FLEX','SUP-WATERBAG-10L-FLEX',14.95,false),
('IOE-WATERFILTER-BASIC','SUP-WATERFILTER-BASIC',19.95,true),
('IOE-WATERFILTER-PLUS','SUP-WATERFILTER-PLUS',39.95,true),
('IOE-WATER-TABS-BASIC','SUP-WATER-TABS-BASIC',7.95,true),
('IOE-WATER-TABS-PLUS','SUP-WATER-TABS-PLUS',12.95,true),
('IOE-BOTTLE-1L-BASIC','SUP-BOTTLE-1L-BASIC',6.95,true),
('IOE-BOTTLE-1L-PLUS','SUP-BOTTLE-1L-PLUS',14.95,true),
('IOE-FILTERBOTTLE-PLUS','SUP-FILTERBOTTLE-PLUS',34.95,true)
) AS v(sku, supplier_sku, price_current, is_preferred)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO item_usage_constraint (item_id, constraint_type, severity, public_warning, internal_notes, blocks_recommendation, requires_customer_acknowledgement, status)
SELECT i.id, v.constraint_type::ioe_usage_constraint_type, v.severity::ioe_constraint_severity, v.public_warning, v.internal_notes, false, false, 'active'
FROM (VALUES
('IOE-WATER-TABS-BASIC','dosage_warning','warning','Gebruik alleen volgens de instructies op de verpakking.','Dosering en contacttijd zijn cruciaal.'),
('IOE-WATER-TABS-BASIC','child_safety','advisory','Buiten bereik van kinderen bewaren.','Chemische behandeling veilig opslaan.'),
('IOE-WATER-TABS-BASIC','storage_safety','advisory','Droog en volgens verpakking bewaren.','Houdbaarheid en werking afhankelijk van opslag.'),
('IOE-WATER-TABS-PLUS','dosage_warning','warning','Gebruik alleen volgens de instructies op de verpakking.','Dosering en contacttijd zijn cruciaal.'),
('IOE-WATER-TABS-PLUS','child_safety','advisory','Buiten bereik van kinderen bewaren.','Chemische behandeling veilig opslaan.'),
('IOE-WATER-TABS-PLUS','storage_safety','advisory','Droog en volgens verpakking bewaren.','Houdbaarheid en werking afhankelijk van opslag.'),
('IOE-WATERFILTER-BASIC','medical_claim_limit','warning','Gebruik volgens productspecificatie; niet elk water is automatisch veilig.','Geen universele veiligheidsclaim.'),
('IOE-WATERFILTER-PLUS','medical_claim_limit','warning','Gebruik volgens productspecificatie; niet elk water is automatisch veilig.','Geen universele veiligheidsclaim.'),
('IOE-FILTERBOTTLE-PLUS','medical_claim_limit','warning','Gebruik volgens productspecificatie; niet elk water is automatisch veilig.','Geen universele veiligheidsclaim.'),
('IOE-JERRYCAN-10L-BASIC','hygiene_contamination_risk','advisory','Houd opslag schoon en voorkom vervuiling.','Opslagkwaliteit afhankelijk van gebruik.'),
('IOE-JERRYCAN-20L-PLUS','hygiene_contamination_risk','advisory','Houd opslag schoon en voorkom vervuiling.','Opslagkwaliteit afhankelijk van gebruik.'),
('IOE-WATERBAG-10L-FLEX','hygiene_contamination_risk','advisory','Houd opslag schoon en voorkom vervuiling.','Opslagkwaliteit afhankelijk van gebruik.')
) AS v(sku, constraint_type, severity, public_warning, internal_notes)
JOIN item i ON i.sku=v.sku
WHERE NOT EXISTS (
  SELECT 1 FROM item_usage_constraint iuc
  WHERE iuc.item_id=i.id AND iuc.constraint_type=v.constraint_type::ioe_usage_constraint_type AND iuc.status='active'
);

INSERT INTO item_physical_spec (item_id, weight_grams, volume_liters, packability_score, carry_method, access_priority, water_resistance_score, notes)
SELECT i.id, v.weight_grams, v.volume_liters, v.packability_score, v.carry_method::ioe_carry_method, 'quick', v.water_resistance_score, v.notes
FROM (VALUES
('IOE-BOTTLE-1L-BASIC',150,1.0,82,'backpack',70,'1L drinkfles voor evacuatie-water test.'),
('IOE-BOTTLE-1L-PLUS',180,1.0,88,'backpack',80,'Robuuste 1L drinkfles voor evacuatie-water test.'),
('IOE-FILTERBOTTLE-PLUS',220,1.0,84,'backpack',80,'1L filterfles; filterclaim blijft productspecificatie.'),
('IOE-WATER-TABS-BASIC',60,0.1,95,'pouch',60,'Compacte backuptabletten.'),
('IOE-WATER-TABS-PLUS',70,0.1,95,'pouch',70,'Compacte backuptabletten plus.')
) AS v(sku, weight_grams, volume_liters, packability_score, carry_method, water_resistance_score, notes)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id) DO UPDATE SET weight_grams=EXCLUDED.weight_grams, volume_liters=EXCLUDED.volume_liters, packability_score=EXCLUDED.packability_score, carry_method=EXCLUDED.carry_method, access_priority=EXCLUDED.access_priority, water_resistance_score=EXCLUDED.water_resistance_score, notes=EXCLUDED.notes;

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type', v.prohibited_claim, v.allowed_framing, v.internal_rationale, v.severity::ioe_constraint_severity, 'active'
FROM (VALUES
('waterfilter','Dit filter maakt elk water veilig drinkbaar.','Dit filter ondersteunt waterbehandeling volgens productspecificatie. Het vervangt geen voldoende drinkwatervoorraad en moet worden gebruikt volgens de instructies.','Geen universele filterveiligheidsclaim.', 'warning'),
('waterfilterfles','Dit filter maakt elk water veilig drinkbaar.','Dit filter ondersteunt waterbehandeling volgens productspecificatie. Het vervangt geen voldoende drinkwatervoorraad en moet worden gebruikt volgens de instructies.','Geen universele filterveiligheidsclaim.', 'warning'),
('waterzuiveringstabletten','Deze tabletten maken elk water veilig.','Deze tabletten zijn een backupmethode voor waterbehandeling volgens gebruiksinstructie. Dosering, wachttijd en waterkwaliteit blijven belangrijk.','Geen universele chemische veiligheidsclaim.', 'warning'),
('water-jerrycan','Water blijft onbeperkt goed in deze opslag.','Gebruik wateropslag schoon en volgens instructie. Controleer en ververs opgeslagen water wanneer nodig.','Opslag vraagt hygiene en beheer.', 'advisory'),
('wateropslag-zak','Water blijft onbeperkt goed in deze opslag.','Gebruik wateropslag schoon en volgens instructie. Controleer en ververs opgeslagen water wanneer nodig.','Opslag vraagt hygiene en beheer.', 'advisory')
) AS v(product_type_slug, prohibited_claim, allowed_framing, internal_rationale, severity)
JOIN product_type pt ON pt.slug=v.product_type_slug
WHERE NOT EXISTS (
  SELECT 1 FROM claim_governance_rule cgr
  WHERE cgr.rule_scope='product_type' AND cgr.product_type_id=pt.id AND cgr.prohibited_claim=v.prohibited_claim
);

COMMIT;
