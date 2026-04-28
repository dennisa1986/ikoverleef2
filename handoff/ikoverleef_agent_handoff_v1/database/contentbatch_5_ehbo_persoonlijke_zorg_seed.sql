-- Ik overleef - Contentbatch 5 EHBO en persoonlijke zorg v1.
-- Adds addon=ehbo_persoonlijke_zorg with basic first aid, wound care and personal-care tasks.
-- This seed uses only existing schema, enum values, source types and quantity policies.
-- Personal medication and pain relief are represented as preparedness tasks, not generic product lines.

BEGIN;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('ehbo_persoonlijke_zorg','EHBO en persoonlijke zorg','Voor situaties waarin je thuis basale EHBO, kleine wondzorg en persoonlijke zorgchecks nodig hebt.','Praktische EHBO voor kleine incidenten, met duidelijke medische claimbeperking en zonder generieke medicatie- of pijnstilleradviezen.','active',50)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('ehbo-wondzorg-thuis-72u','EHBO wondzorg thuis 72 uur','EHBO en wondzorg thuis 72 uur','Een huishouden moet kleine wondzorg praktisch kunnen ondersteunen met EHBO-basisproducten, zonder professionele medische hulp te vervangen.',72,'home','elevated','active'),
('persoonlijke-zorg-thuis-72u','Persoonlijke zorg thuis 72 uur','Persoonlijke zorg thuis 72 uur','Een huishouden heeft ondersteunende persoonlijke zorgmiddelen zoals temperatuurcontrole, zonder diagnose- of behandelclaim.',72,'home','elevated','active'),
('persoonlijke-medicatie-check-thuis-72u','Persoonlijke medicatie check thuis 72 uur','Persoonlijke medicatie check','De gebruiker wordt eraan herinnerd eigen medicatie en pijnstilling persoonlijk te controleren; er worden geen generieke medicatieproducten gegenereerd.',72,'home','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('ehbo_persoonlijke_zorg','ehbo-wondzorg-thuis-72u','Contentbatch 5: activeert EHBO en kleine wondzorg.'),
('ehbo_persoonlijke_zorg','persoonlijke-zorg-thuis-72u','Contentbatch 5: activeert ondersteunende persoonlijke zorg.'),
('ehbo_persoonlijke_zorg','persoonlijke-medicatie-check-thuis-72u','Contentbatch 5: activeert medicatie- en pijnstillingchecks als tasks, niet als items.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug=v.addon_slug
JOIN scenario s ON s.slug=v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('basis-ehbo','Basis EHBO','first_aid','De gebruiker moet een basale EHBO-set beschikbaar hebben voor kleine incidenten.','We voegen een basis EHBO-set toe, zonder professionele hulp of behandeling te vervangen.',false,'active'),
('wonden-afdekken','Wonden afdekken','first_aid','De gebruiker moet kleine wonden kunnen afdekken met pleisters of steriel gaas.','We voegen middelen toe om kleine wonden af te dekken.',false,'active'),
('wondreiniging-ondersteunen','Wondreiniging ondersteunen','first_aid','De gebruiker moet wondreiniging praktisch kunnen ondersteunen volgens productinstructie.','We voegen wondreiniging toe als ondersteuning, niet als infectiebehandeling.',false,'active'),
('verband-fixeren','Verband fixeren','first_aid','De gebruiker moet gaas of verband praktisch kunnen fixeren.','We voegen tape toe om wondverband praktisch vast te zetten.',false,'active'),
('zorg-handbescherming','Zorg handbescherming','first_aid','De gebruiker moet handen kunnen beschermen bij wondzorghandling.','We hergebruiken nitril handschoenen voor handling, zonder steriele medische bescherming te claimen.',false,'active'),
('temperatuur-controleren','Temperatuur controleren','personal_care','De gebruiker kan temperatuur meten als ondersteunende observatie.','Een thermometer kan helpen om temperatuur te meten, maar stelt geen diagnose.',false,'active'),
('persoonlijke-medicatie-check','Persoonlijke medicatie check','personal_care','De gebruiker moet eigen medicatie, voorschriften en hulpmiddelen zelf controleren.','Controleer je eigen medicatie en voorschriften; dit systeem levert geen medicatieadvies.',true,'active'),
('pijnstilling-governance-check','Pijnstilling governance check','personal_care','De gebruiker krijgt geen standaard pijnstilleradvies; pijnstilling blijft persoonlijk en contextafhankelijk.','Pijnstilling is persoonlijk; deze baseline voegt geen generieke pijnstiller toe.',true,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, v.urgency::ioe_urgency, v.relevance_score, true, v.customer_reason, v.internal_reason, false, false, 'active'
FROM (VALUES
('ehbo-wondzorg-thuis-72u','basis-ehbo','essential',5,'Een basale EHBO-set helpt bij kleine incidenten.','EHBO baseline, no professional-care replacement claim.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','essential',5,'Kleine wonden moeten praktisch afgedekt kunnen worden.','Small wound coverage only.'),
('ehbo-wondzorg-thuis-72u','wondreiniging-ondersteunen','essential',4,'Wondreiniging kan praktisch ondersteund worden volgens instructie.','No infection treatment/prevention claim.'),
('ehbo-wondzorg-thuis-72u','verband-fixeren','supporting',3,'Gaas of verband moet vastgezet kunnen worden.','Fixation is supporting/accessory.'),
('ehbo-wondzorg-thuis-72u','zorg-handbescherming','essential',4,'Bij wondzorg wil je handen kunnen beschermen.','Gloves are handling protection, not sterile medical protection.'),
('persoonlijke-zorg-thuis-72u','temperatuur-controleren','supporting',3,'Temperatuur meten kan helpen om te observeren.','Thermometer is supporting and non-diagnostic.'),
('persoonlijke-medicatie-check-thuis-72u','persoonlijke-medicatie-check','essential',4,'Controleer je eigen medicatie, voorschriften en hulpmiddelen.','Task/content-only; no generic medication product.'),
('persoonlijke-medicatie-check-thuis-72u','pijnstilling-governance-check','supporting',3,'Pijnstilling is persoonlijk en wordt niet standaard als product toegevoegd.','Task/content-only; no generic painkiller product.')
) AS v(scenario_slug, need_slug, urgency, relevance_score, customer_reason, internal_reason)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('basis-ehbo-set-gebruiken','Basis EHBO-set gebruiken','first_aid','Een EHBO-set kunnen gebruiken voor kleine incidenten binnen niet-medisch-advies framing.','set','active'),
('pleisters-gebruiken','Pleisters gebruiken','first_aid','Kleine wonden kunnen afdekken met pleisters.','pack','active'),
('steriel-gaas-gebruiken','Steriel gaas gebruiken','first_aid','Kleine wonden kunnen afdekken met steriel gaas, zonder infectiepreventieclaim.','pack','active'),
('wondreiniging-ondersteunen','Wondreiniging ondersteunen','first_aid','Wondreiniging praktisch ondersteunen volgens productinstructie.','stuks','active'),
('verband-fixeren','Verband fixeren','first_aid','Gaas of verband kunnen fixeren met tape.','stuks','active'),
('wegwerp-handschoenen-zorg','Wegwerp handschoenen zorg','first_aid','Wegwerphandschoenen gebruiken bij wondzorghandling, zonder steriele medische bescherming.','pack','active'),
('temperatuur-meten','Temperatuur meten','personal_care','Temperatuur kunnen meten zonder diagnose of behandeladvies.','stuks','active'),
('persoonlijke-medicatie-herinneren','Persoonlijke medicatie herinneren','personal_care','Gebruiker herinneren eigen medicatie te controleren.','task','active'),
('pijnstilling-checklist','Pijnstilling checklist','personal_care','Pijnstilling alleen als persoonlijk overleg- of checklistpunt behandelen.','task','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('basis-ehbo','basis-ehbo-set-gebruiken','must','primary',5,'EHBO-set dekt basale EHBO, niet professionele hulp.'),
('wonden-afdekken','pleisters-gebruiken','must','primary',5,'Pleisters dekken kleine wondafdekking.'),
('wonden-afdekken','steriel-gaas-gebruiken','should','secondary',4,'Steriel gaas ondersteunt wondafdekking.'),
('wondreiniging-ondersteunen','wondreiniging-ondersteunen','must','primary',4,'Wondreiniging ondersteunt reiniging volgens instructie.'),
('verband-fixeren','verband-fixeren','must','secondary',3,'Tape is fixatie/supporting.'),
('zorg-handbescherming','wegwerp-handschoenen-zorg','must','primary',4,'Handschoenen beschermen bij handling, niet steriel medisch.'),
('temperatuur-controleren','temperatuur-meten','should','secondary',3,'Thermometer is supporting, not diagnostic.'),
('persoonlijke-medicatie-check','persoonlijke-medicatie-herinneren','must','backup',1,'Task/content-only; no product coverage.'),
('pijnstilling-governance-check','pijnstilling-checklist','must','backup',1,'Task/content-only; no product coverage.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug=v.need_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, v.required_strength::ioe_coverage_strength, true, false, v.minimum_fit, v.notes
FROM (VALUES
('ehbo-wondzorg-thuis-72u','basis-ehbo','basis-ehbo-set-gebruiken','primary',70,'No professional-care replacement claim.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','pleisters-gebruiken','primary',70,'Small wound coverage only.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','steriel-gaas-gebruiken','secondary',70,'Supporting wound coverage.'),
('ehbo-wondzorg-thuis-72u','wondreiniging-ondersteunen','wondreiniging-ondersteunen','primary',70,'No infection treatment/prevention claim.'),
('ehbo-wondzorg-thuis-72u','verband-fixeren','verband-fixeren','secondary',70,'Fixation is supporting/accessory.'),
('ehbo-wondzorg-thuis-72u','zorg-handbescherming','wegwerp-handschoenen-zorg','primary',70,'Handling protection, not sterile medical protection.'),
('persoonlijke-zorg-thuis-72u','temperatuur-controleren','temperatuur-meten','secondary',70,'Temperature measurement is supporting and non-diagnostic.'),
('persoonlijke-medicatie-check-thuis-72u','persoonlijke-medicatie-check','persoonlijke-medicatie-herinneren','backup',0,'Task/content-only; no item generated.'),
('persoonlijke-medicatie-check-thuis-72u','pijnstilling-governance-check','pijnstilling-checklist','backup',0,'Task/content-only; no item generated.')
) AS v(scenario_slug, need_slug, capability_slug, required_strength, minimum_fit, notes)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('ehbo-set','EHBO-set','first_aid','Basale EHBO-set voor kleine incidenten; geen vervanging voor professionele hulp.','expiry_sensitive',36,true,'active'),
('pleisters','Pleisters','first_aid','Pleisters voor kleine wondafdekking.','consumable',36,false,'active'),
('steriel-gaas','Steriel gaas','first_aid','Steriel gaas voor kleine wondafdekking; geen infectiepreventiegarantie.','consumable',36,false,'active'),
('wondreiniging','Wondreiniging','first_aid','Wondreinigingsmiddel of -spoeling volgens productinstructie; geen infectiebehandeling.','expiry_sensitive',24,false,'active'),
('verbandtape','Verbandtape','first_aid','Tape voor fixatie van gaas of verband; geen behandeling.','consumable',60,false,'active'),
('thermometer','Thermometer','personal_care','Thermometer voor temperatuurmeting; geen diagnose.','durable',NULL,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('ehbo-set','basis-ehbo-set-gebruiken','primary','verified_spec','Basic first aid kit, no professional-care replacement claim.'),
('pleisters','pleisters-gebruiken','primary','verified_spec','Small wound coverage.'),
('steriel-gaas','steriel-gaas-gebruiken','secondary','verified_spec','Supporting wound coverage, no infection prevention guarantee.'),
('wondreiniging','wondreiniging-ondersteunen','primary','verified_spec','Cleaning support only.'),
('verbandtape','verband-fixeren','secondary','verified_spec','Fixation/supporting only.'),
('nitril-handschoenen','wegwerp-handschoenen-zorg','primary','verified_spec','Reuse existing gloves for care handling; not sterile medical protection.'),
('thermometer','temperatuur-meten','secondary','verified_spec','Temperature measurement only, no diagnosis.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, 'home', v.tier_slug, t.id, false, 'active'
FROM (VALUES
('ehbo-set','ehbo-set-basis','basis','EHBO-set Basis'),
('ehbo-set','ehbo-set-basis-plus','basis_plus','EHBO-set Basis+'),
('pleisters','pleisters-basis','basis','Pleisters Basis'),
('pleisters','pleisters-basis-plus','basis_plus','Pleisters Basis+'),
('steriel-gaas','steriel-gaas-basis','basis','Steriel gaas Basis'),
('steriel-gaas','steriel-gaas-basis-plus','basis_plus','Steriel gaas Basis+'),
('wondreiniging','wondreiniging-basis','basis','Wondreiniging Basis'),
('wondreiniging','wondreiniging-basis-plus','basis_plus','Wondreiniging Basis+'),
('verbandtape','verbandtape-basis','basis','Verbandtape Basis'),
('verbandtape','verbandtape-basis-plus','basis_plus','Verbandtape Basis+'),
('thermometer','thermometer-basis-plus','basis_plus','Thermometer Basis+')
) AS v(product_type_slug, slug, tier_slug, name)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, v.is_accessory_only, 'active'
FROM (VALUES
('ehbo-set','CareSafe','Basic','CareSafe EHBO-set Basis','IOE-FIRSTAID-KIT-BASIC',76,78,78,false),
('ehbo-set','CareSafe','Plus','CareSafe EHBO-set Basis+','IOE-FIRSTAID-KIT-PLUS',88,88,88,false),
('pleisters','CareSafe','Basic Pack','CareSafe pleisterpack Basis','IOE-PLASTERS-BASIC',74,76,76,false),
('pleisters','CareSafe','Plus Pack','CareSafe pleisterpack Basis+','IOE-PLASTERS-PLUS',86,88,86,false),
('steriel-gaas','CareSafe','Basic Gauze','CareSafe steriel gaas Basis','IOE-STERILE-GAUZE-BASIC',74,76,76,false),
('steriel-gaas','CareSafe','Plus Gauze','CareSafe steriel gaas Basis+','IOE-STERILE-GAUZE-PLUS',86,88,86,false),
('wondreiniging','CareSafe','Basic Clean','CareSafe wondreiniging Basis','IOE-WOUND-CLEANING-BASIC',74,76,76,false),
('wondreiniging','CareSafe','Plus Clean','CareSafe wondreiniging Basis+','IOE-WOUND-CLEANING-PLUS',86,88,86,false),
('verbandtape','CareSafe','Basic Tape','CareSafe verbandtape Basis','IOE-MEDICAL-TAPE-BASIC',74,76,76,true),
('verbandtape','CareSafe','Plus Tape','CareSafe verbandtape Basis+','IOE-MEDICAL-TAPE-PLUS',84,86,86,true),
('thermometer','CareSafe','Digital Plus','CareSafe digitale thermometer Basis+','IOE-THERMOMETER-PLUS',86,88,86,false)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only)
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit, v.notes
FROM (VALUES
('IOE-FIRSTAID-KIT-BASIC','basis-ehbo-set-gebruiken','primary','verified_spec',true,78,'Basic first aid kit for small incidents; not professional help.'),
('IOE-FIRSTAID-KIT-PLUS','basis-ehbo-set-gebruiken','primary','verified_spec',true,88,'Plus first aid kit for small incidents; not professional help.'),
('IOE-PLASTERS-BASIC','pleisters-gebruiken','primary','verified_spec',true,76,'Small wound coverage only.'),
('IOE-PLASTERS-PLUS','pleisters-gebruiken','primary','verified_spec',true,86,'Plus small wound coverage only.'),
('IOE-STERILE-GAUZE-BASIC','steriel-gaas-gebruiken','secondary','verified_spec',false,76,'Supporting wound coverage; no infection prevention guarantee.'),
('IOE-STERILE-GAUZE-PLUS','steriel-gaas-gebruiken','secondary','verified_spec',false,86,'Plus supporting wound coverage; no infection prevention guarantee.'),
('IOE-WOUND-CLEANING-BASIC','wondreiniging-ondersteunen','primary','verified_spec',true,76,'Cleaning support only; does not treat or prevent infection.'),
('IOE-WOUND-CLEANING-PLUS','wondreiniging-ondersteunen','primary','verified_spec',true,86,'Plus cleaning support only; does not treat or prevent infection.'),
('IOE-MEDICAL-TAPE-BASIC','verband-fixeren','secondary','verified_spec',false,76,'Fixation/supporting only.'),
('IOE-MEDICAL-TAPE-PLUS','verband-fixeren','secondary','verified_spec',false,86,'Plus fixation/supporting only.'),
('IOE-GLOVES-NITRILE-BASIC','wegwerp-handschoenen-zorg','primary','verified_spec',true,76,'Reuse existing gloves for care handling; not sterile medical protection.'),
('IOE-GLOVES-NITRILE-PLUS','wegwerp-handschoenen-zorg','primary','verified_spec',true,86,'Reuse existing plus gloves for care handling; not sterile medical protection.'),
('IOE-THERMOMETER-PLUS','temperatuur-meten','secondary','verified_spec',false,86,'Temperature measurement only; no diagnosis.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit, notes)
JOIN item i ON i.sku=v.sku
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, v.role::ioe_product_role, v.priority::ioe_priority, 1, NULL, NULL, 1, 1, false, v.explanation, 'active'
FROM (VALUES
('ehbo-wondzorg-thuis-72u','basis-ehbo','ehbo-set','primary','must','EHBO-set voor kleine incidenten; vervangt geen professionele hulp.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','pleisters','primary','must','Pleisters voor kleine wondafdekking.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','steriel-gaas','backup','should','Steriel gaas ondersteunt wondafdekking; geen infectiepreventieclaim.'),
('ehbo-wondzorg-thuis-72u','wondreiniging-ondersteunen','wondreiniging','primary','must','Wondreiniging volgens productinstructie; behandelt of voorkomt geen infectie.'),
('ehbo-wondzorg-thuis-72u','verband-fixeren','verbandtape','accessory','should','Verbandtape voor fixatie, geen behandeling.'),
('ehbo-wondzorg-thuis-72u','zorg-handbescherming','nitril-handschoenen','accessory','must','Nitril handschoenen voor wondzorghandling, niet steriel medisch.'),
('persoonlijke-zorg-thuis-72u','temperatuur-controleren','thermometer','backup','should','Thermometer is ondersteunend en stelt geen diagnose.')
) AS v(scenario_slug, need_slug, product_type_slug, role, priority, explanation)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, quantity_per_child=EXCLUDED.quantity_per_child, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, 'fixed', v.unit, 1, 1, 1, 'ceil', v.rationale, 'active'
FROM (VALUES
('ehbo-wondzorg-thuis-72u','basis-ehbo','ehbo-set','primary','stuks','Een EHBO-set per huishouden.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','pleisters','primary','pack','Een pleisterpack per huishouden.'),
('ehbo-wondzorg-thuis-72u','wonden-afdekken','steriel-gaas','backup','pack','Een gaaspack als ondersteunende wondafdekking.'),
('ehbo-wondzorg-thuis-72u','wondreiniging-ondersteunen','wondreiniging','primary','stuks','Een wondreinigingproduct per huishouden.'),
('ehbo-wondzorg-thuis-72u','verband-fixeren','verbandtape','accessory','stuks','Een tape voor fixatie.'),
('ehbo-wondzorg-thuis-72u','zorg-handbescherming','nitril-handschoenen','accessory','pack','Een pack handschoenen, hergebruikt uit Fase 3.'),
('persoonlijke-zorg-thuis-72u','temperatuur-controleren','thermometer','backup','stuks','Een Basis+ thermometer als supporting item.')
) AS v(scenario_slug, need_slug, product_type_slug, role, unit, rationale)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN scenario_need_product_rule snpr ON snpr.scenario_need_id=sn.id AND snpr.product_type_id=pt.id AND snpr.role=v.role::ioe_product_role
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.scenario_need_product_rule_id=snpr.id AND qp.status='active');

INSERT INTO variant_item_candidate (product_variant_id, item_id, tier_id, fit_score, is_default_candidate, selection_notes, status)
SELECT pv.id, i.id, t.id, v.fit_score, true, v.notes, 'active'
FROM (VALUES
('ehbo-set','ehbo-set-basis','IOE-FIRSTAID-KIT-BASIC','basis',78,'Basis EHBO-set.'),
('ehbo-set','ehbo-set-basis-plus','IOE-FIRSTAID-KIT-PLUS','basis_plus',88,'Basis+ EHBO-set.'),
('pleisters','pleisters-basis','IOE-PLASTERS-BASIC','basis',76,'Basis pleisterpack.'),
('pleisters','pleisters-basis-plus','IOE-PLASTERS-PLUS','basis_plus',86,'Basis+ pleisterpack.'),
('steriel-gaas','steriel-gaas-basis','IOE-STERILE-GAUZE-BASIC','basis',76,'Basis steriel gaas.'),
('steriel-gaas','steriel-gaas-basis-plus','IOE-STERILE-GAUZE-PLUS','basis_plus',86,'Basis+ steriel gaas.'),
('wondreiniging','wondreiniging-basis','IOE-WOUND-CLEANING-BASIC','basis',76,'Basis wondreiniging.'),
('wondreiniging','wondreiniging-basis-plus','IOE-WOUND-CLEANING-PLUS','basis_plus',86,'Basis+ wondreiniging.'),
('verbandtape','verbandtape-basis','IOE-MEDICAL-TAPE-BASIC','basis',76,'Basis verbandtape.'),
('verbandtape','verbandtape-basis-plus','IOE-MEDICAL-TAPE-PLUS','basis_plus',86,'Basis+ verbandtape.'),
('nitril-handschoenen','nitril-handschoenen-basis','IOE-GLOVES-NITRILE-BASIC','basis',76,'Reuse Basis nitril handschoenen uit Fase 3.'),
('nitril-handschoenen','nitril-handschoenen-basis-plus','IOE-GLOVES-NITRILE-PLUS','basis_plus',86,'Reuse Basis+ nitril handschoenen uit Fase 3.'),
('thermometer','thermometer-basis-plus','IOE-THERMOMETER-PLUS','basis_plus',86,'Basis+ supporting thermometer.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN product_variant pv ON pv.product_type_id=pt.id AND pv.slug=v.variant_slug
JOIN item i ON i.sku=v.sku
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO item_accessory_requirement (item_id, required_product_type_id, required_capability_id, quantity_base, is_mandatory, reason, status)
SELECT parent.id, rpt.id, c.id, 1, true, v.reason, 'active'
FROM (VALUES
('IOE-FIRSTAID-KIT-BASIC','nitril-handschoenen','wegwerp-handschoenen-zorg','Handschoenen vereist bij EHBO/wondzorghandling.'),
('IOE-FIRSTAID-KIT-PLUS','nitril-handschoenen','wegwerp-handschoenen-zorg','Handschoenen vereist bij EHBO/wondzorghandling.'),
('IOE-STERILE-GAUZE-BASIC','verbandtape','verband-fixeren','Tape vereist om gaas of verband te fixeren.'),
('IOE-STERILE-GAUZE-PLUS','verbandtape','verband-fixeren','Tape vereist om gaas of verband te fixeren.'),
('IOE-WOUND-CLEANING-BASIC','nitril-handschoenen','wegwerp-handschoenen-zorg','Handschoenen vereist bij wondreiniging/handling.'),
('IOE-WOUND-CLEANING-PLUS','nitril-handschoenen','wegwerp-handschoenen-zorg','Handschoenen vereist bij wondreiniging/handling.')
) AS v(parent_sku, required_pt_slug, cap_slug, reason)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN capability c ON c.slug=v.cap_slug
ON CONFLICT (item_id, required_product_type_id) DO UPDATE SET required_capability_id=EXCLUDED.required_capability_id, quantity_base=EXCLUDED.quantity_base, is_mandatory=EXCLUDED.is_mandatory, reason=EXCLUDED.reason, status=EXCLUDED.status;

INSERT INTO quantity_policy (item_accessory_requirement_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT iar.id, 'fixed', v.unit, 1, 1, 1, 'ceil', v.rationale, 'active'
FROM (VALUES
('IOE-FIRSTAID-KIT-BASIC','nitril-handschoenen','pack','Handschoenen fixed 1 wanneer EHBO-set is gekozen.'),
('IOE-FIRSTAID-KIT-PLUS','nitril-handschoenen','pack','Handschoenen fixed 1 wanneer EHBO-set is gekozen.'),
('IOE-STERILE-GAUZE-BASIC','verbandtape','stuks','Tape fixed 1 wanneer steriel gaas is gekozen.'),
('IOE-STERILE-GAUZE-PLUS','verbandtape','stuks','Tape fixed 1 wanneer steriel gaas is gekozen.'),
('IOE-WOUND-CLEANING-BASIC','nitril-handschoenen','pack','Handschoenen fixed 1 wanneer wondreiniging is gekozen.'),
('IOE-WOUND-CLEANING-PLUS','nitril-handschoenen','pack','Handschoenen fixed 1 wanneer wondreiniging is gekozen.')
) AS v(parent_sku, required_pt_slug, unit, rationale)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN item_accessory_requirement iar ON iar.item_id=parent.id AND iar.required_product_type_id=rpt.id
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.item_accessory_requirement_id=iar.id AND qp.status='active');

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, 70, true, now(), 'active'
FROM (VALUES
('IOE-FIRSTAID-KIT-BASIC','SUP-FIRSTAID-KIT-BASIC',12.95),
('IOE-FIRSTAID-KIT-PLUS','SUP-FIRSTAID-KIT-PLUS',24.95),
('IOE-PLASTERS-BASIC','SUP-PLASTERS-BASIC',2.95),
('IOE-PLASTERS-PLUS','SUP-PLASTERS-PLUS',5.95),
('IOE-STERILE-GAUZE-BASIC','SUP-STERILE-GAUZE-BASIC',3.95),
('IOE-STERILE-GAUZE-PLUS','SUP-STERILE-GAUZE-PLUS',6.95),
('IOE-WOUND-CLEANING-BASIC','SUP-WOUND-CLEANING-BASIC',4.95),
('IOE-WOUND-CLEANING-PLUS','SUP-WOUND-CLEANING-PLUS',8.95),
('IOE-MEDICAL-TAPE-BASIC','SUP-MEDICAL-TAPE-BASIC',2.95),
('IOE-MEDICAL-TAPE-PLUS','SUP-MEDICAL-TAPE-PLUS',4.95),
('IOE-THERMOMETER-PLUS','SUP-THERMOMETER-PLUS',14.95)
) AS v(sku, supplier_sku, price_current)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO item_usage_constraint (item_id, constraint_type, severity, public_warning, internal_notes, blocks_recommendation, requires_customer_acknowledgement, status)
SELECT i.id, v.constraint_type::ioe_usage_constraint_type, v.severity::ioe_constraint_severity, v.public_warning, v.internal_notes, false, false, 'active'
FROM (VALUES
('IOE-FIRSTAID-KIT-BASIC','medical_claim_limit','warning','Deze EHBO-set vervangt geen arts, professionele hulp of noodhulp.','Medical claim limit for first aid kit.'),
('IOE-FIRSTAID-KIT-BASIC','storage_safety','advisory','Koel, droog en volgens verpakking bewaren.','Storage note.'),
('IOE-FIRSTAID-KIT-BASIC','expiry_sensitive','advisory','Controleer inhoud en houdbaarheid periodiek.','Expiry/check note.'),
('IOE-FIRSTAID-KIT-BASIC','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety.'),
('IOE-FIRSTAID-KIT-PLUS','medical_claim_limit','warning','Deze EHBO-set vervangt geen arts, professionele hulp of noodhulp.','Medical claim limit for first aid kit.'),
('IOE-FIRSTAID-KIT-PLUS','storage_safety','advisory','Koel, droog en volgens verpakking bewaren.','Storage note.'),
('IOE-FIRSTAID-KIT-PLUS','expiry_sensitive','advisory','Controleer inhoud en houdbaarheid periodiek.','Expiry/check note.'),
('IOE-FIRSTAID-KIT-PLUS','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety.'),
('IOE-PLASTERS-BASIC','medical_claim_limit','warning','Alleen voor kleine wondafdekking; niet voor ernstige verwondingen.','Plaster claim limit.'),
('IOE-PLASTERS-BASIC','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note.'),
('IOE-PLASTERS-BASIC','storage_safety','advisory','Droog bewaren.','Storage note.'),
('IOE-PLASTERS-PLUS','medical_claim_limit','warning','Alleen voor kleine wondafdekking; niet voor ernstige verwondingen.','Plaster claim limit.'),
('IOE-PLASTERS-PLUS','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note.'),
('IOE-PLASTERS-PLUS','storage_safety','advisory','Droog bewaren.','Storage note.'),
('IOE-STERILE-GAUZE-BASIC','medical_claim_limit','warning','Ondersteunt wondafdekking, maar garandeert geen infectiepreventie.','Gauze claim limit.'),
('IOE-STERILE-GAUZE-BASIC','expiry_sensitive','advisory','Controleer steriliteit en houdbaarheid van de verpakking.','Expiry/sterile pack note.'),
('IOE-STERILE-GAUZE-BASIC','storage_safety','advisory','Droog en schoon bewaren.','Storage note.'),
('IOE-STERILE-GAUZE-BASIC','disposal_requirement','advisory','Gebruikt materiaal veilig afvoeren.','Disposal note.'),
('IOE-STERILE-GAUZE-PLUS','medical_claim_limit','warning','Ondersteunt wondafdekking, maar garandeert geen infectiepreventie.','Gauze claim limit.'),
('IOE-STERILE-GAUZE-PLUS','expiry_sensitive','advisory','Controleer steriliteit en houdbaarheid van de verpakking.','Expiry/sterile pack note.'),
('IOE-STERILE-GAUZE-PLUS','storage_safety','advisory','Droog en schoon bewaren.','Storage note.'),
('IOE-STERILE-GAUZE-PLUS','disposal_requirement','advisory','Gebruikt materiaal veilig afvoeren.','Disposal note.'),
('IOE-WOUND-CLEANING-BASIC','medical_claim_limit','warning','Ondersteunt reiniging volgens instructie, maar behandelt of voorkomt geen infectie.','Wound cleaning claim limit.'),
('IOE-WOUND-CLEANING-BASIC','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note.'),
('IOE-WOUND-CLEANING-BASIC','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety.'),
('IOE-WOUND-CLEANING-BASIC','storage_safety','advisory','Volgens verpakking bewaren.','Storage note.'),
('IOE-WOUND-CLEANING-PLUS','medical_claim_limit','warning','Ondersteunt reiniging volgens instructie, maar behandelt of voorkomt geen infectie.','Wound cleaning claim limit.'),
('IOE-WOUND-CLEANING-PLUS','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note.'),
('IOE-WOUND-CLEANING-PLUS','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety.'),
('IOE-WOUND-CLEANING-PLUS','storage_safety','advisory','Volgens verpakking bewaren.','Storage note.'),
('IOE-MEDICAL-TAPE-BASIC','medical_claim_limit','warning','Tape fixeert verband, maar behandelt geen wond.','Tape claim limit.'),
('IOE-MEDICAL-TAPE-BASIC','storage_safety','advisory','Droog bewaren.','Storage note.'),
('IOE-MEDICAL-TAPE-PLUS','medical_claim_limit','warning','Tape fixeert verband, maar behandelt geen wond.','Tape claim limit.'),
('IOE-MEDICAL-TAPE-PLUS','storage_safety','advisory','Droog bewaren.','Storage note.'),
('IOE-THERMOMETER-PLUS','medical_claim_limit','warning','Meet temperatuur, maar stelt geen diagnose en geeft geen behandeladvies.','Thermometer non-diagnostic governance.'),
('IOE-THERMOMETER-PLUS','storage_safety','advisory','Droog en volgens verpakking bewaren.','Storage note.')
) AS v(sku, constraint_type, severity, public_warning, internal_notes)
JOIN item i ON i.sku=v.sku
WHERE NOT EXISTS (
  SELECT 1 FROM item_usage_constraint iuc
  WHERE iuc.item_id=i.id AND iuc.constraint_type=v.constraint_type::ioe_usage_constraint_type AND iuc.status='active'
);

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type', v.prohibited_claim, v.allowed_framing, v.internal_rationale, v.severity::ioe_constraint_severity, 'active'
FROM (VALUES
('ehbo-set','Deze EHBO-set vervangt professionele medische hulp.','EHBO-set ondersteunt kleine incidenten; bij twijfel of ernst professionele hulp inschakelen.','Prevents professional-care replacement claim.', 'blocking'),
('pleisters','Geschikt voor ernstige verwondingen.','Pleisters zijn voor kleine wondafdekking.','Prevents severe wound claim.', 'blocking'),
('steriel-gaas','Garandeert infectiepreventie.','Steriel gaas ondersteunt wondafdekking, maar garandeert geen infectiepreventie.','Prevents infection prevention claim.', 'blocking'),
('wondreiniging','Behandelt of voorkomt infectie.','Wondreiniging ondersteunt reiniging volgens instructie, zonder infectiebehandeling te claimen.','Prevents treatment/prevention claim.', 'blocking'),
('verbandtape','Behandelt wonden.','Verbandtape is fixatie/supporting, geen behandeling.','Prevents treatment claim.', 'warning'),
('nitril-handschoenen','Biedt steriele medische bescherming.','Nitril handschoenen bieden handlingbescherming, geen steriele medische bescherming.','Prevents sterile medical PPE claim.', 'blocking'),
('thermometer','Stelt diagnose of geeft behandeladvies.','Thermometer meet temperatuur, zonder diagnose of behandeladvies.','Prevents diagnostic claim.', 'blocking')
) AS v(product_type_slug, prohibited_claim, allowed_framing, internal_rationale, severity)
JOIN product_type pt ON pt.slug=v.product_type_slug
WHERE NOT EXISTS (
  SELECT 1 FROM claim_governance_rule cgr
  WHERE cgr.rule_scope='product_type' AND cgr.product_type_id=pt.id AND cgr.prohibited_claim=v.prohibited_claim
);

INSERT INTO preparedness_task (scenario_need_id, task_slug, title, description_public, internal_notes, priority, is_user_specific, requires_completion, recurrence_months, status)
SELECT sn.id, v.task_slug, v.title, v.description_public, v.internal_notes, v.priority::ioe_priority, true, true, v.recurrence_months, 'active'
FROM (VALUES
('persoonlijke-medicatie-check-thuis-72u','persoonlijke-medicatie-check','Controleer je persoonlijke medicatie','Controleer zelf je persoonlijke medicatie, voorschriften en medische hulpmiddelen voor de gekozen periode. Dit systeem geeft geen persoonlijk medicatieadvies en levert geen receptmedicatie.','Task/content-only: no generic medication item, no supplier_offer, no dosage advice.','must',6),
('persoonlijke-medicatie-check-thuis-72u','pijnstilling-governance-check','Maak pijnstilling een persoonlijk overlegpunt','Pijnstilling is persoonlijk en contextafhankelijk. Deze baseline voegt geen generieke pijnstiller toe; leg dit alleen vast als checklist- of overlegpunt.','Task/content-only: no generic painkiller item and no dosage advice.','should',12)
) AS v(scenario_slug, task_slug, title, description_public, internal_notes, priority, recurrence_months)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN scenario_need sn ON sn.scenario_id=s.id
JOIN need n ON n.id=sn.need_id AND n.slug=v.task_slug
ON CONFLICT (task_slug) DO UPDATE SET scenario_need_id=EXCLUDED.scenario_need_id, title=EXCLUDED.title, description_public=EXCLUDED.description_public, internal_notes=EXCLUDED.internal_notes, priority=EXCLUDED.priority, is_user_specific=EXCLUDED.is_user_specific, requires_completion=EXCLUDED.requires_completion, recurrence_months=EXCLUDED.recurrence_months, status=EXCLUDED.status;

COMMIT;
