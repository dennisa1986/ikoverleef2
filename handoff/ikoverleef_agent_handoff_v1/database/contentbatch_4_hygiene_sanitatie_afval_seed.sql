-- Ik overleef - Contentbatch 4 Hygiene, sanitatie en afval v1.
-- Adds addon=hygiene_sanitatie_afval for 72h hygiene, emergency sanitation and waste handling.
-- This seed uses only existing schema, enum values, source types and quantity policies.

BEGIN;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('hygiene_sanitatie_afval','Hygiene, sanitatie en afval','Voor situaties waarin je thuis 72 uur basis hygiene, noodsanitatie en afvalinsluiting nodig hebt.','Basis hygiene, noodtoiletgebruik en afval veilig insluiten zonder medische of volledige infectiepreventieclaims.','active',45)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('hygiene-thuis-72u','Hygiene thuis 72 uur','Hygiene thuis 72 uur','Een huishouden moet thuis 72 uur basale handhygiene en oppervlaktereiniging kunnen uitvoeren zonder medische of sterilisatieclaims.',72,'home','elevated','active'),
('noodsanitatie-thuis-72u','Noodsanitatie thuis 72 uur','Noodtoilet thuis 72 uur','Een huishouden moet tijdelijk toiletafval kunnen opvangen, absorberen en afsluiten met passende waarschuwingen.',72,'home','elevated','active'),
('afvalbeheer-thuis-72u','Afvalbeheer thuis 72 uur','Afvalbeheer thuis 72 uur','Een huishouden moet afval kunnen insluiten, scheiden en klein of verontreinigd afval afsluitbaar bewaren.',72,'home','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('hygiene_sanitatie_afval','hygiene-thuis-72u','Contentbatch 4: activeert basishygiene voor 72 uur.'),
('hygiene_sanitatie_afval','noodsanitatie-thuis-72u','Contentbatch 4: activeert noodsanitatie voor 72 uur.'),
('hygiene_sanitatie_afval','afvalbeheer-thuis-72u','Contentbatch 4: activeert afvalinsluiting en klein-afvalbeheer.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug=v.addon_slug
JOIN scenario s ON s.slug=v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('handhygiene','Handhygiene','hygiene','De gebruiker moet handen kunnen reinigen of desinfecteren binnen de POC-framing.','We voegen basismiddelen toe voor handhygiene, zonder medische bescherming te claimen.',false,'active'),
('basishygiene-reiniging','Basishygiene reiniging','hygiene','De gebruiker moet oppervlakken of handen praktisch kunnen reinigen met doekjes en basiszeep.','We voegen eenvoudige reinigingsmiddelen toe, zonder sterilisatieclaim.',false,'active'),
('noodtoilet-72u','Noodtoilet 72 uur','sanitation','De gebruiker moet tijdelijk toiletafval kunnen opvangen en afsluiten.','We zorgen voor een tijdelijke noodsanitatie-oplossing met duidelijke gebruikswaarschuwingen.',false,'active'),
('sanitatie-absorptie-afsluiting','Sanitatie absorptie en afsluiting','sanitation','Toiletafval moet waar nodig worden geabsorbeerd en veilig afgesloten.','We voegen absorberend of afsluitend materiaal toe waar de gekozen sanitatie-oplossing dit vereist.',false,'active'),
('afval-insluiten','Afval insluiten','waste','De gebruiker moet huishoudelijk afval in zakken kunnen insluiten.','We voegen afvalzakken toe voor tijdelijke afvalcontainment.',false,'active'),
('afval-scheiden','Afval scheiden','waste','De gebruiker moet klein, geurend of verontreinigd afval apart afsluitbaar kunnen bewaren.','We voegen afsluitbare zakjes toe voor klein afval waar dit helpt.',false,'active'),
('handbescherming','Handbescherming','hygiene','De gebruiker moet handen kunnen beschermen bij sanitatie- en afvalhandling.','We voegen wegwerphandschoenen toe voor handling, zonder medische steriliteit te claimen.',false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, v.urgency::ioe_urgency, v.relevance_score, true, v.customer_reason, v.internal_reason, v.duration_multiplier_allowed, v.household_multiplier_allowed, 'active'
FROM (VALUES
('hygiene-thuis-72u','handhygiene','essential',5,'Je moet je handen basaal kunnen reinigen of desinfecteren.','Handhygiene is practical hygiene, not medical protection.',true,true),
('hygiene-thuis-72u','basishygiene-reiniging','essential',4,'Je moet oppervlakken en handen praktisch kunnen reinigen.','Cleaning wipes and soap may not claim sterilization.',true,true),
('noodsanitatie-thuis-72u','noodtoilet-72u','critical',5,'Je hebt een tijdelijke oplossing nodig voor toiletgebruik als regulier sanitair niet werkt.','Emergency toilet bags are core sanitation containment.',true,true),
('noodsanitatie-thuis-72u','sanitatie-absorptie-afsluiting','essential',4,'Toiletafval moet waar nodig worden geabsorbeerd en afgesloten.','Absorbent is supporting/accessory unless integrated.',true,true),
('afvalbeheer-thuis-72u','afval-insluiten','essential',4,'Je moet tijdelijk afval kunnen insluiten.','Waste bags cover containment, not complete sanitation.',true,true),
('afvalbeheer-thuis-72u','afval-scheiden','supporting',3,'Klein of verontreinigd afval moet apart afsluitbaar kunnen worden bewaard.','Zipbags are supporting for small waste containment.',false,false),
('afvalbeheer-thuis-72u','handbescherming','essential',4,'Bij sanitatie en afvalhandling wil je handen kunnen beschermen.','Gloves are handling protection, not medical sterile protection.',false,false)
) AS v(scenario_slug, need_slug, urgency, relevance_score, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('handen-desinfecteren','Handen desinfecteren','hygiene','Handen kunnen desinfecteren volgens productinstructie, zonder medische bescherming te claimen.','ml/gebruik','active'),
('handen-reinigen','Handen reinigen','hygiene','Handen praktisch kunnen reinigen met zeep of vergelijkbaar middel.','stuks','active'),
('oppervlak-reinigen-met-doekjes','Oppervlak reinigen met doekjes','hygiene','Oppervlakken praktisch kunnen reinigen met doekjes, zonder sterilisatieclaim.','doekjes','active'),
('toiletafval-insluiten','Toiletafval insluiten','sanitation','Toiletafval tijdelijk kunnen opvangen en afsluiten.','zakken','active'),
('sanitair-absorberen','Sanitair absorberen','sanitation','Vloeistof of geur in toiletafval kunnen absorberen volgens productinstructie.','pack','active'),
('afvalzak-gebruiken','Afvalzak gebruiken','waste','Afval tijdelijk kunnen verzamelen en insluiten in zakken.','zakken','active'),
('klein-afval-afsluitbaar-bewaren','Klein afval afsluitbaar bewaren','waste','Klein of geurend afval apart afsluitbaar bewaren.','zakjes','active'),
('wegwerp-handbescherming','Wegwerp handbescherming','hygiene','Wegwerphandschoenen gebruiken bij handling, zonder medische steriliteit te claimen.','paar','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('handhygiene','handen-desinfecteren','must','primary',5,'Handgel dekt handhygiene zonder medische claim.'),
('handhygiene','handen-reinigen','should','secondary',3,'Zeep ondersteunt handhygiene als aparte basismodule.'),
('basishygiene-reiniging','oppervlak-reinigen-met-doekjes','must','primary',5,'Doekjes dekken basale reiniging maar geen sterilisatie.'),
('basishygiene-reiniging','handen-reinigen','should','secondary',3,'Basiszeep ondersteunt reiniging.'),
('noodtoilet-72u','toiletafval-insluiten','must','primary',5,'Noodtoiletzakken dekken toiletafval insluiten.'),
('sanitatie-absorptie-afsluiting','sanitair-absorberen','must','secondary',4,'Absorptie is supporting/accessory tenzij geintegreerd.'),
('afval-insluiten','afvalzak-gebruiken','must','primary',5,'Vuilniszakken dekken afvalcontainment.'),
('afval-scheiden','klein-afval-afsluitbaar-bewaren','must','secondary',4,'Zipbags ondersteunen klein afval scheiden en afsluiten.'),
('handbescherming','wegwerp-handbescherming','must','primary',5,'Nitril handschoenen dekken handlingbescherming, niet medische steriliteit.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug=v.need_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, v.required_strength::ioe_coverage_strength, true, false, v.minimum_fit, v.notes
FROM (VALUES
('hygiene-thuis-72u','handhygiene','handen-desinfecteren','primary',70,'Handgel is practical hygiene, not medical protection.'),
('hygiene-thuis-72u','handhygiene','handen-reinigen','secondary',70,'Soap is secondary/supporting hand cleaning.'),
('hygiene-thuis-72u','basishygiene-reiniging','oppervlak-reinigen-met-doekjes','primary',70,'Wipes are cleaning, not sterilizing.'),
('hygiene-thuis-72u','basishygiene-reiniging','handen-reinigen','secondary',70,'Soap supports basic cleaning.'),
('noodsanitatie-thuis-72u','noodtoilet-72u','toiletafval-insluiten','primary',70,'Emergency toilet bags are core sanitation containment.'),
('noodsanitatie-thuis-72u','sanitatie-absorptie-afsluiting','sanitair-absorberen','secondary',70,'Absorbent is supporting/accessory.'),
('afvalbeheer-thuis-72u','afval-insluiten','afvalzak-gebruiken','primary',70,'Waste bags cover containment only.'),
('afvalbeheer-thuis-72u','afval-scheiden','klein-afval-afsluitbaar-bewaren','secondary',70,'Zipbags support small waste containment.'),
('afvalbeheer-thuis-72u','handbescherming','wegwerp-handbescherming','primary',70,'Gloves are handling protection only.')
) AS v(scenario_slug, need_slug, capability_slug, required_strength, minimum_fit, notes)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('handgel','Handgel','hygiene','Alcoholhoudende of vergelijkbare handgel voor praktische handhygiene volgens productinstructie.','expiry_sensitive',24,false,'active'),
('hygienedoekjes','Hygienedoekjes','hygiene','Doekjes voor basale reiniging van handen of oppervlakken, zonder sterilisatieclaim.','consumable',24,false,'active'),
('basiszeep','Basiszeep','hygiene','Zeep voor praktische handreiniging.','consumable',36,false,'active'),
('noodtoiletzakken','Noodtoiletzakken','sanitation','Zakken voor tijdelijk toiletgebruik en toiletafvalinsluiting.','consumable',36,false,'active'),
('sanitair-absorptiemiddel','Sanitair absorptiemiddel','sanitation','Absorberend middel voor noodsanitatie volgens instructie.','consumable',36,false,'active'),
('toiletpapier','Toiletpapier','sanitation','Toiletpapier als basisverbruiksartikel bij noodsanitatie.','consumable',36,false,'active'),
('vuilniszakken','Vuilniszakken','waste','Afvalzakken voor tijdelijke afvalcontainment.','consumable',60,false,'active'),
('zipbags','Zipbags','waste','Afsluitbare zakjes voor klein, geurend of verontreinigd huishoudelijk afval.','consumable',60,false,'active'),
('nitril-handschoenen','Nitril handschoenen','hygiene','Wegwerphandschoenen voor handling; geen medische steriliteit of infectiepreventieclaim.','consumable',36,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('handgel','handen-desinfecteren','primary','verified_spec','Handgel supports hand hygiene per product instruction; no medical claim.'),
('basiszeep','handen-reinigen','secondary','verified_spec','Soap supports hand cleaning.'),
('hygienedoekjes','oppervlak-reinigen-met-doekjes','primary','verified_spec','Wipes support basic cleaning, not sterilization.'),
('noodtoiletzakken','toiletafval-insluiten','primary','verified_spec','Emergency toilet bags contain toilet waste.'),
('sanitair-absorptiemiddel','sanitair-absorberen','secondary','verified_spec','Absorbent supports sanitation handling.'),
('toiletpapier','toiletafval-insluiten','secondary','typical','Toilet paper supports emergency toilet use but is not waste containment.'),
('vuilniszakken','afvalzak-gebruiken','primary','verified_spec','Waste bags contain household waste temporarily.'),
('zipbags','klein-afval-afsluitbaar-bewaren','secondary','verified_spec','Zipbags support small waste containment.'),
('nitril-handschoenen','wegwerp-handbescherming','primary','verified_spec','Disposable gloves support handling protection; not sterile medical protection.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, 'home', v.tier_slug, t.id, false, 'active'
FROM (VALUES
('handgel','handgel-basis','basis','Handgel Basis'),
('handgel','handgel-basis-plus','basis_plus','Handgel Basis+'),
('hygienedoekjes','hygienedoekjes-basis','basis','Hygienedoekjes Basis'),
('hygienedoekjes','hygienedoekjes-basis-plus','basis_plus','Hygienedoekjes Basis+'),
('basiszeep','basiszeep-basis','basis','Basiszeep Basis'),
('basiszeep','basiszeep-basis-plus','basis_plus','Basiszeep Basis+'),
('noodtoiletzakken','noodtoiletzakken-basis','basis','Noodtoiletzakken Basis'),
('noodtoiletzakken','noodtoiletzakken-basis-plus','basis_plus','Noodtoiletzakken Basis+'),
('sanitair-absorptiemiddel','sanitair-absorptiemiddel-basis','basis','Sanitair absorptiemiddel Basis'),
('sanitair-absorptiemiddel','sanitair-absorptiemiddel-basis-plus','basis_plus','Sanitair absorptiemiddel Basis+'),
('toiletpapier','toiletpapier-basis','basis','Toiletpapier Basis'),
('toiletpapier','toiletpapier-basis-plus','basis_plus','Toiletpapier Basis+'),
('vuilniszakken','vuilniszakken-basis','basis','Vuilniszakken Basis'),
('vuilniszakken','vuilniszakken-basis-plus','basis_plus','Vuilniszakken Basis+'),
('zipbags','zipbags-basis','basis','Zipbags Basis'),
('zipbags','zipbags-basis-plus','basis_plus','Zipbags Basis+'),
('nitril-handschoenen','nitril-handschoenen-basis','basis','Nitril handschoenen Basis'),
('nitril-handschoenen','nitril-handschoenen-basis-plus','basis_plus','Nitril handschoenen Basis+')
) AS v(product_type_slug, slug, tier_slug, name)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, v.is_accessory_only, 'active'
FROM (VALUES
('handgel','CleanSafe','Basic 100ml','CleanSafe handgel Basis 100 ml','IOE-HANDGEL-BASIC',76,78,78,false),
('handgel','CleanSafe','Plus 250ml','CleanSafe handgel Basis+ 250 ml','IOE-HANDGEL-PLUS',88,88,88,false),
('hygienedoekjes','WipeSafe','Basic 20','WipeSafe hygienedoekjes Basis 20 stuks','IOE-HYGIENE-WIPES-BASIC',76,78,78,false),
('hygienedoekjes','WipeSafe','Plus 40','WipeSafe hygienedoekjes Basis+ 40 stuks','IOE-HYGIENE-WIPES-PLUS',88,88,88,false),
('basiszeep','SoapSafe','Basic','SoapSafe basiszeep','IOE-SOAP-BASIC',74,76,76,false),
('basiszeep','SoapSafe','Plus','SoapSafe basiszeep Basis+','IOE-SOAP-PLUS',84,86,86,false),
('noodtoiletzakken','SanitSafe','Basic 10','SanitSafe noodtoiletzakken Basis 10 stuks','IOE-TOILET-BAGS-BASIC',76,78,78,false),
('noodtoiletzakken','SanitSafe','Plus 12','SanitSafe noodtoiletzakken Basis+ 12 stuks','IOE-TOILET-BAGS-PLUS',88,88,88,false),
('sanitair-absorptiemiddel','AbsorbSafe','Basic','AbsorbSafe sanitair absorptiemiddel Basis','IOE-ABSORBENT-BASIC',74,76,76,true),
('sanitair-absorptiemiddel','AbsorbSafe','Plus','AbsorbSafe sanitair absorptiemiddel Basis+','IOE-ABSORBENT-PLUS',84,86,86,true),
('toiletpapier','PaperSafe','Basic','PaperSafe toiletpapier Basis','IOE-TOILET-PAPER-BASIC',74,76,76,false),
('toiletpapier','PaperSafe','Plus','PaperSafe toiletpapier Basis+','IOE-TOILET-PAPER-PLUS',84,86,86,false),
('vuilniszakken','WasteSafe','Basic 20L','WasteSafe vuilniszakken Basis 20 liter','IOE-WASTE-BAGS-BASIC',74,76,76,false),
('vuilniszakken','WasteSafe','Plus 35L','WasteSafe vuilniszakken Basis+ 35 liter','IOE-WASTE-BAGS-PLUS',86,88,86,false),
('zipbags','SealSafe','Basic','SealSafe zipbags Basis','IOE-ZIPBAGS-BASIC',74,76,76,true),
('zipbags','SealSafe','Plus','SealSafe zipbags Basis+','IOE-ZIPBAGS-PLUS',84,86,86,true),
('nitril-handschoenen','GloveSafe','Basic','GloveSafe nitril handschoenen Basis','IOE-GLOVES-NITRILE-BASIC',74,76,76,true),
('nitril-handschoenen','GloveSafe','Plus','GloveSafe nitril handschoenen Basis+','IOE-GLOVES-NITRILE-PLUS',86,88,86,true)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only)
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit, v.notes
FROM (VALUES
('IOE-HANDGEL-BASIC','handen-desinfecteren','primary','verified_spec',true,78,'POC handgel: hand hygiene only, no medical protection.'),
('IOE-HANDGEL-PLUS','handen-desinfecteren','primary','verified_spec',true,88,'POC plus handgel: hand hygiene only, no medical protection.'),
('IOE-HYGIENE-WIPES-BASIC','oppervlak-reinigen-met-doekjes','primary','verified_spec',true,78,'POC wipes: cleaning, not sterilization.'),
('IOE-HYGIENE-WIPES-PLUS','oppervlak-reinigen-met-doekjes','primary','verified_spec',true,88,'POC plus wipes: cleaning, not sterilization.'),
('IOE-SOAP-BASIC','handen-reinigen','secondary','verified_spec',false,76,'Basic soap supports hand cleaning.'),
('IOE-SOAP-PLUS','handen-reinigen','secondary','verified_spec',false,86,'Plus soap supports hand cleaning.'),
('IOE-TOILET-BAGS-BASIC','toiletafval-insluiten','primary','verified_spec',true,78,'Emergency toilet bags contain toilet waste with usage warnings.'),
('IOE-TOILET-BAGS-PLUS','toiletafval-insluiten','primary','verified_spec',true,88,'Plus emergency toilet bags contain toilet waste with usage warnings.'),
('IOE-ABSORBENT-BASIC','sanitair-absorberen','secondary','verified_spec',false,76,'Absorbent is supporting/accessory for sanitation.'),
('IOE-ABSORBENT-PLUS','sanitair-absorberen','secondary','verified_spec',false,86,'Plus absorbent is supporting/accessory for sanitation.'),
('IOE-TOILET-PAPER-BASIC','toiletafval-insluiten','secondary','assumed',false,76,'Toilet paper supports sanitation but is not containment.'),
('IOE-TOILET-PAPER-PLUS','toiletafval-insluiten','secondary','assumed',false,86,'Plus toilet paper supports sanitation but is not containment.'),
('IOE-WASTE-BAGS-BASIC','afvalzak-gebruiken','primary','verified_spec',true,76,'Waste bags contain household waste, not complete sanitation.'),
('IOE-WASTE-BAGS-PLUS','afvalzak-gebruiken','primary','verified_spec',true,86,'Plus waste bags contain household waste, not complete sanitation.'),
('IOE-ZIPBAGS-BASIC','klein-afval-afsluitbaar-bewaren','secondary','verified_spec',false,76,'Zipbags support small waste containment.'),
('IOE-ZIPBAGS-PLUS','klein-afval-afsluitbaar-bewaren','secondary','verified_spec',false,86,'Plus zipbags support small waste containment.'),
('IOE-GLOVES-NITRILE-BASIC','wegwerp-handbescherming','primary','verified_spec',true,76,'Nitrile gloves support handling protection, not medical sterility.'),
('IOE-GLOVES-NITRILE-PLUS','wegwerp-handbescherming','primary','verified_spec',true,86,'Plus nitrile gloves support handling protection, not medical sterility.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit, notes)
JOIN item i ON i.sku=v.sku
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, v.role::ioe_product_role, v.priority::ioe_priority, v.quantity_base, v.quantity_per_adult, v.quantity_per_child, v.min_quantity, v.max_quantity, false, v.explanation, 'active'
FROM (VALUES
('hygiene-thuis-72u','handhygiene','handgel','primary','must',1,NULL,NULL,1,1,'Handgel voor praktische handhygiene; geen medische bescherming.'),
('hygiene-thuis-72u','handhygiene','basiszeep','backup','should',1,NULL,NULL,1,1,'Basiszeep ondersteunt handreiniging.'),
('hygiene-thuis-72u','basishygiene-reiniging','hygienedoekjes','primary','must',0,4,4,1,NULL,'Hygienedoekjes per persoon per dag, afgerond op pack size; geen sterilisatieclaim.'),
('hygiene-thuis-72u','basishygiene-reiniging','basiszeep','backup','should',1,NULL,NULL,1,1,'Basiszeep ondersteunt basale reiniging.'),
('noodsanitatie-thuis-72u','noodtoilet-72u','noodtoiletzakken','primary','must',0,2,2,1,NULL,'Noodtoiletzakken per persoon per dag, afgerond op pack size.'),
('noodsanitatie-thuis-72u','sanitatie-absorptie-afsluiting','sanitair-absorptiemiddel','accessory','must',1,NULL,NULL,1,1,'Absorptiemiddel als supporting/accessory bij noodsanitatie.'),
('noodsanitatie-thuis-72u','sanitatie-absorptie-afsluiting','toiletpapier','backup','should',1,NULL,NULL,1,1,'Toiletpapier als basisverbruiksartikel bij noodsanitatie.'),
('afvalbeheer-thuis-72u','afval-insluiten','vuilniszakken','primary','must',1,NULL,NULL,1,1,'Vuilniszakken voor afvalcontainment.'),
('afvalbeheer-thuis-72u','afval-scheiden','zipbags','accessory','should',1,NULL,NULL,1,1,'Zipbags voor klein of geurend afval.'),
('afvalbeheer-thuis-72u','handbescherming','nitril-handschoenen','accessory','must',1,NULL,NULL,1,1,'Nitril handschoenen voor handling, geen medische steriliteit.')
) AS v(scenario_slug, need_slug, product_type_slug, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, explanation)
JOIN scenario s ON s.slug=v.scenario_slug
JOIN need n ON n.slug=v.need_slug
JOIN scenario_need sn ON sn.scenario_id=s.id AND sn.need_id=n.id
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, quantity_per_child=EXCLUDED.quantity_per_child, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, v.formula_type::ioe_quantity_formula_type, v.unit, v.base_amount, v.adult_factor, v.child_factor, v.duration_day_factor, v.pack_size, v.min_quantity, v.max_quantity, v.rounding_rule::ioe_rounding_rule, v.rationale, 'active'
FROM (VALUES
('hygiene-thuis-72u','handhygiene','handgel','primary','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een handgel per huishouden.'),
('hygiene-thuis-72u','handhygiene','basiszeep','backup','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een basiszeep als ondersteunende reiniging.'),
('hygiene-thuis-72u','basishygiene-reiniging','hygienedoekjes','primary','per_person_per_day','packs',0,4,4,1,20,1,NULL,'pack_size','Vier doekjes per persoon per dag, afgerond naar 20 stuks per pack.'),
('hygiene-thuis-72u','basishygiene-reiniging','basiszeep','backup','fixed','stuks',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een basiszeep als ondersteuning bij basishygiene.'),
('noodsanitatie-thuis-72u','noodtoilet-72u','noodtoiletzakken','primary','per_person_per_day','packs',0,2,2,1,10,1,NULL,'pack_size','Twee toiletzakken per persoon per dag, afgerond naar 10 stuks per pack.'),
('noodsanitatie-thuis-72u','sanitatie-absorptie-afsluiting','sanitair-absorptiemiddel','accessory','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een absorber-pack wanneer sanitatie vereist is.'),
('noodsanitatie-thuis-72u','sanitatie-absorptie-afsluiting','toiletpapier','backup','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een toiletpapierpack voor de POC-duur.'),
('afvalbeheer-thuis-72u','afval-insluiten','vuilniszakken','primary','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een pack vuilniszakken voor tijdelijke containment.'),
('afvalbeheer-thuis-72u','afval-scheiden','zipbags','accessory','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een pack zipbags voor klein afval.'),
('afvalbeheer-thuis-72u','handbescherming','nitril-handschoenen','accessory','fixed','pack',1,NULL,NULL,NULL,NULL,1,1,'ceil','Een pack nitril handschoenen; deduped met accessory requirements.')
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
('handgel','handgel-basis','IOE-HANDGEL-BASIC','basis',78,'Basis handgel.'),
('handgel','handgel-basis-plus','IOE-HANDGEL-PLUS','basis_plus',88,'Basis+ handgel, grotere verpakking.'),
('hygienedoekjes','hygienedoekjes-basis','IOE-HYGIENE-WIPES-BASIC','basis',78,'Basis doekjes 20 stuks.'),
('hygienedoekjes','hygienedoekjes-basis-plus','IOE-HYGIENE-WIPES-PLUS','basis_plus',88,'Basis+ doekjes 40 stuks.'),
('basiszeep','basiszeep-basis','IOE-SOAP-BASIC','basis',76,'Basiszeep.'),
('basiszeep','basiszeep-basis-plus','IOE-SOAP-PLUS','basis_plus',86,'Basis+ zeep.'),
('noodtoiletzakken','noodtoiletzakken-basis','IOE-TOILET-BAGS-BASIC','basis',78,'Basis noodtoiletzakken.'),
('noodtoiletzakken','noodtoiletzakken-basis-plus','IOE-TOILET-BAGS-PLUS','basis_plus',88,'Basis+ noodtoiletzakken.'),
('sanitair-absorptiemiddel','sanitair-absorptiemiddel-basis','IOE-ABSORBENT-BASIC','basis',76,'Basis absorber.'),
('sanitair-absorptiemiddel','sanitair-absorptiemiddel-basis-plus','IOE-ABSORBENT-PLUS','basis_plus',86,'Basis+ absorber.'),
('toiletpapier','toiletpapier-basis','IOE-TOILET-PAPER-BASIC','basis',76,'Basis toiletpapier.'),
('toiletpapier','toiletpapier-basis-plus','IOE-TOILET-PAPER-PLUS','basis_plus',86,'Basis+ toiletpapier.'),
('vuilniszakken','vuilniszakken-basis','IOE-WASTE-BAGS-BASIC','basis',76,'Basis vuilniszakken.'),
('vuilniszakken','vuilniszakken-basis-plus','IOE-WASTE-BAGS-PLUS','basis_plus',86,'Basis+ vuilniszakken.'),
('zipbags','zipbags-basis','IOE-ZIPBAGS-BASIC','basis',76,'Basis zipbags.'),
('zipbags','zipbags-basis-plus','IOE-ZIPBAGS-PLUS','basis_plus',86,'Basis+ zipbags.'),
('nitril-handschoenen','nitril-handschoenen-basis','IOE-GLOVES-NITRILE-BASIC','basis',76,'Basis nitril handschoenen.'),
('nitril-handschoenen','nitril-handschoenen-basis-plus','IOE-GLOVES-NITRILE-PLUS','basis_plus',86,'Basis+ nitril handschoenen.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN product_variant pv ON pv.product_type_id=pt.id AND pv.slug=v.variant_slug
JOIN item i ON i.sku=v.sku
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO item_accessory_requirement (item_id, required_product_type_id, required_capability_id, quantity_base, is_mandatory, reason, status)
SELECT parent.id, rpt.id, c.id, v.quantity_base, true, v.reason, 'active'
FROM (VALUES
('IOE-TOILET-BAGS-BASIC','sanitair-absorptiemiddel','sanitair-absorberen',1,'Absorber vereist bij Basis noodtoiletzakken.'),
('IOE-TOILET-BAGS-BASIC','nitril-handschoenen','wegwerp-handbescherming',1,'Nitril handschoenen vereist bij sanitatiehandling.'),
('IOE-TOILET-BAGS-PLUS','sanitair-absorptiemiddel','sanitair-absorberen',1,'Absorber vereist bij Basis+ noodtoiletzakken in deze POC-baseline.'),
('IOE-TOILET-BAGS-PLUS','nitril-handschoenen','wegwerp-handbescherming',1,'Nitril handschoenen vereist bij sanitatiehandling.'),
('IOE-WASTE-BAGS-BASIC','nitril-handschoenen','wegwerp-handbescherming',1,'Nitril handschoenen vereist bij afvalhandling.'),
('IOE-WASTE-BAGS-PLUS','nitril-handschoenen','wegwerp-handbescherming',1,'Nitril handschoenen vereist bij afvalhandling.'),
('IOE-WASTE-BAGS-BASIC','zipbags','klein-afval-afsluitbaar-bewaren',1,'Zipbags ondersteunen klein of geurend afval.'),
('IOE-WASTE-BAGS-PLUS','zipbags','klein-afval-afsluitbaar-bewaren',1,'Zipbags ondersteunen klein of geurend afval.')
) AS v(parent_sku, required_pt_slug, cap_slug, quantity_base, reason)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN capability c ON c.slug=v.cap_slug
ON CONFLICT (item_id, required_product_type_id) DO UPDATE SET required_capability_id=EXCLUDED.required_capability_id, quantity_base=EXCLUDED.quantity_base, is_mandatory=EXCLUDED.is_mandatory, reason=EXCLUDED.reason, status=EXCLUDED.status;

INSERT INTO quantity_policy (item_accessory_requirement_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT iar.id, 'fixed', v.unit, v.base_amount, v.base_amount, v.base_amount, 'ceil', v.rationale, 'active'
FROM (VALUES
('IOE-TOILET-BAGS-BASIC','sanitair-absorptiemiddel','pack',1,'Absorber Basis fixed 1 wanneer noodtoiletzakken zijn gekozen.'),
('IOE-TOILET-BAGS-BASIC','nitril-handschoenen','pack',1,'Handschoenen fixed 1 wanneer noodtoiletzakken zijn gekozen.'),
('IOE-TOILET-BAGS-PLUS','sanitair-absorptiemiddel','pack',1,'Absorber Basis+ fixed 1 wanneer noodtoiletzakken zijn gekozen.'),
('IOE-TOILET-BAGS-PLUS','nitril-handschoenen','pack',1,'Handschoenen fixed 1 wanneer noodtoiletzakken zijn gekozen.'),
('IOE-WASTE-BAGS-BASIC','nitril-handschoenen','pack',1,'Handschoenen fixed 1 wanneer afvalhandling is gekozen.'),
('IOE-WASTE-BAGS-PLUS','nitril-handschoenen','pack',1,'Handschoenen fixed 1 wanneer afvalhandling is gekozen.'),
('IOE-WASTE-BAGS-BASIC','zipbags','pack',1,'Zipbags fixed 1 wanneer afvalhandling is gekozen.'),
('IOE-WASTE-BAGS-PLUS','zipbags','pack',1,'Zipbags fixed 1 wanneer afvalhandling is gekozen.')
) AS v(parent_sku, required_pt_slug, unit, base_amount, rationale)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN item_accessory_requirement iar ON iar.item_id=parent.id AND iar.required_product_type_id=rpt.id
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.item_accessory_requirement_id=iar.id AND qp.status='active');

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, 70, true, now(), 'active'
FROM (VALUES
('IOE-HANDGEL-BASIC','SUP-HANDGEL-BASIC',3.95),
('IOE-HANDGEL-PLUS','SUP-HANDGEL-PLUS',6.95),
('IOE-HYGIENE-WIPES-BASIC','SUP-HYGIENE-WIPES-BASIC',2.95),
('IOE-HYGIENE-WIPES-PLUS','SUP-HYGIENE-WIPES-PLUS',5.95),
('IOE-SOAP-BASIC','SUP-SOAP-BASIC',1.95),
('IOE-SOAP-PLUS','SUP-SOAP-PLUS',3.95),
('IOE-TOILET-BAGS-BASIC','SUP-TOILET-BAGS-BASIC',8.95),
('IOE-TOILET-BAGS-PLUS','SUP-TOILET-BAGS-PLUS',13.95),
('IOE-ABSORBENT-BASIC','SUP-ABSORBENT-BASIC',4.95),
('IOE-ABSORBENT-PLUS','SUP-ABSORBENT-PLUS',7.95),
('IOE-TOILET-PAPER-BASIC','SUP-TOILET-PAPER-BASIC',3.95),
('IOE-TOILET-PAPER-PLUS','SUP-TOILET-PAPER-PLUS',5.95),
('IOE-WASTE-BAGS-BASIC','SUP-WASTE-BAGS-BASIC',3.95),
('IOE-WASTE-BAGS-PLUS','SUP-WASTE-BAGS-PLUS',6.95),
('IOE-ZIPBAGS-BASIC','SUP-ZIPBAGS-BASIC',2.95),
('IOE-ZIPBAGS-PLUS','SUP-ZIPBAGS-PLUS',4.95),
('IOE-GLOVES-NITRILE-BASIC','SUP-GLOVES-NITRILE-BASIC',6.95),
('IOE-GLOVES-NITRILE-PLUS','SUP-GLOVES-NITRILE-PLUS',10.95)
) AS v(sku, supplier_sku, price_current)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO item_usage_constraint (item_id, constraint_type, severity, public_warning, internal_notes, blocks_recommendation, requires_customer_acknowledgement, status)
SELECT i.id, v.constraint_type::ioe_usage_constraint_type, v.severity::ioe_constraint_severity, v.public_warning, v.internal_notes, false, false, 'active'
FROM (VALUES
('IOE-HANDGEL-BASIC','fire_risk','warning','Brandbaar: weg houden van vuur en warmtebronnen.','Handgel alcohol/fire risk; no medical claim.'),
('IOE-HANDGEL-BASIC','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety for handgel.'),
('IOE-HANDGEL-BASIC','storage_safety','advisory','Koel, droog en volgens verpakking bewaren.','Storage note for handgel.'),
('IOE-HANDGEL-BASIC','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note for handgel.'),
('IOE-HANDGEL-BASIC','medical_claim_limit','warning','Dit is geen medische bescherming of volledige infectiepreventie.','No medical/complete infection prevention claim.'),
('IOE-HANDGEL-PLUS','fire_risk','warning','Brandbaar: weg houden van vuur en warmtebronnen.','Handgel alcohol/fire risk; no medical claim.'),
('IOE-HANDGEL-PLUS','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety for handgel.'),
('IOE-HANDGEL-PLUS','storage_safety','advisory','Koel, droog en volgens verpakking bewaren.','Storage note for handgel.'),
('IOE-HANDGEL-PLUS','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note for handgel.'),
('IOE-HANDGEL-PLUS','medical_claim_limit','warning','Dit is geen medische bescherming of volledige infectiepreventie.','No medical/complete infection prevention claim.'),
('IOE-HYGIENE-WIPES-BASIC','medical_claim_limit','warning','Reinigt praktisch, maar steriliseert niet.','No sterilization claim.'),
('IOE-HYGIENE-WIPES-BASIC','storage_safety','advisory','Verpakking sluiten en droog bewaren.','Storage note for wipes.'),
('IOE-HYGIENE-WIPES-BASIC','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note for wipes.'),
('IOE-HYGIENE-WIPES-PLUS','medical_claim_limit','warning','Reinigt praktisch, maar steriliseert niet.','No sterilization claim.'),
('IOE-HYGIENE-WIPES-PLUS','storage_safety','advisory','Verpakking sluiten en droog bewaren.','Storage note for wipes.'),
('IOE-HYGIENE-WIPES-PLUS','expiry_sensitive','advisory','Controleer houdbaarheid periodiek.','Expiry note for wipes.'),
('IOE-TOILET-BAGS-BASIC','hygiene_contamination_risk','warning','Na gebruik afsluiten en handen reinigen.','Sanitation contamination warning.'),
('IOE-TOILET-BAGS-BASIC','disposal_requirement','warning','Afvoeren volgens lokale instructies; niet bedoeld voor gevaarlijk, chemisch of medisch afval.','Disposal warning.'),
('IOE-TOILET-BAGS-BASIC','storage_safety','advisory','Droog bewaren en verpakking gesloten houden.','Storage note.'),
('IOE-TOILET-BAGS-PLUS','hygiene_contamination_risk','warning','Na gebruik afsluiten en handen reinigen.','Sanitation contamination warning.'),
('IOE-TOILET-BAGS-PLUS','disposal_requirement','warning','Afvoeren volgens lokale instructies; niet bedoeld voor gevaarlijk, chemisch of medisch afval.','Disposal warning.'),
('IOE-TOILET-BAGS-PLUS','storage_safety','advisory','Droog bewaren en verpakking gesloten houden.','Storage note.'),
('IOE-ABSORBENT-BASIC','dosage_warning','advisory','Gebruik volgens verpakking; niet mengen met onbekende chemicalien.','Absorbent product instruction note.'),
('IOE-ABSORBENT-BASIC','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety for absorbent.'),
('IOE-ABSORBENT-BASIC','storage_safety','advisory','Droog bewaren.','Storage note for absorbent.'),
('IOE-ABSORBENT-BASIC','hygiene_contamination_risk','warning','Gebruik handschoenen bij handling van gebruikt materiaal.','Contamination risk.'),
('IOE-ABSORBENT-PLUS','dosage_warning','advisory','Gebruik volgens verpakking; niet mengen met onbekende chemicalien.','Absorbent product instruction note.'),
('IOE-ABSORBENT-PLUS','child_safety','advisory','Buiten bereik van kinderen bewaren.','Child safety for absorbent.'),
('IOE-ABSORBENT-PLUS','storage_safety','advisory','Droog bewaren.','Storage note for absorbent.'),
('IOE-ABSORBENT-PLUS','hygiene_contamination_risk','warning','Gebruik handschoenen bij handling van gebruikt materiaal.','Contamination risk.'),
('IOE-WASTE-BAGS-BASIC','hygiene_contamination_risk','warning','Sluit afvalzakken goed af en vermijd contact met inhoud.','Waste handling contamination risk.'),
('IOE-WASTE-BAGS-BASIC','disposal_requirement','warning','Niet bedoeld voor gevaarlijk, chemisch of medisch afval.','Waste disposal limitation.'),
('IOE-WASTE-BAGS-PLUS','hygiene_contamination_risk','warning','Sluit afvalzakken goed af en vermijd contact met inhoud.','Waste handling contamination risk.'),
('IOE-WASTE-BAGS-PLUS','disposal_requirement','warning','Niet bedoeld voor gevaarlijk, chemisch of medisch afval.','Waste disposal limitation.'),
('IOE-ZIPBAGS-BASIC','hygiene_contamination_risk','advisory','Alleen gebruiken voor klein huishoudelijk afval, niet voor gevaarlijk afval.','Zipbag limitation.'),
('IOE-ZIPBAGS-BASIC','disposal_requirement','advisory','Afvoeren volgens lokale instructies.','Zipbag disposal note.'),
('IOE-ZIPBAGS-PLUS','hygiene_contamination_risk','advisory','Alleen gebruiken voor klein huishoudelijk afval, niet voor gevaarlijk afval.','Zipbag limitation.'),
('IOE-ZIPBAGS-PLUS','disposal_requirement','advisory','Afvoeren volgens lokale instructies.','Zipbag disposal note.'),
('IOE-GLOVES-NITRILE-BASIC','medical_claim_limit','warning','Niet steriel en geen medische bescherming.','No medical sterility claim.'),
('IOE-GLOVES-NITRILE-BASIC','hygiene_contamination_risk','warning','Na gebruik weggooien en handen reinigen.','Glove handling warning.'),
('IOE-GLOVES-NITRILE-BASIC','disposal_requirement','advisory','Afvoeren met passend huishoudelijk afval tenzij lokale instructies anders zeggen.','Glove disposal note.'),
('IOE-GLOVES-NITRILE-PLUS','medical_claim_limit','warning','Niet steriel en geen medische bescherming.','No medical sterility claim.'),
('IOE-GLOVES-NITRILE-PLUS','hygiene_contamination_risk','warning','Na gebruik weggooien en handen reinigen.','Glove handling warning.'),
('IOE-GLOVES-NITRILE-PLUS','disposal_requirement','advisory','Afvoeren met passend huishoudelijk afval tenzij lokale instructies anders zeggen.','Glove disposal note.')
) AS v(sku, constraint_type, severity, public_warning, internal_notes)
JOIN item i ON i.sku=v.sku
WHERE NOT EXISTS (
  SELECT 1 FROM item_usage_constraint iuc
  WHERE iuc.item_id=i.id AND iuc.constraint_type=v.constraint_type::ioe_usage_constraint_type AND iuc.status='active'
);

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type', v.prohibited_claim, v.allowed_framing, v.internal_rationale, v.severity::ioe_constraint_severity, 'active'
FROM (VALUES
('handgel','Beschermt tegen alle virussen of bacterien.','Handgel ondersteunt praktische handhygiene volgens productinstructie; geen volledige infectiepreventieclaim.','Prevents medical/infection overclaim.', 'blocking'),
('hygienedoekjes','Steriliseert oppervlakken.','Doekjes ondersteunen basale reiniging; geen sterilisatieclaim.','Prevents sterilization overclaim.', 'blocking'),
('noodtoiletzakken','Lost sanitatie volledig veilig op.','Noodtoiletzakken helpen toiletafval tijdelijk in te sluiten met gebruikswaarschuwingen.','Prevents full sanitation claim.', 'blocking'),
('sanitair-absorptiemiddel','Maakt toiletafval veilig om zonder bescherming te hanteren.','Absorber ondersteunt noodsanitatie; gebruik handschoenen en volg instructies.','Prevents unsafe handling claim.', 'blocking'),
('vuilniszakken','Geschikt voor alle soorten afval inclusief chemisch of medisch afval.','Vuilniszakken zijn voor tijdelijk huishoudelijk afval, niet voor gevaarlijk, chemisch of medisch afval.','Prevents hazardous waste claim.', 'blocking'),
('zipbags','Maakt verontreinigd afval veilig.','Zipbags ondersteunen klein-afvalcontainment, maar zijn geen veiligheidsoplossing voor gevaarlijk afval.','Prevents unsafe waste claim.', 'warning'),
('nitril-handschoenen','Biedt medische steriliteit of volledige infectiepreventie.','Nitril handschoenen bieden handlingbescherming binnen deze POC-framing; geen medische steriliteit.','Prevents medical PPE claim.', 'blocking')
) AS v(product_type_slug, prohibited_claim, allowed_framing, internal_rationale, severity)
JOIN product_type pt ON pt.slug=v.product_type_slug
WHERE NOT EXISTS (
  SELECT 1 FROM claim_governance_rule cgr
  WHERE cgr.rule_scope='product_type' AND cgr.product_type_id=pt.id AND cgr.prohibited_claim=v.prohibited_claim
);

COMMIT;
