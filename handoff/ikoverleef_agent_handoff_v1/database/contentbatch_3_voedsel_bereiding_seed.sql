-- Ik overleef - Contentbatch 3 Voedsel en voedselbereiding v1.
-- Adds addon=voedsel_bereiding with 72h food coverage and supporting outdoor cooking.
-- This seed uses only existing schema, enum values, source types and quantity policies.

BEGIN;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('voedsel_bereiding','Voedsel en voedselbereiding','Voor situaties waarin je 72 uur lang bruikbaar eten nodig hebt, ook zonder stroom, koeling of koken.','Eten voor 72 uur, houdbaar zonder koeling, eetbaar zonder koken, met een ondersteunende buitenkookoplossing.','active',35)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('voedselzekerheid-thuis-72u','Voedselzekerheid thuis 72 uur','Voedsel thuis 72 uur','Een huishouden moet thuis minimaal 72 uur bruikbaar voedsel hebben dat zonder koeling en zonder koken inzetbaar blijft.',72,'home','elevated','active'),
('voedselbereiding-stroomuitval-thuis','Voedselbereiding bij stroomuitval thuis','Ondersteunend buiten koken','Een huishouden heeft een ondersteunende mogelijkheid om buiten eenvoudig voedsel of water te verwarmen wanneer de reguliere keuken niet werkt. Deze mogelijkheid vervangt voedselzekerheid niet.',72,'home','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('voedsel_bereiding','voedselzekerheid-thuis-72u','Contentbatch 3: activeert primaire voedselzekerheid voor 72 uur.'),
('voedsel_bereiding','voedselbereiding-stroomuitval-thuis','Contentbatch 3: activeert ondersteunende voedselbereiding bij stroomuitval.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug=v.addon_slug
JOIN scenario s ON s.slug=v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('voedselzekerheid-72u','Voedselzekerheid 72 uur','food','De gebruiker moet voldoende houdbaar voedsel hebben voor de gekozen duur en huishoudgrootte.','We zorgen dat er voor iedereen eten is voor de gekozen periode.',false,'active'),
('eetbaar-zonder-koken','Eetbaar zonder koken','food','Het voedsel moet bruikbaar blijven zonder kookstap.','Je voedselpakket mag niet falen als koken niet mogelijk of niet veilig is.',false,'active'),
('houdbaar-zonder-koeling','Houdbaar zonder koeling','food','Het voedsel mag geen werkende koelkast vereisen.','Het eten blijft bruikbaar zonder koeling.',false,'active'),
('blikopenen','Blikopenen','food','Als gekozen voedsel een opener vereist, moet blikopenen automatisch worden afgedekt.','Als er blikproducten in zitten, voegen we een passende opener of gevalideerde multitool toe.',false,'active'),
('voedsel-verwarmen-ondersteunend','Voedsel verwarmen ondersteunend','food_prep','Een ondersteunende mogelijkheid om buiten voedsel of water te verwarmen, zonder de primaire voedseldekking te vervangen.','Een buitenkookoplossing kan helpen, maar je basiseten blijft ook zonder koken bruikbaar.',false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, v.urgency::ioe_urgency, v.relevance_score, true, v.customer_reason, v.internal_reason, v.duration_multiplier_allowed, v.household_multiplier_allowed, 'active'
FROM (VALUES
('voedselzekerheid-thuis-72u','voedselzekerheid-72u','critical',5,'Je hebt voor 72 uur voldoende eten nodig.','Core food coverage is based on persons x days and may not depend on cooking.',true,true),
('voedselzekerheid-thuis-72u','eetbaar-zonder-koken','critical',5,'Het eten moet bruikbaar blijven als koken niet kan.','No-cook coverage must stay primary and separate from stove support.',false,false),
('voedselzekerheid-thuis-72u','houdbaar-zonder-koeling','critical',5,'Het eten moet zonder koelkast houdbaar blijven.','No refrigeration may be assumed in outage scenarios.',false,false),
('voedselzekerheid-thuis-72u','blikopenen','essential',4,'Blikproducten moeten ook echt geopend kunnen worden.','Can opening is conditionally required for the POC food packs.',false,false),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','supporting',3,'Een buitenkookoplossing kan helpen om eenvoudig eten of water te verwarmen.','Cooking is supporting only and cannot replace core food coverage.',false,false)
) AS v(scenario_slug, need_slug, urgency, relevance_score, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('houdbaar-voedsel-persoonsdag','Houdbaar voedsel per persoonsdag','food','Een voedselcomponent die een persoon een dag aan noodvoedseldekking geeft.','persoonsdag','active'),
('eetbaar-zonder-koken','Eetbaar zonder koken','food','Voedsel of product kan zonder kookstap worden gegeten.','nvt','active'),
('geen-koeling-nodig','Geen koeling nodig','food','Product blijft bruikbaar zonder koelkast binnen de POC-framing.','nvt','active'),
('blikopenen','Blikopenen','food','Blikken of vergelijkbare verpakkingen handmatig kunnen openen.','nvt','active'),
('buiten-verwarmen-koken','Buiten verwarmen of koken','food_prep','Buiten eenvoudig voedsel of water kunnen verwarmen.','nvt','active'),
('compatibele-brandstof','Compatibele brandstof','food_prep','Brandstof die past bij het gekozen kooktoestel.','stuks','active'),
('ontsteken','Ontsteken','food_prep','Een vlam of kooktoestel kunnen ontsteken.','stuks','active'),
('kookvat-gebruiken','Kookvat gebruiken','food_prep','Een pan, beker of kookset kunnen gebruiken op de gekozen kookoplossing.','stuks','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('voedselzekerheid-72u','houdbaar-voedsel-persoonsdag','must','primary',5,'Voedselhoeveelheid moet primair per persoonsdag worden gedekt.'),
('eetbaar-zonder-koken','eetbaar-zonder-koken','must','primary',5,'Voedsel moet zonder koken eetbaar zijn.'),
('houdbaar-zonder-koeling','geen-koeling-nodig','must','primary',5,'Koeling mag geen aanname zijn.'),
('blikopenen','blikopenen','must','primary',5,'Blikopener of gevalideerde multitool moet blikopenen dekken.'),
('voedsel-verwarmen-ondersteunend','buiten-verwarmen-koken','should','secondary',4,'Koken is ondersteunend en buiten georienteerd.'),
('voedsel-verwarmen-ondersteunend','compatibele-brandstof','should','secondary',4,'Brandstof is verplicht accessoire bij een stove.'),
('voedsel-verwarmen-ondersteunend','ontsteken','should','secondary',4,'Ontsteking is verplicht accessoire bij een stove.'),
('voedsel-verwarmen-ondersteunend','kookvat-gebruiken','should','secondary',4,'Een kookvat is verplicht accessoire bij een stove.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug=v.need_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, v.required_strength::ioe_coverage_strength, true, v.can_replace, v.minimum_fit, v.notes
FROM (VALUES
('voedselzekerheid-thuis-72u','voedselzekerheid-72u','houdbaar-voedsel-persoonsdag','primary',true,70,'Core food coverage; stove/fuel may not replace this.'),
('voedselzekerheid-thuis-72u','eetbaar-zonder-koken','eetbaar-zonder-koken','primary',true,70,'No-cook food coverage must remain primary.'),
('voedselzekerheid-thuis-72u','houdbaar-zonder-koeling','geen-koeling-nodig','primary',true,70,'No refrigeration coverage must remain primary.'),
('voedselzekerheid-thuis-72u','blikopenen','blikopenen','primary',true,70,'Can opening can be covered by dedicated opener or verified multitool.'),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','buiten-verwarmen-koken','secondary',false,70,'Cooking heat is supporting only.'),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','compatibele-brandstof','secondary',false,70,'Fuel is an accessory requirement, not food coverage.'),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','ontsteken','secondary',false,70,'Ignition is an accessory requirement, not food coverage.'),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','kookvat-gebruiken','secondary',false,70,'Cooking vessel is an accessory requirement, not food coverage.')
) AS v(scenario_slug, need_slug, capability_slug, required_strength, can_replace, minimum_fit, notes)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('voedselpakket-persoonsdag','Voedselpakket persoonsdag','food','Houdbaar noodvoedsel voor een persoon voor een dag, bruikbaar zonder koeling en zonder koken.','expiry_sensitive',24,false,'active'),
('handmatige-blikopener','Handmatige blikopener','food','Dedicated handmatige blikopener.','durable',NULL,false,'active'),
('multitool-met-blikopener','Multitool met blikopener','food','Multitool waarvan de blikopenerfunctie expliciet is vastgelegd.','durable',NULL,false,'active'),
('buitenkooktoestel-gas','Buitenkooktoestel gas','food_prep','Compact gas-kooktoestel voor gebruik buiten.','durable',NULL,false,'active'),
('gascartouche','Gascartouche','food_prep','Compatibele gasbrandstof voor het gekozen buitenkooktoestel.','consumable',36,false,'active'),
('ontsteking','Ontsteking','food_prep','Aansteker, lucifers of stormaansteker om een kooktoestel te ontsteken.','durable',NULL,false,'active'),
('kookvat','Kookvat','food_prep','Pan, beker of kookset voor gebruik op de gekozen kookoplossing.','durable',NULL,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('voedselpakket-persoonsdag','houdbaar-voedsel-persoonsdag','primary','verified_spec','Food pack gives one person-day of shelf-stable food coverage.'),
('voedselpakket-persoonsdag','eetbaar-zonder-koken','primary','verified_spec','POC pack is ready-to-eat/no-cook.'),
('voedselpakket-persoonsdag','geen-koeling-nodig','primary','verified_spec','POC pack requires no refrigeration.'),
('handmatige-blikopener','blikopenen','primary','inherent','Dedicated can opener.'),
('multitool-met-blikopener','blikopenen','primary','verified_spec','Multitool has explicit can opener function in POC notes.'),
('buitenkooktoestel-gas','buiten-verwarmen-koken','secondary','verified_spec','Outdoor cooking heat is supporting only.'),
('gascartouche','compatibele-brandstof','secondary','verified_spec','Compatible fuel for the chosen stove; accessory only.'),
('ontsteking','ontsteken','secondary','verified_spec','Ignition accessory for stove.'),
('kookvat','kookvat-gebruiken','secondary','verified_spec','Cooking vessel accessory for stove.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, 'home', v.tier_slug, t.id, false, 'active'
FROM (VALUES
('voedselpakket-persoonsdag','voedselpakket-persoonsdag-basis','basis','Voedselpakket persoonsdag Basis'),
('voedselpakket-persoonsdag','voedselpakket-persoonsdag-basis-plus','basis_plus','Voedselpakket persoonsdag Basis+'),
('handmatige-blikopener','handmatige-blikopener-basis','basis','Handmatige blikopener Basis'),
('multitool-met-blikopener','multitool-blikopener-basis-plus','basis_plus','Multitool met blikopener Basis+'),
('buitenkooktoestel-gas','buitenkooktoestel-gas-basis','basis','Buitenkooktoestel gas Basis'),
('buitenkooktoestel-gas','buitenkooktoestel-gas-basis-plus','basis_plus','Buitenkooktoestel gas Basis+'),
('gascartouche','gascartouche-230g-basis','basis','Gascartouche 230g Basis'),
('gascartouche','gascartouche-230g-basis-plus','basis_plus','Gascartouche 230g Basis+'),
('ontsteking','ontsteking-aansteker-basis','basis','Ontsteking aansteker Basis'),
('ontsteking','ontsteking-stormaansteker-basis-plus','basis_plus','Ontsteking stormaansteker Basis+'),
('kookvat','kookvat-basis','basis','Kookvat Basis'),
('kookvat','kookset-basis-plus','basis_plus','Kookset Basis+')
) AS v(product_type_slug, slug, tier_slug, name)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, v.is_accessory_only, 'active'
FROM (VALUES
('voedselpakket-persoonsdag','NutriSafe','Basic 1PD','NutriSafe voedselpakket Basis 1 persoonsdag','IOE-FOOD-PACK-1PD-BASIC',76,78,78,false),
('voedselpakket-persoonsdag','NutriSafe','Plus 1PD','NutriSafe voedselpakket Basis+ 1 persoonsdag','IOE-FOOD-PACK-1PD-PLUS',88,88,88,false),
('handmatige-blikopener','OpenSure','Manual Basic','OpenSure handmatige blikopener','IOE-CAN-OPENER-BASIC',74,78,78,true),
('multitool-met-blikopener','ToolSure','Can Plus','ToolSure multitool met gevalideerde blikopener','IOE-MULTITOOL-CAN-OPENER-PLUS',88,88,88,true),
('buitenkooktoestel-gas','CookSafe','Compact Basic','CookSafe compact buitenkooktoestel gas','IOE-COOKER-OUTDOOR-GAS-BASIC',76,78,76,false),
('buitenkooktoestel-gas','CookSafe','Stable Plus','CookSafe stabiel buitenkooktoestel gas Basis+','IOE-COOKER-OUTDOOR-GAS-PLUS',88,88,88,false),
('gascartouche','FuelSafe','230g Basic','FuelSafe gascartouche 230g Basis','IOE-FUEL-GAS-230G-BASIC',74,76,76,true),
('gascartouche','FuelSafe','230g Plus','FuelSafe gascartouche 230g Basis+','IOE-FUEL-GAS-230G-PLUS',84,86,86,true),
('ontsteking','SparkSafe','Basic','SparkSafe aansteker basis','IOE-IGNITION-LIGHTER-BASIC',74,76,76,true),
('ontsteking','SparkSafe','Storm Plus','SparkSafe stormaansteker Basis+','IOE-IGNITION-STORM-LIGHTER-PLUS',86,88,86,true),
('kookvat','CookCup','Basic','CookCup eenvoudige kookpan','IOE-COOK-POT-BASIC',74,76,76,true),
('kookvat','CookSet','Plus','CookSet robuuste kookset Basis+','IOE-COOK-SET-PLUS',88,88,88,true)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only)
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit, v.notes
FROM (VALUES
('IOE-FOOD-PACK-1PD-BASIC','houdbaar-voedsel-persoonsdag','primary','verified_spec',true,78,'POC-seeddata: one person-day food pack; not a live product source.'),
('IOE-FOOD-PACK-1PD-BASIC','eetbaar-zonder-koken','primary','verified_spec',true,78,'Ready-to-eat POC food pack.'),
('IOE-FOOD-PACK-1PD-BASIC','geen-koeling-nodig','primary','verified_spec',true,78,'Shelf-stable POC food pack.'),
('IOE-FOOD-PACK-1PD-PLUS','houdbaar-voedsel-persoonsdag','primary','verified_spec',true,88,'POC-seeddata: better one person-day food pack; not a live product source.'),
('IOE-FOOD-PACK-1PD-PLUS','eetbaar-zonder-koken','primary','verified_spec',true,88,'Ready-to-eat plus POC food pack.'),
('IOE-FOOD-PACK-1PD-PLUS','geen-koeling-nodig','primary','verified_spec',true,88,'Shelf-stable plus POC food pack.'),
('IOE-CAN-OPENER-BASIC','blikopenen','primary','verified_spec',true,78,'Dedicated handmatige blikopener.'),
('IOE-MULTITOOL-CAN-OPENER-PLUS','blikopenen','primary','verified_spec',true,88,'Multitool has explicit verified can opener capability in POC mapping.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','buiten-verwarmen-koken','secondary','verified_spec',false,76,'Supporting outdoor cooking only; never primary food coverage.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','buiten-verwarmen-koken','secondary','verified_spec',false,88,'Robust supporting outdoor cooking only; never primary food coverage.'),
('IOE-FUEL-GAS-230G-BASIC','compatibele-brandstof','secondary','verified_spec',false,76,'Compatible fuel accessory for basic stove.'),
('IOE-FUEL-GAS-230G-PLUS','compatibele-brandstof','secondary','verified_spec',false,86,'Compatible fuel accessory for plus stove.'),
('IOE-IGNITION-LIGHTER-BASIC','ontsteken','secondary','verified_spec',false,76,'Ignition accessory.'),
('IOE-IGNITION-STORM-LIGHTER-PLUS','ontsteken','secondary','verified_spec',false,86,'More robust ignition accessory.'),
('IOE-COOK-POT-BASIC','kookvat-gebruiken','secondary','verified_spec',false,76,'Cooking vessel accessory.'),
('IOE-COOK-SET-PLUS','kookvat-gebruiken','secondary','verified_spec',false,88,'More robust cookset accessory.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit, notes)
JOIN item i ON i.sku=v.sku
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, v.role::ioe_product_role, v.priority::ioe_priority, v.quantity_base, v.quantity_per_adult, v.quantity_per_child, v.min_quantity, v.max_quantity, v.allow_multifunctional_replacement, v.explanation, 'active'
FROM (VALUES
('voedselzekerheid-thuis-72u','voedselzekerheid-72u','voedselpakket-persoonsdag','primary','must',0,1,1,1,NULL,false,'Core voedseldekking: personen x dagen, afgerond naar persoonsdagpacks.'),
('voedselzekerheid-thuis-72u','eetbaar-zonder-koken','voedselpakket-persoonsdag','primary','must',1,NULL,NULL,1,1,false,'De gekozen voedselvariant moet zonder koken eetbaar zijn.'),
('voedselzekerheid-thuis-72u','houdbaar-zonder-koeling','voedselpakket-persoonsdag','primary','must',1,NULL,NULL,1,1,false,'De gekozen voedselvariant mag geen koeling vereisen.'),
('voedselzekerheid-thuis-72u','blikopenen','handmatige-blikopener','accessory','must',1,NULL,NULL,1,1,false,'Basis gebruikt een dedicated blikopener wanneer blikproducten worden gebruikt.'),
('voedselzekerheid-thuis-72u','blikopenen','multitool-met-blikopener','accessory','must',1,NULL,NULL,1,1,true,'Basis+ mag een multitool gebruiken wanneer de blikopenercapability gevalideerd is.'),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','buitenkooktoestel-gas','backup','should',1,NULL,NULL,1,1,false,'Ondersteunende buitenkookoplossing; vervangt voedseldekking niet.')
) AS v(scenario_slug, need_slug, product_type_slug, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, quantity_per_child=EXCLUDED.quantity_per_child, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, v.formula_type::ioe_quantity_formula_type, v.unit, v.base_amount, v.adult_factor, v.child_factor, v.duration_day_factor, v.pack_size, v.min_quantity, v.max_quantity, v.rounding_rule::ioe_rounding_rule, v.rationale, 'active'
FROM (VALUES
('voedselzekerheid-thuis-72u','voedselzekerheid-72u','voedselpakket-persoonsdag','primary','per_person_per_day','packs',0,1,1,1,1,1,NULL,'pack_size','Een food pack dekt 1 persoonsdag; 72 uur bij 2 personen wordt 6 packs.'),
('voedselzekerheid-thuis-72u','eetbaar-zonder-koken','voedselpakket-persoonsdag','primary','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','No-cook is een capability check op dezelfde food pack.'),
('voedselzekerheid-thuis-72u','houdbaar-zonder-koeling','voedselpakket-persoonsdag','primary','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Geen koeling is een capability check op dezelfde food pack.'),
('voedselzekerheid-thuis-72u','blikopenen','handmatige-blikopener','accessory','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een dedicated blikopener voor Basis.'),
('voedselzekerheid-thuis-72u','blikopenen','multitool-met-blikopener','accessory','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een gevalideerde multitool met blikopener voor Basis+.'),
('voedselbereiding-stroomuitval-thuis','voedsel-verwarmen-ondersteunend','buitenkooktoestel-gas','backup','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een ondersteunende buitenkookoplossing per huishouden.')
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
('voedselpakket-persoonsdag','voedselpakket-persoonsdag-basis','IOE-FOOD-PACK-1PD-BASIC','basis',78,'Basis food pack, 1 persoonsdag.'),
('voedselpakket-persoonsdag','voedselpakket-persoonsdag-basis-plus','IOE-FOOD-PACK-1PD-PLUS','basis_plus',88,'Basis+ food pack, betere POC-variant.'),
('handmatige-blikopener','handmatige-blikopener-basis','IOE-CAN-OPENER-BASIC','basis',78,'Basis dedicated blikopener.'),
('multitool-met-blikopener','multitool-blikopener-basis-plus','IOE-MULTITOOL-CAN-OPENER-PLUS','basis_plus',88,'Basis+ multitool met gevalideerde blikopener.'),
('buitenkooktoestel-gas','buitenkooktoestel-gas-basis','IOE-COOKER-OUTDOOR-GAS-BASIC','basis',76,'Basis ondersteunende buitenkookoplossing.'),
('buitenkooktoestel-gas','buitenkooktoestel-gas-basis-plus','IOE-COOKER-OUTDOOR-GAS-PLUS','basis_plus',88,'Basis+ robuustere ondersteunende buitenkookoplossing.'),
('gascartouche','gascartouche-230g-basis','IOE-FUEL-GAS-230G-BASIC','basis',76,'Basis brandstofaccessoire.'),
('gascartouche','gascartouche-230g-basis-plus','IOE-FUEL-GAS-230G-PLUS','basis_plus',86,'Basis+ brandstofaccessoire.'),
('ontsteking','ontsteking-aansteker-basis','IOE-IGNITION-LIGHTER-BASIC','basis',76,'Basis ontsteking.'),
('ontsteking','ontsteking-stormaansteker-basis-plus','IOE-IGNITION-STORM-LIGHTER-PLUS','basis_plus',86,'Basis+ robuustere ontsteking.'),
('kookvat','kookvat-basis','IOE-COOK-POT-BASIC','basis',76,'Basis kookvat.'),
('kookvat','kookset-basis-plus','IOE-COOK-SET-PLUS','basis_plus',88,'Basis+ kookset.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN product_variant pv ON pv.product_type_id=pt.id AND pv.slug=v.variant_slug
JOIN item i ON i.sku=v.sku
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO item_accessory_requirement (item_id, required_product_type_id, required_capability_id, quantity_base, is_mandatory, reason, status)
SELECT parent.id, rpt.id, c.id, v.quantity_base, true, v.reason, 'active'
FROM (VALUES
('IOE-FOOD-PACK-1PD-BASIC','handmatige-blikopener','blikopenen',1,'Basis food pack gebruikt blikproducten; dedicated blikopener verplicht.'),
('IOE-FOOD-PACK-1PD-PLUS','multitool-met-blikopener','blikopenen',1,'Basis+ food pack gebruikt blikproducten; multitool mag alleen met gevalideerde blikopenercapability.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','gascartouche','compatibele-brandstof',1,'Compatibele brandstof verplicht bij het gekozen buitenkooktoestel.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','ontsteking','ontsteken',1,'Ontsteking verplicht bij het gekozen buitenkooktoestel.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','kookvat','kookvat-gebruiken',1,'Kookvat verplicht bij het gekozen buitenkooktoestel.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','gascartouche','compatibele-brandstof',1,'Compatibele brandstof verplicht bij het gekozen buitenkooktoestel; Basis+ krijgt redundantie via quantity.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','ontsteking','ontsteken',1,'Ontsteking verplicht bij het gekozen buitenkooktoestel.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','kookvat','kookvat-gebruiken',1,'Kookset verplicht bij het gekozen buitenkooktoestel.')
) AS v(parent_sku, required_pt_slug, cap_slug, quantity_base, reason)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN capability c ON c.slug=v.cap_slug
ON CONFLICT (item_id, required_product_type_id) DO UPDATE SET required_capability_id=EXCLUDED.required_capability_id, quantity_base=EXCLUDED.quantity_base, is_mandatory=EXCLUDED.is_mandatory, reason=EXCLUDED.reason, status=EXCLUDED.status;

INSERT INTO quantity_policy (item_accessory_requirement_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT iar.id, 'fixed', 'stuks', v.base_amount, v.base_amount, v.base_amount, 'ceil', v.rationale, 'active'
FROM (VALUES
('IOE-FOOD-PACK-1PD-BASIC','handmatige-blikopener',1,'Een dedicated blikopener wanneer Basis-food blikopening vereist.'),
('IOE-FOOD-PACK-1PD-PLUS','multitool-met-blikopener',1,'Een gevalideerde multitool wanneer Basis+ food blikopening vereist.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','gascartouche',1,'Fuel heating sessions POC mapping: Basis fixed 1.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','ontsteking',1,'Een ontsteking bij stove.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','kookvat',1,'Een kookvat bij stove.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','gascartouche',2,'Fuel heating sessions POC mapping: Basis+ fixed 2.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','ontsteking',1,'Een robuustere ontsteking bij stove.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','kookvat',1,'Een kookset bij stove.')
) AS v(parent_sku, required_pt_slug, base_amount, rationale)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN item_accessory_requirement iar ON iar.item_id=parent.id AND iar.required_product_type_id=rpt.id
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.item_accessory_requirement_id=iar.id AND qp.status='active');

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, 70, true, now(), 'active'
FROM (VALUES
('IOE-FOOD-PACK-1PD-BASIC','SUP-FOOD-PACK-1PD-BASIC',7.95),
('IOE-FOOD-PACK-1PD-PLUS','SUP-FOOD-PACK-1PD-PLUS',11.95),
('IOE-CAN-OPENER-BASIC','SUP-CAN-OPENER-BASIC',4.95),
('IOE-MULTITOOL-CAN-OPENER-PLUS','SUP-MULTITOOL-CAN-OPENER-PLUS',19.95),
('IOE-COOKER-OUTDOOR-GAS-BASIC','SUP-COOKER-OUTDOOR-GAS-BASIC',24.95),
('IOE-COOKER-OUTDOOR-GAS-PLUS','SUP-COOKER-OUTDOOR-GAS-PLUS',39.95),
('IOE-FUEL-GAS-230G-BASIC','SUP-FUEL-GAS-230G-BASIC',5.95),
('IOE-FUEL-GAS-230G-PLUS','SUP-FUEL-GAS-230G-PLUS',6.95),
('IOE-IGNITION-LIGHTER-BASIC','SUP-IGNITION-LIGHTER-BASIC',2.95),
('IOE-IGNITION-STORM-LIGHTER-PLUS','SUP-IGNITION-STORM-LIGHTER-PLUS',9.95),
('IOE-COOK-POT-BASIC','SUP-COOK-POT-BASIC',12.95),
('IOE-COOK-SET-PLUS','SUP-COOK-SET-PLUS',29.95)
) AS v(sku, supplier_sku, price_current)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO item_usage_constraint (item_id, constraint_type, severity, public_warning, internal_notes, blocks_recommendation, requires_customer_acknowledgement, status)
SELECT i.id, v.constraint_type::ioe_usage_constraint_type, v.severity::ioe_constraint_severity, v.public_warning, v.internal_notes, false, false, 'active'
FROM (VALUES
('IOE-FOOD-PACK-1PD-BASIC','storage_safety','advisory','Koel, droog en volgens verpakking bewaren.','POC-source: food storage note in existing usage constraint.'),
('IOE-FOOD-PACK-1PD-BASIC','expiry_sensitive','advisory','Controleer de houdbaarheid periodiek.','POC-source: expiry rotation note.'),
('IOE-FOOD-PACK-1PD-PLUS','storage_safety','advisory','Koel, droog en volgens verpakking bewaren.','POC-source: food storage note in existing usage constraint.'),
('IOE-FOOD-PACK-1PD-PLUS','expiry_sensitive','advisory','Controleer de houdbaarheid periodiek.','POC-source: expiry rotation note.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','indoor_use','blocking','Alleen buiten gebruiken; gebruik dit niet binnen.','Maps semantic outdoor_only to existing indoor_use constraint.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','ventilation','blocking','Niet gebruiken in afgesloten ruimtes.','Ventilation and carbon monoxide governance.'),
('IOE-COOKER-OUTDOOR-GAS-BASIC','fire_risk','warning','Gebruik stabiel en volgens productinstructies; houd afstand van brandbare materialen.','Fire risk governance for outdoor gas stove.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','indoor_use','blocking','Alleen buiten gebruiken; gebruik dit niet binnen.','Maps semantic outdoor_only to existing indoor_use constraint.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','ventilation','blocking','Niet gebruiken in afgesloten ruimtes.','Ventilation and carbon monoxide governance.'),
('IOE-COOKER-OUTDOOR-GAS-PLUS','fire_risk','warning','Gebruik stabiel en volgens productinstructies; houd afstand van brandbare materialen.','Fire risk governance for outdoor gas stove.'),
('IOE-FUEL-GAS-230G-BASIC','fuel_compatibility','warning','Alleen gebruiken met een compatibel kooktoestel.','Fuel compatibility governance.'),
('IOE-FUEL-GAS-230G-BASIC','child_safety','advisory','Buiten bereik van kinderen bewaren.','Fuel child safety.'),
('IOE-FUEL-GAS-230G-BASIC','storage_safety','warning','Koel, droog en volgens verpakking bewaren.','Fuel storage safety.'),
('IOE-FUEL-GAS-230G-PLUS','fuel_compatibility','warning','Alleen gebruiken met een compatibel kooktoestel.','Fuel compatibility governance.'),
('IOE-FUEL-GAS-230G-PLUS','child_safety','advisory','Buiten bereik van kinderen bewaren.','Fuel child safety.'),
('IOE-FUEL-GAS-230G-PLUS','storage_safety','warning','Koel, droog en volgens verpakking bewaren.','Fuel storage safety.'),
('IOE-IGNITION-LIGHTER-BASIC','child_safety','warning','Buiten bereik van kinderen bewaren.','Ignition child safety.'),
('IOE-IGNITION-LIGHTER-BASIC','fire_risk','warning','Gebruik alleen volgens productinstructies.','Ignition fire risk.'),
('IOE-IGNITION-STORM-LIGHTER-PLUS','child_safety','warning','Buiten bereik van kinderen bewaren.','Ignition child safety.'),
('IOE-IGNITION-STORM-LIGHTER-PLUS','fire_risk','warning','Gebruik alleen volgens productinstructies.','Ignition fire risk.')
) AS v(sku, constraint_type, severity, public_warning, internal_notes)
JOIN item i ON i.sku=v.sku
WHERE NOT EXISTS (
  SELECT 1 FROM item_usage_constraint iuc
  WHERE iuc.item_id=i.id AND iuc.constraint_type=v.constraint_type::ioe_usage_constraint_type AND iuc.status='active'
);

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type', v.prohibited_claim, v.allowed_framing, v.internal_rationale, v.severity::ioe_constraint_severity, 'active'
FROM (VALUES
('buitenkooktoestel-gas','Dit gas-kooktoestel is veilig binnen te gebruiken.','Dit kooktoestel is alleen een ondersteunende buitenoplossing en vervangt geen voedsel dat zonder koken bruikbaar is.','Geen indoor gas/open flame claims.', 'blocking'),
('gascartouche','Deze brandstof is geschikt voor binnen koken.','Brandstof hoort alleen bij een compatibele buitenkookoplossing en moet volgens verpakking worden gebruikt.','Geen indoor fuel claims.', 'blocking'),
('voedselpakket-persoonsdag','Dit voedselpakket vereist koken om bruikbaar te zijn.','Het food pack in deze baseline is bruikbaar zonder koken; koken is alleen ondersteunend.','Core food coverage must not depend on cooking.', 'blocking'),
('multitool-met-blikopener','Elke multitool vervangt automatisch een blikopener.','Alleen een multitool met expliciet gevalideerde blikopenercapability telt voor blikopenen.','Prevents unvalidated multitool replacement.', 'warning')
) AS v(product_type_slug, prohibited_claim, allowed_framing, internal_rationale, severity)
JOIN product_type pt ON pt.slug=v.product_type_slug
WHERE NOT EXISTS (
  SELECT 1 FROM claim_governance_rule cgr
  WHERE cgr.rule_scope='product_type' AND cgr.product_type_id=pt.id AND cgr.prohibited_claim=v.prohibited_claim
);

COMMIT;
