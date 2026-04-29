-- Ik overleef - Contentbatch 6 Warmte, droog blijven & shelter-light v1.
-- Adds addon=warmte_droog_shelter_light with thermal blanket, emergency blanket,
-- rain poncho, tarp-light, paracord/tarp-pegs accessories and Basis+ groundsheet.
-- Uses only existing schema, enum values, source types and quantity policies.
-- Emergency blanket is backup/secondary, never primary sleep comfort.
-- Poncho is personal rain protection, not shelter.
-- Tarp-light is shelter-light, not a heat source and not a full shelter.

BEGIN;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('warmte_droog_shelter_light','Warmte, droog blijven en shelter-light','Voor situaties waarin je thuis warmte wilt behouden, droog wilt blijven bij regen en lichte tijdelijke beschutting nodig hebt.','Praktische warmte, regenbescherming en shelter-light met duidelijke begrenzing rond slaapcomfort, hypothermie en volledige shelter.','active',60)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('warmtebehoud-thuis-72u','Warmtebehoud thuis 72 uur','Warmtebehoud thuis 72 uur','Een huishouden moet bij kou of verwarmingsuitval basale lichaamswarmte kunnen behouden zonder medische hypothermiebehandeling te claimen.',72,'home','elevated','active'),
('droog-blijven-thuis-72u','Droog blijven thuis 72 uur','Droog blijven thuis 72 uur','Personen kunnen zichzelf bij regen of natte omstandigheden eenvoudig droog houden met persoonlijke regenbescherming, zonder dit als shelter te claimen.',72,'home','elevated','active'),
('beschutting-light-thuis-72u','Shelter-light thuis 72 uur','Lichte beschutting thuis 72 uur','Een huishouden kan tijdelijke lichte afscherming maken met tarp en bevestiging, zonder een volledige tent, slaapoplossing of evacuatieshelter te claimen.',72,'home','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('warmte_droog_shelter_light','warmtebehoud-thuis-72u','Contentbatch 6: activeert warmtebehoud thuis.'),
('warmte_droog_shelter_light','droog-blijven-thuis-72u','Contentbatch 6: activeert persoonlijke regenbescherming.'),
('warmte_droog_shelter_light','beschutting-light-thuis-72u','Contentbatch 6: activeert shelter-light en tarp-bevestiging.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug=v.addon_slug
JOIN scenario s ON s.slug=v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('warmte-behouden','Warmte behouden','warmth','Een huishouden moet basale lichaamswarmte kunnen behouden bij kou of verwarmingsuitval.','We voegen een warmtedeken toe om lichaamswarmte beter vast te houden, zonder medische behandeling te claimen.',false,'active'),
('noodwarmte-backup','Noodwarmte backup','warmth','Een huishouden heeft een compacte backupoplossing om warmteverlies te beperken als de hoofdoplossing tekortschiet.','We voegen een nooddeken toe als backup; dit is geen slaapcomfort en geen behandeling van onderkoeling.',false,'active'),
('persoonlijk-droog-blijven','Persoonlijk droog blijven','dry','Personen moeten zichzelf droog kunnen houden bij regen of natte omstandigheden.','We voegen een poncho toe als persoonlijke regenbescherming; dit is geen volwaardige beschutting.',false,'active'),
('lichte-beschutting','Lichte beschutting','shelter_light','Een huishouden moet lichte tijdelijke afscherming kunnen maken zonder volledige shelter te claimen.','We voegen een tarp-light toe voor tijdelijke afscherming; dit is geen tent of evacuatieshelter.',false,'active'),
('beschutting-bevestigen','Beschutting bevestigen','shelter_light','Een tarp-light moet praktisch kunnen worden bevestigd met koord en haringen.','We voegen koord en haringen toe als bevestiging bij de tarp; deze zijn geen beschutting op zichzelf.',false,'active'),
('grondvocht-barriere','Grondvocht barriere','shelter_light','Een huishouden heeft een ondersteunende vochtbarrière tegen natte ondergrond.','We voegen een grondzeil toe als ondersteunende vochtbarrière; dit is geen slaapmat of onderkomen.',false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, v.urgency::ioe_urgency, v.relevance_score, true, v.customer_reason, v.internal_reason, false, true, 'active'
FROM (VALUES
('warmtebehoud-thuis-72u','warmte-behouden','essential',5,'Bij kou of verwarmingsuitval moet je warm kunnen blijven.','Warmth retention baseline; no medical hypothermia treatment claim.'),
('warmtebehoud-thuis-72u','noodwarmte-backup','supporting',3,'Een nooddeken kan helpen warmteverlies te beperken als backup.','Emergency blanket is backup/supporting only; not sleep comfort.'),
('droog-blijven-thuis-72u','persoonlijk-droog-blijven','essential',5,'Bij regen wil je jezelf droog kunnen houden.','Personal rain protection; not shelter.'),
('beschutting-light-thuis-72u','lichte-beschutting','supporting',4,'Een tarp kan praktisch zijn voor lichte tijdelijke afscherming.','Shelter-light only; not full shelter or tent.'),
('beschutting-light-thuis-72u','beschutting-bevestigen','supporting',3,'Koord en haringen zijn nodig om de tarp goed te bevestigen.','Anchoring required when tarp is used.'),
('beschutting-light-thuis-72u','grondvocht-barriere','supporting',2,'Een grondzeil kan extra bescherming bieden tegen vocht van onderaf.','Supporting moisture barrier; not sleep mat.')
) AS v(scenario_slug, need_slug, urgency, relevance_score, customer_reason, internal_reason)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('warmtedeken-gebruiken','Warmtedeken gebruiken','warmth','Een warmtedeken inzetten om lichaamswarmte vast te houden bij kou of verwarmingsuitval.','stuks','active'),
('nooddeken-reflecterend','Nooddeken reflecterend','warmth','Een reflecterende nooddeken/noodfolie of compacte noodbivvy gebruiken als backup voor warmteverlies; geen slaapcomfort.','stuks','active'),
('regenponcho-gebruiken','Regenponcho gebruiken','dry','Een poncho gebruiken om jezelf droog te houden bij regen; geen shelter.','stuks','active'),
('tarp-light-beschutting','Tarp-light beschutting','shelter_light','Een lichte tarp opzetten als tijdelijke afscherming; geen volledige tent of slaapshelter.','stuks','active'),
('beschutting-bevestigen','Beschutting bevestigen','shelter_light','Tarp-light praktisch bevestigen met koord en haringen.','set','active'),
('grondvocht-afschermen','Grondvocht afschermen','shelter_light','Een grondzeil als ondersteunende vochtbarrière inzetten; geen slaapmat.','stuks','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('warmte-behouden','warmtedeken-gebruiken','must','primary',5,'Warmtedeken dekt warmtebehoud, geen medische behandeling.'),
('noodwarmte-backup','nooddeken-reflecterend','should','backup',3,'Nooddeken is backup/secondary, niet slaapcomfort.'),
('persoonlijk-droog-blijven','regenponcho-gebruiken','must','primary',5,'Poncho dekt persoonlijke regenbescherming.'),
('lichte-beschutting','tarp-light-beschutting','must','primary',4,'Tarp-light dekt shelter-light, geen volledige shelter.'),
('beschutting-bevestigen','beschutting-bevestigen','must','secondary',3,'Koord en haringen zijn accessoires bij tarp.'),
('grondvocht-barriere','grondvocht-afschermen','should','secondary',2,'Grondzeil is supporting vochtbarrière.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug=v.need_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, v.required_strength::ioe_coverage_strength, true, false, v.minimum_fit, v.notes
FROM (VALUES
('warmtebehoud-thuis-72u','warmte-behouden','warmtedeken-gebruiken','primary',70,'No medical hypothermia treatment claim.'),
('warmtebehoud-thuis-72u','noodwarmte-backup','nooddeken-reflecterend','backup',60,'Emergency blanket counts as backup, not primary warmth or sleep comfort.'),
('droog-blijven-thuis-72u','persoonlijk-droog-blijven','regenponcho-gebruiken','primary',70,'Personal rain protection only; not shelter.'),
('beschutting-light-thuis-72u','lichte-beschutting','tarp-light-beschutting','primary',65,'Shelter-light only; no full shelter or tent claim.'),
('beschutting-light-thuis-72u','beschutting-bevestigen','beschutting-bevestigen','secondary',60,'Anchoring is accessory/supporting.'),
('beschutting-light-thuis-72u','grondvocht-barriere','grondvocht-afschermen','secondary',55,'Supporting moisture barrier; not sleep mat.')
) AS v(scenario_slug, need_slug, capability_slug, required_strength, minimum_fit, notes)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('warmtedeken','Warmtedeken','warmth','Warme deken/fleecedeken voor warmtebehoud thuis; geen medische behandeling.','durable',NULL,false,'active'),
('nooddeken','Nooddeken','warmth','Reflecterende nooddeken of compacte noodbivvy als backup voor warmteverlies; geen slaapcomfort.','durable',60,false,'active'),
('regenponcho','Regenponcho','dry','Poncho voor persoonlijke regenbescherming; geen shelter.','durable',60,false,'active'),
('tarp-light','Tarp-light','shelter_light','Lichte tarp voor tijdelijke afscherming; geen tent of evacuatieshelter.','durable',NULL,false,'active'),
('paracord','Paracord','shelter_light','Koord/paracord voor tarp-bevestiging; geen beschutting op zichzelf.','durable',NULL,false,'active'),
('tarp-haringen','Tarp haringen','shelter_light','Haringen voor tarp-verankering; geen beschutting op zichzelf.','durable',NULL,false,'active'),
('grondzeil','Grondzeil','shelter_light','Grondzeil als ondersteunende vochtbarrière; geen slaapmat.','durable',NULL,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('warmtedeken','warmtedeken-gebruiken','primary','verified_spec','Warmtebehoud, geen medische behandeling.'),
('nooddeken','nooddeken-reflecterend','backup','verified_spec','Backup/secondary, geen slaapcomfort.'),
('regenponcho','regenponcho-gebruiken','primary','verified_spec','Persoonlijke regenbescherming, geen shelter.'),
('tarp-light','tarp-light-beschutting','primary','verified_spec','Shelter-light only, geen full shelter.'),
('paracord','beschutting-bevestigen','secondary','verified_spec','Bevestiging, geen shelter op zichzelf.'),
('tarp-haringen','beschutting-bevestigen','secondary','verified_spec','Verankering, geen shelter op zichzelf.'),
('grondzeil','grondvocht-afschermen','secondary','verified_spec','Supporting moisture barrier, geen slaapmat.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, 'home', v.tier_slug, t.id, false, 'active'
FROM (VALUES
('warmtedeken','warmtedeken-basis','basis','Warmtedeken Basis'),
('warmtedeken','warmtedeken-basis-plus','basis_plus','Warmtedeken Basis+'),
('nooddeken','nooddeken-basis','basis','Nooddeken Basis'),
('nooddeken','nooddeken-basis-plus','basis_plus','Noodbivvy Basis+'),
('regenponcho','regenponcho-basis','basis','Regenponcho Basis'),
('regenponcho','regenponcho-basis-plus','basis_plus','Regenponcho Basis+'),
('tarp-light','tarp-light-basis','basis','Tarp-light Basis'),
('tarp-light','tarp-light-basis-plus','basis_plus','Tarp-light Basis+'),
('paracord','paracord-basis','basis','Paracord Basis'),
('paracord','paracord-basis-plus','basis_plus','Paracord Basis+'),
('tarp-haringen','tarp-haringen-basis','basis','Tarp haringen Basis'),
('tarp-haringen','tarp-haringen-basis-plus','basis_plus','Tarp haringen Basis+'),
('grondzeil','grondzeil-basis-plus','basis_plus','Grondzeil Basis+')
) AS v(product_type_slug, slug, tier_slug, name)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, v.is_accessory_only, 'active'
FROM (VALUES
('warmtedeken','ShelterCo','Basic Fleece','ShelterCo warmtedeken Basis','IOE-THERMAL-BLANKET-BASIC',76,78,78,false),
('warmtedeken','ShelterCo','Plus Fleece','ShelterCo warmtedeken Basis+','IOE-THERMAL-BLANKET-PLUS',88,88,88,false),
('nooddeken','ShelterCo','Foil','ShelterCo nooddeken Basis','IOE-EMERGENCY-BLANKET-BASIC',70,72,70,false),
('nooddeken','ShelterCo','Bivvy Plus','ShelterCo noodbivvy Basis+','IOE-EMERGENCY-BIVVY-PLUS',84,86,84,false),
('regenponcho','ShelterCo','Basic Poncho','ShelterCo regenponcho Basis','IOE-PONCHO-BASIC',74,76,76,false),
('regenponcho','ShelterCo','Plus Poncho','ShelterCo regenponcho Basis+','IOE-PONCHO-PLUS',86,88,86,false),
('tarp-light','ShelterCo','Tarp Light Basic','ShelterCo tarp-light Basis','IOE-TARP-LIGHT-BASIC',74,76,76,false),
('tarp-light','ShelterCo','Tarp Light Plus','ShelterCo tarp-light Basis+','IOE-TARP-LIGHT-PLUS',86,88,86,false),
('paracord','ShelterCo','Cord Basic','ShelterCo paracord Basis','IOE-PARACORD-BASIC',74,76,74,true),
('paracord','ShelterCo','Cord Plus','ShelterCo paracord Basis+','IOE-PARACORD-PLUS',84,86,84,true),
('tarp-haringen','ShelterCo','Pegs Basic','ShelterCo tarp haringen Basis','IOE-TARP-PEGS-BASIC',74,76,74,true),
('tarp-haringen','ShelterCo','Pegs Plus','ShelterCo tarp haringen Basis+','IOE-TARP-PEGS-PLUS',84,86,84,true),
('grondzeil','ShelterCo','Groundsheet Plus','ShelterCo grondzeil Basis+','IOE-GROUNDSHEET-PLUS',82,84,82,false)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only)
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit, v.notes
FROM (VALUES
('IOE-THERMAL-BLANKET-BASIC','warmtedeken-gebruiken','primary','verified_spec',true,78,'Basis warmtedeken voor warmtebehoud; geen medische behandeling.'),
('IOE-THERMAL-BLANKET-PLUS','warmtedeken-gebruiken','primary','verified_spec',true,88,'Robuustere warmtedeken voor warmtebehoud; geen medische behandeling.'),
('IOE-EMERGENCY-BLANKET-BASIC','nooddeken-reflecterend','backup','verified_spec',false,70,'Reflecterende nooddeken als backup voor warmteverlies; geen slaapcomfort.'),
('IOE-EMERGENCY-BIVVY-PLUS','nooddeken-reflecterend','backup','verified_spec',false,84,'Robuustere noodbivvy als backup voor warmteverlies; geen slaapcomfort.'),
('IOE-PONCHO-BASIC','regenponcho-gebruiken','primary','verified_spec',true,76,'Basis poncho voor persoonlijke regenbescherming; geen shelter.'),
('IOE-PONCHO-PLUS','regenponcho-gebruiken','primary','verified_spec',true,86,'Stevigere poncho voor persoonlijke regenbescherming; geen shelter.'),
('IOE-TARP-LIGHT-BASIC','tarp-light-beschutting','primary','verified_spec',true,76,'Basis tarp-light voor tijdelijke afscherming; geen tent of full shelter.'),
('IOE-TARP-LIGHT-PLUS','tarp-light-beschutting','primary','verified_spec',true,86,'Robuustere tarp-light voor tijdelijke afscherming; geen tent of full shelter.'),
('IOE-PARACORD-BASIC','beschutting-bevestigen','secondary','verified_spec',false,74,'Basis paracord voor tarp-bevestiging; geen beschutting op zichzelf.'),
('IOE-PARACORD-PLUS','beschutting-bevestigen','secondary','verified_spec',false,84,'Betere paracord voor tarp-bevestiging; geen beschutting op zichzelf.'),
('IOE-TARP-PEGS-BASIC','beschutting-bevestigen','secondary','verified_spec',false,74,'Basis haringen voor tarp-verankering; geen beschutting op zichzelf.'),
('IOE-TARP-PEGS-PLUS','beschutting-bevestigen','secondary','verified_spec',false,84,'Betere haringen voor tarp-verankering; geen beschutting op zichzelf.'),
('IOE-GROUNDSHEET-PLUS','grondvocht-afschermen','secondary','verified_spec',false,82,'Grondzeil als supporting vochtbarrière; geen slaapmat.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit, notes)
JOIN item i ON i.sku=v.sku
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, v.role::ioe_product_role, v.priority::ioe_priority, v.quantity_base::numeric, v.quantity_per_adult::numeric, v.quantity_per_child::numeric, v.min_quantity::integer, v.max_quantity::integer, false, v.explanation, 'active'
FROM (VALUES
('warmtebehoud-thuis-72u','warmte-behouden','warmtedeken','primary','must',0,1,1,1,NULL,'Warmtedeken per persoon voor warmtebehoud; geen medische behandeling.'),
('warmtebehoud-thuis-72u','noodwarmte-backup','nooddeken','backup','should',0,1,1,1,NULL,'Nooddeken per persoon als backup voor warmteverlies; geen slaapcomfort.'),
('droog-blijven-thuis-72u','persoonlijk-droog-blijven','regenponcho','primary','must',0,1,1,1,NULL,'Poncho per persoon voor persoonlijke regenbescherming; geen shelter.'),
('beschutting-light-thuis-72u','lichte-beschutting','tarp-light','primary','must',1,NULL,NULL,1,1,'Een tarp-light per huishouden voor tijdelijke afscherming; geen full shelter.'),
('beschutting-light-thuis-72u','beschutting-bevestigen','paracord','accessory','must',1,NULL,NULL,1,1,'Paracord voor tarp-bevestiging; geen shelter op zichzelf.'),
('beschutting-light-thuis-72u','beschutting-bevestigen','tarp-haringen','accessory','must',1,NULL,NULL,1,1,'Haringen voor tarp-verankering; geen shelter op zichzelf.'),
('beschutting-light-thuis-72u','grondvocht-barriere','grondzeil','backup','should',1,NULL,NULL,1,1,'Grondzeil als supporting vochtbarrière; alleen Basis+ heeft variant.')
) AS v(scenario_slug, need_slug, product_type_slug, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, explanation)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, quantity_per_child=EXCLUDED.quantity_per_child, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, v.formula_type::ioe_quantity_formula_type, v.unit, v.base_amount::numeric, v.adult_factor::numeric, v.child_factor::numeric, v.duration_day_factor::numeric, v.pack_size::integer, v.min_quantity::integer, v.max_quantity::integer, v.rounding_rule::ioe_rounding_rule, v.rationale, 'active'
FROM (VALUES
('warmtebehoud-thuis-72u','warmte-behouden','warmtedeken','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een warmtedeken per persoon, basis POC.'),
('warmtebehoud-thuis-72u','noodwarmte-backup','nooddeken','backup','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een nooddeken per persoon als backup voor warmteverlies.'),
('droog-blijven-thuis-72u','persoonlijk-droog-blijven','regenponcho','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een poncho per persoon voor persoonlijk droog blijven.'),
('beschutting-light-thuis-72u','lichte-beschutting','tarp-light','primary','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een tarp-light per huishouden voor shelter-light.'),
('beschutting-light-thuis-72u','beschutting-bevestigen','paracord','accessory','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een paracord voor tarp-bevestiging.'),
('beschutting-light-thuis-72u','beschutting-bevestigen','tarp-haringen','accessory','fixed','set',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een set haringen voor tarp-verankering.'),
('beschutting-light-thuis-72u','grondvocht-barriere','grondzeil','backup','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een grondzeil als supporting vochtbarrière (alleen Basis+ heeft variant).')
) AS v(scenario_slug, need_slug, product_type_slug, role, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN scenario_need_product_rule snpr ON snpr.scenario_need_id=sn.id AND snpr.product_type_id=pt.id AND snpr.role=v.role::ioe_product_role
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.scenario_need_product_rule_id=snpr.id AND qp.status='active');

INSERT INTO variant_item_candidate (product_variant_id, item_id, tier_id, fit_score, is_default_candidate, selection_notes, status)
SELECT pv.id, i.id, t.id, v.fit_score, true, v.notes, 'active'
FROM (VALUES
('warmtedeken','warmtedeken-basis','IOE-THERMAL-BLANKET-BASIC','basis',78,'Basis warmtedeken.'),
('warmtedeken','warmtedeken-basis-plus','IOE-THERMAL-BLANKET-PLUS','basis_plus',88,'Basis+ warmtedeken.'),
('nooddeken','nooddeken-basis','IOE-EMERGENCY-BLANKET-BASIC','basis',70,'Basis nooddeken (folie).'),
('nooddeken','nooddeken-basis-plus','IOE-EMERGENCY-BIVVY-PLUS','basis_plus',84,'Basis+ noodbivvy.'),
('regenponcho','regenponcho-basis','IOE-PONCHO-BASIC','basis',76,'Basis regenponcho.'),
('regenponcho','regenponcho-basis-plus','IOE-PONCHO-PLUS','basis_plus',86,'Basis+ regenponcho.'),
('tarp-light','tarp-light-basis','IOE-TARP-LIGHT-BASIC','basis',76,'Basis tarp-light.'),
('tarp-light','tarp-light-basis-plus','IOE-TARP-LIGHT-PLUS','basis_plus',86,'Basis+ tarp-light.'),
('paracord','paracord-basis','IOE-PARACORD-BASIC','basis',74,'Basis paracord.'),
('paracord','paracord-basis-plus','IOE-PARACORD-PLUS','basis_plus',84,'Basis+ paracord.'),
('tarp-haringen','tarp-haringen-basis','IOE-TARP-PEGS-BASIC','basis',74,'Basis haringen.'),
('tarp-haringen','tarp-haringen-basis-plus','IOE-TARP-PEGS-PLUS','basis_plus',84,'Basis+ haringen.'),
('grondzeil','grondzeil-basis-plus','IOE-GROUNDSHEET-PLUS','basis_plus',82,'Basis+ grondzeil; geen Basis-variant.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN product_variant pv ON pv.product_type_id=pt.id AND pv.slug=v.variant_slug
JOIN item i ON i.sku=v.sku
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO item_accessory_requirement (item_id, required_product_type_id, required_capability_id, quantity_base, is_mandatory, reason, status)
SELECT parent.id, rpt.id, c.id, 1, true, v.reason, 'active'
FROM (VALUES
('IOE-TARP-LIGHT-BASIC','paracord','beschutting-bevestigen','Paracord vereist om tarp-light te bevestigen.'),
('IOE-TARP-LIGHT-PLUS','paracord','beschutting-bevestigen','Paracord vereist om tarp-light te bevestigen.'),
('IOE-TARP-LIGHT-BASIC','tarp-haringen','beschutting-bevestigen','Haringen vereist om tarp-light te verankeren.'),
('IOE-TARP-LIGHT-PLUS','tarp-haringen','beschutting-bevestigen','Haringen vereist om tarp-light te verankeren.')
) AS v(parent_sku, required_pt_slug, cap_slug, reason)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN capability c ON c.slug=v.cap_slug
ON CONFLICT (item_id, required_product_type_id) DO UPDATE SET required_capability_id=EXCLUDED.required_capability_id, quantity_base=EXCLUDED.quantity_base, is_mandatory=EXCLUDED.is_mandatory, reason=EXCLUDED.reason, status=EXCLUDED.status;

INSERT INTO quantity_policy (item_accessory_requirement_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT iar.id, 'fixed', v.unit, 1, 1, 1, 'ceil', v.rationale, 'active'
FROM (VALUES
('IOE-TARP-LIGHT-BASIC','paracord','stuks','Paracord fixed 1 wanneer tarp-light is gekozen.'),
('IOE-TARP-LIGHT-PLUS','paracord','stuks','Paracord fixed 1 wanneer tarp-light is gekozen.'),
('IOE-TARP-LIGHT-BASIC','tarp-haringen','set','Haringen fixed 1 set wanneer tarp-light is gekozen.'),
('IOE-TARP-LIGHT-PLUS','tarp-haringen','set','Haringen fixed 1 set wanneer tarp-light is gekozen.')
) AS v(parent_sku, required_pt_slug, unit, rationale)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN item_accessory_requirement iar ON iar.item_id=parent.id AND iar.required_product_type_id=rpt.id
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.item_accessory_requirement_id=iar.id AND qp.status='active');

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, 70, true, now(), 'active'
FROM (VALUES
('IOE-THERMAL-BLANKET-BASIC','SUP-THERMAL-BLANKET-BASIC',12.95),
('IOE-THERMAL-BLANKET-PLUS','SUP-THERMAL-BLANKET-PLUS',24.95),
('IOE-EMERGENCY-BLANKET-BASIC','SUP-EMERGENCY-BLANKET-BASIC',2.95),
('IOE-EMERGENCY-BIVVY-PLUS','SUP-EMERGENCY-BIVVY-PLUS',9.95),
('IOE-PONCHO-BASIC','SUP-PONCHO-BASIC',6.95),
('IOE-PONCHO-PLUS','SUP-PONCHO-PLUS',14.95),
('IOE-TARP-LIGHT-BASIC','SUP-TARP-LIGHT-BASIC',14.95),
('IOE-TARP-LIGHT-PLUS','SUP-TARP-LIGHT-PLUS',29.95),
('IOE-PARACORD-BASIC','SUP-PARACORD-BASIC',5.95),
('IOE-PARACORD-PLUS','SUP-PARACORD-PLUS',9.95),
('IOE-TARP-PEGS-BASIC','SUP-TARP-PEGS-BASIC',4.95),
('IOE-TARP-PEGS-PLUS','SUP-TARP-PEGS-PLUS',8.95),
('IOE-GROUNDSHEET-PLUS','SUP-GROUNDSHEET-PLUS',12.95)
) AS v(sku, supplier_sku, price_current)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO item_usage_constraint (item_id, constraint_type, severity, public_warning, internal_notes, blocks_recommendation, requires_customer_acknowledgement, status)
SELECT i.id, v.constraint_type::ioe_usage_constraint_type, v.severity::ioe_constraint_severity, v.public_warning, v.internal_notes, false, false, 'active'
FROM (VALUES
('IOE-THERMAL-BLANKET-BASIC','fire_risk','warning','Houd de warmtedeken uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-THERMAL-BLANKET-BASIC','storage_safety','advisory','Droog opbergen en periodiek op slijtage controleren.','Storage and damage check.'),
('IOE-THERMAL-BLANKET-BASIC','medical_claim_limit','warning','Een warmtedeken vervangt geen medische behandeling van onderkoeling.','Not for medical hypothermia treatment.'),
('IOE-THERMAL-BLANKET-PLUS','fire_risk','warning','Houd de warmtedeken uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-THERMAL-BLANKET-PLUS','storage_safety','advisory','Droog opbergen en periodiek op slijtage controleren.','Storage and damage check.'),
('IOE-THERMAL-BLANKET-PLUS','medical_claim_limit','warning','Een warmtedeken vervangt geen medische behandeling van onderkoeling.','Not for medical hypothermia treatment.'),
('IOE-EMERGENCY-BLANKET-BASIC','medical_claim_limit','warning','Een nooddeken is backup en geen behandeling van onderkoeling of slaapcomfort.','Backup only; not sleep comfort or hypothermia treatment.'),
('IOE-EMERGENCY-BLANKET-BASIC','child_safety','warning','Houd folie buiten bereik van kleine kinderen en voorkom verstikkings- of verstrikkingsrisico.','Suffocation/entanglement risk.'),
('IOE-EMERGENCY-BLANKET-BASIC','storage_safety','advisory','Compact en droog bewaren; controleer periodiek op scheuren.','Storage and damage check.'),
('IOE-EMERGENCY-BLANKET-BASIC','fire_risk','warning','Houd de nooddeken uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-EMERGENCY-BIVVY-PLUS','medical_claim_limit','warning','Een noodbivvy is backup en geen behandeling van onderkoeling of slaapcomfort.','Backup only; not sleep comfort or hypothermia treatment.'),
('IOE-EMERGENCY-BIVVY-PLUS','child_safety','warning','Houd folie/bivvy buiten bereik van kleine kinderen en voorkom verstikkings- of verstrikkingsrisico.','Suffocation/entanglement risk.'),
('IOE-EMERGENCY-BIVVY-PLUS','storage_safety','advisory','Compact en droog bewaren; controleer periodiek op scheuren.','Storage and damage check.'),
('IOE-EMERGENCY-BIVVY-PLUS','fire_risk','warning','Houd de noodbivvy uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-PONCHO-BASIC','storage_safety','advisory','Laat de poncho drogen voordat je hem opbergt.','Dry before storage.'),
('IOE-PONCHO-BASIC','fire_risk','advisory','Houd de poncho uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-PONCHO-PLUS','storage_safety','advisory','Laat de poncho drogen voordat je hem opbergt.','Dry before storage.'),
('IOE-PONCHO-PLUS','fire_risk','advisory','Houd de poncho uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-TARP-LIGHT-BASIC','storage_safety','advisory','Tarp drogen voor opslag en periodiek op scheuren controleren.','Dry before storage; damage check.'),
('IOE-TARP-LIGHT-BASIC','fire_risk','warning','Houd de tarp uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-TARP-LIGHT-BASIC','child_safety','advisory','Bevestig de tarp veilig om struikel- en losrakenrisico te beperken.','Anchor safely; trip/loose risk.'),
('IOE-TARP-LIGHT-PLUS','storage_safety','advisory','Tarp drogen voor opslag en periodiek op scheuren controleren.','Dry before storage; damage check.'),
('IOE-TARP-LIGHT-PLUS','fire_risk','warning','Houd de tarp uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.'),
('IOE-TARP-LIGHT-PLUS','child_safety','advisory','Bevestig de tarp veilig om struikel- en losrakenrisico te beperken.','Anchor safely; trip/loose risk.'),
('IOE-PARACORD-BASIC','child_safety','warning','Houd koord buiten bereik van kleine kinderen om verstikkings- en verstrikkingsrisico te beperken.','Entanglement/strangulation risk.'),
('IOE-PARACORD-BASIC','storage_safety','advisory','Droog opbergen en periodiek op slijtage controleren.','Storage and damage check.'),
('IOE-PARACORD-PLUS','child_safety','warning','Houd koord buiten bereik van kleine kinderen om verstikkings- en verstrikkingsrisico te beperken.','Entanglement/strangulation risk.'),
('IOE-PARACORD-PLUS','storage_safety','advisory','Droog opbergen en periodiek op slijtage controleren.','Storage and damage check.'),
('IOE-TARP-PEGS-BASIC','child_safety','warning','Houd haringen buiten bereik van kleine kinderen vanwege scherpe punten.','Sharp point hazard.'),
('IOE-TARP-PEGS-BASIC','storage_safety','advisory','Droog opbergen en periodiek op buiging of slijtage controleren.','Storage and damage check.'),
('IOE-TARP-PEGS-PLUS','child_safety','warning','Houd haringen buiten bereik van kleine kinderen vanwege scherpe punten.','Sharp point hazard.'),
('IOE-TARP-PEGS-PLUS','storage_safety','advisory','Droog opbergen en periodiek op buiging of slijtage controleren.','Storage and damage check.'),
('IOE-GROUNDSHEET-PLUS','storage_safety','advisory','Grondzeil drogen voor opslag en periodiek op scheuren controleren.','Dry before storage; damage check.'),
('IOE-GROUNDSHEET-PLUS','fire_risk','advisory','Houd het grondzeil uit de buurt van open vuur of hittebronnen.','Fire risk near heat source.')
) AS v(sku, constraint_type, severity, public_warning, internal_notes)
JOIN item i ON i.sku=v.sku
WHERE NOT EXISTS (
  SELECT 1 FROM item_usage_constraint iuc
  WHERE iuc.item_id=i.id AND iuc.constraint_type=v.constraint_type::ioe_usage_constraint_type AND iuc.status='active'
);

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type', v.prohibited_claim, v.allowed_framing, v.internal_rationale, v.severity::ioe_constraint_severity, 'active'
FROM (VALUES
('warmtedeken','Behandelt of voorkomt onderkoeling.','Warmtedeken ondersteunt warmtebehoud; medische onderkoeling vraagt professionele hulp.','Prevents medical hypothermia treatment claim.','blocking'),
('warmtedeken','Garandeert bescherming tegen extreem weer.','Warmtedeken is praktische warmteondersteuning binnen normale omstandigheden.','Prevents extreme weather guarantee claim.','warning'),
('nooddeken','Geschikt als slaapcomfort of langdurige verwarming.','Nooddeken is backup voor warmteverlies; geen slaapcomfort.','Prevents sleep comfort claim.','blocking'),
('nooddeken','Behandelt onderkoeling.','Nooddeken kan warmteverlies beperken; medische onderkoeling vraagt professionele hulp.','Prevents hypothermia treatment claim.','blocking'),
('regenponcho','Volwaardige beschutting of shelter.','Poncho is persoonlijke regenbescherming, geen shelter of onderkomen.','Prevents shelter/onderkomen claim.','blocking'),
('tarp-light','Volledige tent of evacuatieshelter.','Tarp-light is tijdelijke afscherming, geen tent of full shelter.','Prevents full shelter/tent claim.','blocking'),
('tarp-light','Bron van warmte.','Tarp-light beschut tegen wind/regen; het is geen warmtebron.','Prevents warmth source claim.','blocking'),
('paracord','Beschutting op zichzelf.','Paracord is bevestiging bij tarp; geen shelter op zichzelf.','Prevents standalone shelter claim.','warning'),
('tarp-haringen','Beschutting op zichzelf.','Haringen verankeren tarp; geen shelter op zichzelf.','Prevents standalone shelter claim.','warning'),
('grondzeil','Slaapmat of volledige shelteroplossing.','Grondzeil is supporting vochtbarrière; geen slaapmat of onderkomen.','Prevents sleep mat/full shelter claim.','blocking')
) AS v(product_type_slug, prohibited_claim, allowed_framing, internal_rationale, severity)
JOIN product_type pt ON pt.slug=v.product_type_slug
WHERE NOT EXISTS (
  SELECT 1 FROM claim_governance_rule cgr
  WHERE cgr.rule_scope='product_type' AND cgr.product_type_id=pt.id AND cgr.prohibited_claim=v.prohibited_claim
);

COMMIT;
