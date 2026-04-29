-- Ik overleef - Contentbatch 7 Evacuatie & documenten v1.
-- Adds evacuation carry, document protection, signalling, on-the-go light/water,
-- and preparedness tasks without turning documents, cash, keys, or medication into product items.

BEGIN;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('evacuatiegereed-thuis-72u','Evacuatiegereed thuis 72u','Evacuatiegereed thuis','Een huishouden moet basisdragers, zichtbaarheid en compacte essentials klaar hebben om tijdelijk en georganiseerd te kunnen vertrekken.',72,'evacuation','elevated','active'),
('documentveiligheid-evacuatie','Documentveiligheid evacuatie','Documenten beschermd','Belangrijke papieren moeten compact en beschermd klaarstaan voor evacuatie, zonder te doen alsof ze automatisch compleet zijn.',72,'evacuation','elevated','active'),
('signalering-evacuatie','Signalering evacuatie','Signalering onderweg','Een persoon moet hoorbaar kunnen signaleren en zichtbaar zijn tijdens verplaatsing of evacuatie.',72,'evacuation','elevated','active'),
('licht-onderweg-evacuatie','Licht onderweg evacuatie','Licht onderweg','Een persoon moet onderweg handsfree licht kunnen gebruiken zonder netstroom.',72,'evacuation','elevated','active'),
('drinkwater-onderweg-evacuatie','Drinkwater onderweg evacuatie','Drinkwater meenemen','Een persoon moet drinkwater compact kunnen meenemen; filteren onderweg blijft hooguit supporting of backup.',72,'evacuation','elevated','active'),
('persoonlijke-gereedheid-evacuatie','Persoonlijke gereedheid evacuatie','Persoonlijke gereedheid','Documenten, contacten, medicatie, cash en sleutels blijven persoonlijke readiness-checks en geen generieke productregels.',72,'evacuation','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('evacuatie','Evacuatie','Voor situaties waarin je snel en georganiseerd weg moet kunnen.','Essentiele zaken compact kunnen meenemen, beschermen en periodiek controleren als je tijdelijk weg moet.','active',40)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

DELETE FROM addon_scenario ag
USING addon a, scenario s
WHERE ag.addon_id = a.id
  AND ag.scenario_id = s.id
  AND a.slug = 'evacuatie'
  AND s.slug = 'evacuatie-water-basis';

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('evacuatie','evacuatiegereed-thuis-72u','Contentbatch 7: activeert draag- en packability-logica voor evacuatie.'),
('evacuatie','documentveiligheid-evacuatie','Contentbatch 7: activeert documentbescherming en documenttasks.'),
('evacuatie','signalering-evacuatie','Contentbatch 7: activeert hoorbare signalering en zichtbaarheid onderweg.'),
('evacuatie','licht-onderweg-evacuatie','Contentbatch 7: activeert handsfree licht onderweg met cross-batch hergebruik.'),
('evacuatie','drinkwater-onderweg-evacuatie','Contentbatch 7: activeert drinkwater meenemen onderweg met cross-batch hergebruik.'),
('evacuatie','persoonlijke-gereedheid-evacuatie','Contentbatch 7: activeert persoonlijke readiness-checks als tasks, niet als productitems.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug = v.addon_slug
JOIN scenario s ON s.slug = v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('evacuatietas-dragen','Evacuatietas dragen','evacuation','De gebruiker moet een compacte draagoplossing hebben voor een evacuatieset.','We voegen een draagoplossing toe, maar de tas is niet de waarheid van de inhoud.',false,'active'),
('documenten-beschermen','Documenten beschermen','evacuation','Belangrijke papieren moeten beschermd en compact bewaard kunnen worden.','We voegen een documentenmap toe om papieren beschermd te bundelen. De documenten zelf blijven jouw checklistwerk.',false,'active'),
('documenten-checklist','Documenten checklist','preparedness','De gebruiker moet zelf controleren of identiteitsdocumenten, verzekeringspapieren en andere belangrijke papieren compleet en actueel zijn.','Documenten blijven een persoonlijke checklist en worden niet als product voor je geregeld.',true,'active'),
('hoorbaar-signaleren','Hoorbaar signaleren','evacuation','De gebruiker moet in een evacuatiecontext aandacht kunnen trekken of hoorbaar kunnen signaleren.','We voegen een eenvoudige signaaloptie toe voor noodgebruik onderweg.',false,'active'),
('zichtbaar-onderweg','Zichtbaar onderweg','evacuation','De gebruiker moet onderweg beter zichtbaar kunnen zijn.','We voegen een zichtbaarheidshulpmiddel toe, zonder veiligheid te garanderen.',false,'active'),
('licht-onderweg','Licht onderweg','evacuation','De gebruiker moet handsfree licht kunnen gebruiken tijdens verplaatsing of evacuatie.','We voegen handsfree licht toe voor praktisch bewegen en handelen onderweg.',false,'active'),
('drinkwater-meenemen-evacuatie','Drinkwater meenemen evacuatie','hydration','De gebruiker moet compact drinkwater kunnen meenemen tijdens evacuatie.','We voegen draagbare watercapaciteit toe. Een filterfles blijft een ondersteunende of backupfunctie.',false,'active'),
('persoonlijke-gereedheid-checks','Persoonlijke gereedheid checks','preparedness','Persoonlijke gereedheid zoals contacten, cash, sleutels, laders en medicatie moet als checklist terugkomen en niet als generiek product.','Persoonlijke gereedheid blijft een set checks en herinneringen, niet een automatisch productpakket.',true,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, v.urgency::ioe_urgency, v.relevance_score, true, v.customer_reason, v.internal_reason, v.duration_allowed, v.household_allowed, 'active'
FROM (VALUES
('evacuatiegereed-thuis-72u','evacuatietas-dragen','essential',5,'Een evacuatietas helpt om essentials compact mee te nemen als je weg moet.','Tas ondersteunt dragen en ordenen, maar dekt niet automatisch inhoud of volledigheid.',false,false),
('documentveiligheid-evacuatie','documenten-beschermen','essential',5,'Belangrijke papieren moeten beschermd en samen opgeborgen kunnen worden.','Documentenmap beschermt papieren, maar documentcompleetheid blijft een task/check.',false,false),
('documentveiligheid-evacuatie','documenten-checklist','essential',4,'Controleer zelf of belangrijke papieren aanwezig, actueel en gebundeld zijn.','Content-only checklist; geen documentproductregels of supplier offers.',false,false),
('signalering-evacuatie','hoorbaar-signaleren','essential',4,'Een eenvoudige noodgefluit helpt om hoorbaar te signaleren.','Signalering ondersteunt attentie trekken, geen reddingsgarantie.',false,true),
('signalering-evacuatie','zichtbaar-onderweg','essential',4,'Zichtbaarheid onderweg helpt om beter op te vallen.','Reflectie ondersteunt zichtbaarheid, maar garandeert geen veiligheid.',false,true),
('licht-onderweg-evacuatie','licht-onderweg','critical',5,'Handsfree licht helpt om in het donker praktisch te bewegen en te handelen.','Hergebruik bestaande hoofdlamp-items; geen nieuwe lichtarchitectuur.',false,true),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','critical',5,'Bij evacuatie moet je compact drinkwater kunnen meenemen.','Hergebruik bestaande drinkfles- en filterfles-items; filterfunctie blijft backup/supporting.',false,true),
('persoonlijke-gereedheid-evacuatie','persoonlijke-gereedheid-checks','essential',5,'Documenten, contacten, sleutels, cash, laders en medicatie moeten als persoonlijke readiness-check terugkomen.','Content-only tasks; geen productitems voor documenten, cash, sleutels of medicatie.',false,false)
) AS v(scenario_slug, need_slug, urgency, relevance_score, customer_reason, internal_reason, duration_allowed, household_allowed)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('evacuatietas-gebruiken','Evacuatietas gebruiken','evacuation','Essentials compact kunnen dragen en bundelen in een evacuatiecontext.','stuks','active'),
('documenten-waterdicht-bewaren','Documenten waterdicht bewaren','evacuation','Belangrijke papieren beschermd en waterbestendiger kunnen bewaren.','stuks','active'),
('documenten-checklist-bijhouden','Documenten checklist bijhouden','preparedness','Belangrijke papieren periodiek controleren en bundelen als persoonlijke taak.','task','active'),
('hoorbaar-signaleren','Hoorbaar signaleren','evacuation','Aandacht kunnen trekken met een hoorbaar signaalmiddel.','stuks','active'),
('reflecterend-zichtbaar-zijn','Reflecterend zichtbaar zijn','evacuation','Beter zichtbaar zijn door reflectie of opvallende zichtbaarheid.','stuks','active'),
('handsfree-licht-onderweg','Handsfree licht onderweg','evacuation','Handsfree licht kunnen gebruiken tijdens verplaatsing of evacuatie.','stuks','active'),
('draagbaar-licht-onderweg','Draagbaar licht onderweg','evacuation','Een draagbare lichtfunctie beschikbaar hebben tijdens verplaatsing.','stuks','active'),
('water-filteren-onderweg-backup','Water filteren onderweg backup','hydration','Onderweg beperkte filterondersteuning hebben volgens productspecificatie, zonder universele veiligheidsclaim.','stuks','active'),
('persoonlijke-gereedheid-checklist','Persoonlijke gereedheid checklist','preparedness','Persoonlijke evacuatiechecks periodiek uitvoeren.','task','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('evacuatietas-dragen','evacuatietas-gebruiken','must','primary',5,'Een draagoplossing is nodig om spullen compact mee te nemen.'),
('documenten-beschermen','documenten-waterdicht-bewaren','must','primary',5,'Belangrijke papieren moeten beschermd opgeborgen kunnen worden.'),
('documenten-checklist','documenten-checklist-bijhouden','must','primary',5,'Documentcompleetheid en actualiteit blijven checklistwerk.'),
('hoorbaar-signaleren','hoorbaar-signaleren','must','primary',4,'Een hoorbare signaaloptie ondersteunt evacuatiegereedheid.'),
('zichtbaar-onderweg','reflecterend-zichtbaar-zijn','must','primary',4,'Reflectie ondersteunt zichtbaarheid onderweg.'),
('licht-onderweg','handsfree-licht-onderweg','must','primary',5,'Handsfree licht is de primaire lichtoplossing onderweg.'),
('licht-onderweg','draagbaar-licht-onderweg','should','secondary',3,'Draagbaar licht kan ondersteunend zijn, maar handsfree licht is leidend.'),
('drinkwater-meenemen-evacuatie','drinkwater-meenemen','must','primary',5,'Draagbare watercapaciteit is nodig om water mee te nemen.'),
('drinkwater-meenemen-evacuatie','water-filteren-onderweg-backup','should','backup',3,'Filteren onderweg is ondersteunend of backup, geen basisdekking.'),
('persoonlijke-gereedheid-checks','persoonlijke-gereedheid-checklist','must','primary',5,'Persoonlijke readiness blijft een checklist, geen generieke productdekking.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug = v.need_slug
JOIN capability c ON c.slug = v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, v.required_strength::ioe_coverage_strength, true, v.can_replace_dedicated_item, v.minimum_fit, v.policy_notes
FROM (VALUES
('evacuatiegereed-thuis-72u','evacuatietas-dragen','evacuatietas-gebruiken','primary',false,70,'Tas is een draag- en packability-oplossing; geen inhoudsclaim.'),
('documentveiligheid-evacuatie','documenten-beschermen','documenten-waterdicht-bewaren','primary',false,70,'Documentenmap beschermt en bundelt papieren, maar maakt ze niet automatisch compleet.'),
('documentveiligheid-evacuatie','documenten-checklist','documenten-checklist-bijhouden','primary',false,0,'Task/content-only; geen productcoverage.'),
('signalering-evacuatie','hoorbaar-signaleren','hoorbaar-signaleren','primary',false,70,'Fluit ondersteunt signalering, geen reddingsgarantie.'),
('signalering-evacuatie','zichtbaar-onderweg','reflecterend-zichtbaar-zijn','primary',false,70,'Reflectie ondersteunt zichtbaarheid, geen veiligheids- of reddingsgarantie.'),
('licht-onderweg-evacuatie','licht-onderweg','handsfree-licht-onderweg','primary',false,75,'Handsfree licht is de primaire lichtlogica onderweg.'),
('licht-onderweg-evacuatie','licht-onderweg','draagbaar-licht-onderweg','secondary',false,70,'Draagbaar licht blijft ondersteunend ten opzichte van handsfree licht.'),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','drinkwater-meenemen','primary',true,80,'Draagbare watercapaciteit is primaire evacuatiewaterdekking.'),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','water-filteren-onderweg-backup','backup',false,70,'Filteren onderweg is supporting/backup en vervangt geen waterbasis.'),
('persoonlijke-gereedheid-evacuatie','persoonlijke-gereedheid-checks','persoonlijke-gereedheid-checklist','primary',false,0,'Task/content-only; geen productcoverage voor contacten, cash, sleutels of medicatie.')
) AS v(scenario_slug, need_slug, capability_slug, required_strength, can_replace_dedicated_item, minimum_fit, policy_notes)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
JOIN scenario_need sn ON sn.scenario_id = s.id AND sn.need_id = n.id
JOIN capability c ON c.slug = v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('evacuatietas','Evacuatietas','evacuation','Compacte tas om een evacuatieset praktisch te dragen en ordenen.','durable',NULL,true,'active'),
('waterdichte-documentenmap','Waterdichte documentenmap','evacuation','Compacte map of pouch om belangrijke papieren beter beschermd te bewaren.','durable',NULL,false,'active'),
('noodfluit','Noodfluit','evacuation','Compact signaalmiddel om hoorbaar te signaleren.','durable',NULL,false,'active'),
('reflectievest','Reflectievest','evacuation','Eenvoudig zichtbaarheidshulpmiddel voor onderweg.','durable',NULL,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('evacuatietas','evacuatietas-gebruiken','primary','inherent','Tas ondersteunt dragen, ordenen en packability.'),
('waterdichte-documentenmap','documenten-waterdicht-bewaren','primary','verified_spec','Map of pouch ondersteunt documentbescherming.'),
('noodfluit','hoorbaar-signaleren','primary','inherent','Fluit ondersteunt hoorbare signalering.'),
('reflectievest','reflecterend-zichtbaar-zijn','primary','inherent','Vest ondersteunt zichtbaarheid door reflectie.'),
('hoofdlamp','handsfree-licht-onderweg','primary','verified_spec','Hergebruik hoofdlamp voor handsfree licht onderweg.'),
('hoofdlamp','draagbaar-licht-onderweg','secondary','verified_spec','Hoofdlamp geldt ook als draagbare lichtfunctie.'),
('waterfilterfles','water-filteren-onderweg-backup','secondary','manufacturer_claim','Filterfles ondersteunt filteren onderweg volgens productspecificatie.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug = v.product_type_slug
JOIN capability c ON c.slug = v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, v.module_scope::ioe_location_scope, v.tier_slug, t.id, v.compactness_required, 'active'
FROM (VALUES
('evacuatietas','evacuatietas-basis','Evacuatietas Basis','evacuation','basis',true),
('evacuatietas','evacuatietas-basis-plus','Evacuatietas Basis+','evacuation','basis_plus',true),
('waterdichte-documentenmap','documentenmap-evacuatie-basis','Documentenmap evacuatie Basis','evacuation','basis',true),
('waterdichte-documentenmap','documentenmap-evacuatie-basis-plus','Documentenmap evacuatie Basis+','evacuation','basis_plus',true),
('noodfluit','noodfluit-evacuatie-basis','Noodfluit evacuatie Basis','evacuation','basis',true),
('noodfluit','noodfluit-evacuatie-basis-plus','Noodfluit evacuatie Basis+','evacuation','basis_plus',true),
('reflectievest','reflectievest-evacuatie-basis','Reflectievest evacuatie Basis','evacuation','basis',true),
('reflectievest','reflectievest-evacuatie-basis-plus','Reflectievest evacuatie Basis+','evacuation','basis_plus',true),
('hoofdlamp','hoofdlamp-evacuatie-basis','Hoofdlamp evacuatie Basis','evacuation','basis',true),
('hoofdlamp','hoofdlamp-evacuatie-basis-plus','Hoofdlamp evacuatie Basis+','evacuation','basis_plus',true)
) AS v(product_type_slug, slug, name, module_scope, tier_slug, compactness_required)
JOIN product_type pt ON pt.slug = v.product_type_slug
JOIN tier t ON t.slug = v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, false, 'active'
FROM (VALUES
('evacuatietas','CarrySafe','Go Bag Basic','CarrySafe evacuatietas basis','IOE-EVAC-BAG-BASIC',76,78,78),
('evacuatietas','CarrySafe','Go Bag Plus','CarrySafe evacuatietas plus','IOE-EVAC-BAG-PLUS',88,90,90),
('waterdichte-documentenmap','DryCarry','Doc Folder Basic','DryCarry waterdichte documentenmap basis','IOE-DOC-FOLDER-BASIC',78,78,78),
('waterdichte-documentenmap','DryCarry','Doc Folder Plus','DryCarry waterdichte documentenmap plus','IOE-DOC-FOLDER-PLUS',88,88,88),
('noodfluit','SignalSafe','Whistle Basic','SignalSafe noodfluit basis','IOE-WHISTLE-BASIC',74,78,78),
('noodfluit','SignalSafe','Whistle Plus','SignalSafe noodfluit plus','IOE-WHISTLE-PLUS',84,88,88),
('reflectievest','VisibleNow','Vest Basic','VisibleNow reflectievest basis','IOE-REFLECTIVE-VEST-BASIC',74,76,76),
('reflectievest','VisibleNow','Vest Plus','VisibleNow reflectievest plus','IOE-REFLECTIVE-VEST-PLUS',84,88,88)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score)
JOIN product_type pt ON pt.slug = v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit_score, v.notes
FROM (VALUES
('IOE-EVAC-BAG-BASIC','evacuatietas-gebruiken','primary','verified_spec',true,78,'Evacuatietas ondersteunt dragen en packability; geen inhoudscoverage.'),
('IOE-EVAC-BAG-PLUS','evacuatietas-gebruiken','primary','verified_spec',true,90,'Betere evacuatietas voor dragen en ordenen; geen inhoudscoverage.'),
('IOE-DOC-FOLDER-BASIC','documenten-waterdicht-bewaren','primary','verified_spec',true,78,'Documentenmap beschermt papieren, maar de documenten zelf blijven checklistwerk.'),
('IOE-DOC-FOLDER-PLUS','documenten-waterdicht-bewaren','primary','verified_spec',true,88,'Betere documentenmap voor bundeling en bescherming; geen documentcompleetheidsclaim.'),
('IOE-WHISTLE-BASIC','hoorbaar-signaleren','primary','verified_spec',true,78,'Compacte fluit voor hoorbaar signaleren.'),
('IOE-WHISTLE-PLUS','hoorbaar-signaleren','primary','verified_spec',true,88,'Robuustere fluit voor hoorbaar signaleren.'),
('IOE-REFLECTIVE-VEST-BASIC','reflecterend-zichtbaar-zijn','primary','verified_spec',true,76,'Reflectievest ondersteunt zichtbaarheid onderweg.'),
('IOE-REFLECTIVE-VEST-PLUS','reflecterend-zichtbaar-zijn','primary','verified_spec',true,88,'Betere zichtbaarheid via reflectievest; geen veiligheids- of reddingsgarantie.'),
('IOE-HEADLAMP-AAA-BASIC','handsfree-licht-onderweg','primary','verified_spec',true,80,'Hergebruik bestaande hoofdlamp voor handsfree licht onderweg.'),
('IOE-HEADLAMP-AAA-BASIC','draagbaar-licht-onderweg','secondary','verified_spec',false,76,'Hoofdlamp geldt ook als draagbare lichtfunctie.'),
('IOE-HEADLAMP-AAA-PLUS','handsfree-licht-onderweg','primary','verified_spec',true,90,'Betere hoofdlamp voor handsfree licht onderweg.'),
('IOE-HEADLAMP-AAA-PLUS','draagbaar-licht-onderweg','secondary','verified_spec',false,86,'Hoofdlamp geldt ook als draagbare lichtfunctie.'),
('IOE-FILTERBOTTLE-PLUS','water-filteren-onderweg-backup','secondary','assumed',false,75,'Filterfles ondersteunt filteren onderweg volgens productspecificatie; geen universele waterveiligheidsclaim.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit_score, notes)
JOIN item i ON i.sku = v.sku
JOIN capability c ON c.slug = v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, v.role::ioe_product_role, v.priority::ioe_priority, v.quantity_base::numeric, v.quantity_per_adult::numeric, v.quantity_per_child::numeric, v.min_quantity::integer, v.max_quantity::integer, false, v.explanation, 'active'
FROM (VALUES
('evacuatiegereed-thuis-72u','evacuatietas-dragen','evacuatietas','primary','must',1,0,0,1,1,'Evacuatietas als draag- en packability-oplossing; geen inhoudsclaim.'),
('documentveiligheid-evacuatie','documenten-beschermen','waterdichte-documentenmap','primary','must',1,0,0,1,1,'Beschermt en bundelt belangrijke papieren; documentcompleetheid blijft task/check.'),
('signalering-evacuatie','hoorbaar-signaleren','noodfluit','primary','must',0,1,1,1,NULL,'Noodfluit per persoon voor hoorbare signalering.'),
('signalering-evacuatie','zichtbaar-onderweg','reflectievest','primary','must',0,1,1,1,NULL,'Reflectievest per persoon voor zichtbaarheid onderweg.'),
('licht-onderweg-evacuatie','licht-onderweg','hoofdlamp','primary','must',0,1,1,1,NULL,'Handsfree licht per persoon voor evacuatie of verplaatsing in het donker.'),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','drinkfles','primary','must',0,1,1,1,NULL,'Draagbare drinkfles per persoon voor water meenemen.'),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','waterfilterfles','backup','should',1,0,0,1,1,'Filterfles als supporting/backup, niet als vervanging van de basis drinkfles of waterbasis.')
) AS v(scenario_slug, need_slug, product_type_slug, role, priority, quantity_base, quantity_per_adult, quantity_per_child, min_quantity, max_quantity, explanation)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
JOIN scenario_need sn ON sn.scenario_id = s.id AND sn.need_id = n.id
JOIN product_type pt ON pt.slug = v.product_type_slug
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, quantity_per_child=EXCLUDED.quantity_per_child, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, v.formula_type::ioe_quantity_formula_type, v.unit, v.base_amount::numeric, v.adult_factor::numeric, v.child_factor::numeric, v.duration_day_factor::numeric, v.pack_size::integer, v.min_quantity::integer, v.max_quantity::integer, v.rounding_rule::ioe_rounding_rule, v.rationale, 'active'
FROM (VALUES
('evacuatiegereed-thuis-72u','evacuatietas-dragen','evacuatietas','primary','fixed','stuks',1,0,0,NULL,NULL,1,1,'ceil','Een evacuatietas per huishouden.'),
('documentveiligheid-evacuatie','documenten-beschermen','waterdichte-documentenmap','primary','fixed','stuks',1,0,0,NULL,NULL,1,1,'ceil','Een documentenmap per huishouden.'),
('signalering-evacuatie','hoorbaar-signaleren','noodfluit','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een noodfluit per persoon.'),
('signalering-evacuatie','zichtbaar-onderweg','reflectievest','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een reflectievest per persoon.'),
('licht-onderweg-evacuatie','licht-onderweg','hoofdlamp','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een hoofdlamp per persoon.'),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','drinkfles','primary','per_person','stuks',0,1,1,NULL,NULL,1,NULL,'ceil','Een drinkfles per persoon voor evacuatie-water.'),
('drinkwater-onderweg-evacuatie','drinkwater-meenemen-evacuatie','waterfilterfles','backup','fixed','stuks',1,0,0,NULL,NULL,1,1,'ceil','Een filterfles als supporting/backup in Basis+.')
) AS v(scenario_slug, need_slug, product_type_slug, role, formula_type, unit, base_amount, adult_factor, child_factor, duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule, rationale)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
JOIN scenario_need sn ON sn.scenario_id = s.id AND sn.need_id = n.id
JOIN product_type pt ON pt.slug = v.product_type_slug
JOIN scenario_need_product_rule snpr ON snpr.scenario_need_id = sn.id AND snpr.product_type_id = pt.id AND snpr.role = v.role::ioe_product_role
WHERE NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.scenario_need_product_rule_id = snpr.id AND qp.status = 'active');

INSERT INTO variant_item_candidate (product_variant_id, item_id, tier_id, fit_score, is_default_candidate, selection_notes, status)
SELECT pv.id, i.id, t.id, v.fit_score, true, v.notes, 'active'
FROM (VALUES
('evacuatietas','evacuatietas-basis','IOE-EVAC-BAG-BASIC','basis',78,'Basis evacuatietas.'),
('evacuatietas','evacuatietas-basis-plus','IOE-EVAC-BAG-PLUS','basis_plus',90,'Basis+ evacuatietas.'),
('waterdichte-documentenmap','documentenmap-evacuatie-basis','IOE-DOC-FOLDER-BASIC','basis',78,'Basis documentenmap.'),
('waterdichte-documentenmap','documentenmap-evacuatie-basis-plus','IOE-DOC-FOLDER-PLUS','basis_plus',88,'Basis+ documentenmap.'),
('noodfluit','noodfluit-evacuatie-basis','IOE-WHISTLE-BASIC','basis',78,'Basis noodfluit.'),
('noodfluit','noodfluit-evacuatie-basis-plus','IOE-WHISTLE-PLUS','basis_plus',88,'Basis+ noodfluit.'),
('reflectievest','reflectievest-evacuatie-basis','IOE-REFLECTIVE-VEST-BASIC','basis',76,'Basis reflectievest.'),
('reflectievest','reflectievest-evacuatie-basis-plus','IOE-REFLECTIVE-VEST-PLUS','basis_plus',88,'Basis+ reflectievest.'),
('hoofdlamp','hoofdlamp-evacuatie-basis','IOE-HEADLAMP-AAA-BASIC','basis',80,'Basis hoofdlamp via bestaand item.'),
('hoofdlamp','hoofdlamp-evacuatie-basis-plus','IOE-HEADLAMP-AAA-PLUS','basis_plus',90,'Basis+ hoofdlamp via bestaand item.'),
('drinkfles','drinkfles-evacuatie-basis','IOE-BOTTLE-1L-BASIC','basis',80,'Basis drinkfles via bestaand item.'),
('drinkfles','drinkfles-evacuatie-basis','IOE-BOTTLE-1L-PLUS','basis_plus',90,'Basis+ drinkfles via bestaand item.'),
('waterfilterfles','filterfles-evacuatie-basis-plus','IOE-FILTERBOTTLE-PLUS','basis_plus',86,'Basis+ filterfles als supporting/backup.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, notes)
JOIN product_type pt ON pt.slug = v.product_type_slug
JOIN product_variant pv ON pv.product_type_id = pt.id AND pv.slug = v.variant_slug
JOIN item i ON i.sku = v.sku
JOIN tier t ON t.slug = v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, 70, true, now(), 'active'
FROM (VALUES
('IOE-EVAC-BAG-BASIC','SUP-EVAC-BAG-BASIC',24.95),
('IOE-EVAC-BAG-PLUS','SUP-EVAC-BAG-PLUS',44.95),
('IOE-DOC-FOLDER-BASIC','SUP-DOC-FOLDER-BASIC',9.95),
('IOE-DOC-FOLDER-PLUS','SUP-DOC-FOLDER-PLUS',16.95),
('IOE-WHISTLE-BASIC','SUP-WHISTLE-BASIC',3.95),
('IOE-WHISTLE-PLUS','SUP-WHISTLE-PLUS',7.95),
('IOE-REFLECTIVE-VEST-BASIC','SUP-REFLECTIVE-VEST-BASIC',6.95),
('IOE-REFLECTIVE-VEST-PLUS','SUP-REFLECTIVE-VEST-PLUS',12.95)
) AS v(sku, supplier_sku, price_current)
JOIN item i ON i.sku = v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO item_usage_constraint (item_id, constraint_type, severity, public_warning, internal_notes, blocks_recommendation, requires_customer_acknowledgement, status)
SELECT i.id, v.constraint_type::ioe_usage_constraint_type, v.severity::ioe_constraint_severity, v.public_warning, v.internal_notes, false, false, 'active'
FROM (VALUES
('IOE-EVAC-BAG-BASIC','storage_safety','advisory','Controleer periodiek of de tas compleet, draagbaar en niet te zwaar is.','Packability and weight remain practical checks; no evacuation guarantee.'),
('IOE-EVAC-BAG-BASIC','child_safety','advisory','Bewaar kleine onderdelen en riemen veilig en voorkom verstrikkingsrisico voor jonge kinderen.','Straps and small parts caution.'),
('IOE-EVAC-BAG-PLUS','storage_safety','advisory','Controleer periodiek of de tas compleet, draagbaar en niet te zwaar is.','Packability and weight remain practical checks; no evacuation guarantee.'),
('IOE-EVAC-BAG-PLUS','child_safety','advisory','Bewaar kleine onderdelen en riemen veilig en voorkom verstrikkingsrisico voor jonge kinderen.','Straps and small parts caution.'),
('IOE-DOC-FOLDER-BASIC','storage_safety','advisory','Controleer periodiek of je documenten actueel en leesbaar blijven.','Privacy and document completeness remain user responsibility.'),
('IOE-DOC-FOLDER-PLUS','storage_safety','advisory','Controleer periodiek of je documenten actueel en leesbaar blijven.','Privacy and document completeness remain user responsibility.'),
('IOE-WHISTLE-BASIC','child_safety','warning','Houd de fluit buiten bereik van kleine kinderen.','Small-item safety.'),
('IOE-WHISTLE-BASIC','storage_safety','advisory','Controleer periodiek of de fluit bereikbaar en bruikbaar blijft.','No rescue guarantee; keep accessible.'),
('IOE-WHISTLE-PLUS','child_safety','warning','Houd de fluit buiten bereik van kleine kinderen.','Small-item safety.'),
('IOE-WHISTLE-PLUS','storage_safety','advisory','Controleer periodiek of de fluit bereikbaar en bruikbaar blijft.','No rescue guarantee; keep accessible.'),
('IOE-REFLECTIVE-VEST-BASIC','storage_safety','advisory','Houd het vest bereikbaar en controleer zichtbaarheid en beschadigingen periodiek.','Visibility support only; no safety guarantee.'),
('IOE-REFLECTIVE-VEST-PLUS','storage_safety','advisory','Houd het vest bereikbaar en controleer zichtbaarheid en beschadigingen periodiek.','Visibility support only; no safety guarantee.'),
('IOE-HEADLAMP-AAA-BASIC','storage_safety','advisory','Controleer periodiek batterijen en werking van de hoofdlamp.','Battery readiness for evacuation use.'),
('IOE-HEADLAMP-AAA-PLUS','storage_safety','advisory','Controleer periodiek batterijen en werking van de hoofdlamp.','Battery readiness for evacuation use.'),
('IOE-BOTTLE-1L-BASIC','hygiene_contamination_risk','advisory','Reinig en vul de drinkfles periodiek. Een drinkfles vervangt geen thuisvoorraad.','Bottle hygiene and refill remain user responsibility.'),
('IOE-BOTTLE-1L-PLUS','hygiene_contamination_risk','advisory','Reinig en vul de drinkfles periodiek. Een drinkfles vervangt geen thuisvoorraad.','Bottle hygiene and refill remain user responsibility.'),
('IOE-FILTERBOTTLE-PLUS','storage_safety','advisory','Controleer filterstatus en gebruik volgens productspecificatie.','Filter limits remain product-specific.')
) AS v(sku, constraint_type, severity, public_warning, internal_notes)
JOIN item i ON i.sku = v.sku
WHERE NOT EXISTS (
  SELECT 1
  FROM item_usage_constraint iuc
  WHERE iuc.item_id = i.id
    AND iuc.constraint_type = v.constraint_type::ioe_usage_constraint_type
    AND iuc.status = 'active'
);

INSERT INTO item_physical_spec (item_id, weight_grams, volume_liters, length_mm, width_mm, height_mm, packability_score, carry_method, access_priority, water_resistance_score, notes)
SELECT i.id, v.weight_grams, v.volume_liters, v.length_mm, v.width_mm, v.height_mm, v.packability_score, v.carry_method::ioe_carry_method, v.access_priority::ioe_access_priority, v.water_resistance_score, v.notes
FROM (VALUES
('IOE-EVAC-BAG-BASIC',650,18.0,450,300,180,78,'backpack','quick',40,'Basis evacuatietas voor compacte household loadout.'),
('IOE-EVAC-BAG-PLUS',900,24.0,500,330,200,86,'backpack','quick',55,'Betere evacuatietas met meer draagcomfort; geen inhoudsclaim.'),
('IOE-DOC-FOLDER-BASIC',180,0.8,250,180,25,88,'backpack','quick',70,'Documentenmap voor bundelen en beschermen van papieren.'),
('IOE-DOC-FOLDER-PLUS',220,1.0,260,190,30,90,'backpack','quick',82,'Robuustere documentenmap/pouch.'),
('IOE-WHISTLE-BASIC',20,0.05,60,20,15,96,'on_body','immediate',30,'Compacte noodfluit.'),
('IOE-WHISTLE-PLUS',28,0.06,65,22,16,96,'on_body','immediate',40,'Robuustere noodfluit.'),
('IOE-REFLECTIVE-VEST-BASIC',140,0.7,220,180,30,86,'backpack','quick',25,'Compact reflectievest voor zichtbaarheid.'),
('IOE-REFLECTIVE-VEST-PLUS',190,0.9,240,190,35,84,'backpack','quick',30,'Beter reflectievest voor zichtbaarheid.'),
('IOE-HEADLAMP-AAA-BASIC',95,0.2,80,50,45,92,'on_body','immediate',35,'Bestaande hoofdlamp krijgt evacuation physical spec.'),
('IOE-HEADLAMP-AAA-PLUS',110,0.25,85,55,45,92,'on_body','immediate',40,'Bestaande hoofdlamp plus krijgt evacuation physical spec.'),
('IOE-BOTTLE-1L-BASIC',150,1.0,260,75,75,82,'backpack','quick',70,'1L drinkfles voor evacuatie-water test.'),
('IOE-BOTTLE-1L-PLUS',180,1.0,260,78,78,88,'backpack','quick',80,'Robuuste 1L drinkfles voor evacuatie-water test.'),
('IOE-FILTERBOTTLE-PLUS',220,1.0,270,80,80,84,'backpack','quick',80,'1L filterfles; filterclaim blijft productspecificatie.')
) AS v(sku, weight_grams, volume_liters, length_mm, width_mm, height_mm, packability_score, carry_method, access_priority, water_resistance_score, notes)
JOIN item i ON i.sku = v.sku
ON CONFLICT (item_id) DO UPDATE SET weight_grams=EXCLUDED.weight_grams, volume_liters=EXCLUDED.volume_liters, length_mm=EXCLUDED.length_mm, width_mm=EXCLUDED.width_mm, height_mm=EXCLUDED.height_mm, packability_score=EXCLUDED.packability_score, carry_method=EXCLUDED.carry_method, access_priority=EXCLUDED.access_priority, water_resistance_score=EXCLUDED.water_resistance_score, notes=EXCLUDED.notes;

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type', v.prohibited_claim, v.allowed_framing, v.internal_rationale, v.severity::ioe_constraint_severity, 'active'
FROM (VALUES
('evacuatietas','Alles wat je nodig hebt zit automatisch in deze tas.','Evacuatietas ondersteunt dragen en ordenen; inhoud blijft afhankelijk van scenario''s, needs, productregels en checks.','Prevents bag-as-package-truth claim.','blocking'),
('evacuatietas','Garandeert een veilige evacuatie.','Evacuatietas is een draagoplossing en geen veiligheids- of reddingsgarantie.','Prevents evacuation guarantee claim.','blocking'),
('waterdichte-documentenmap','Documenten zijn automatisch compleet of onder alle omstandigheden waterdicht.','Documentenmap beschermt en bundelt papieren, maar documentcompleetheid en actuele inhoud blijven checklistwerk.','Prevents automatic document completeness/waterproof claim.','warning'),
('noodfluit','Garandeert redding of directe hulp.','Noodfluit ondersteunt hoorbare signalering en aandacht trekken; geen reddingsgarantie.','Prevents rescue guarantee claim.','blocking'),
('reflectievest','Maakt je altijd zichtbaar of veilig.','Reflectievest ondersteunt zichtbaarheid, maar geen veiligheidsgarantie.','Prevents safety/visibility guarantee claim.','blocking'),
('hoofdlamp','Garandeert veilige evacuatie in het donker.','Hoofdlamp ondersteunt praktisch licht en zicht op korte afstand; geen veiligheids- of routegarantie.','Prevents safe evacuation guarantee from lighting.','warning'),
('drinkfles','Vervangt je thuisvoorraad drinkwater.','Drinkfles ondersteunt water meenemen onderweg; thuisvoorraad vraagt aparte drinkwaterlogica.','Prevents bottle-as-home-water claim.','warning'),
('waterfilterfles','Filtert elk water automatisch veilig.','Filterfles ondersteunt meenemen en beperkte filterfunctie volgens productspecificatie; geen universele veiligheidsclaim.','Prevents universal filter safety claim.','blocking')
) AS v(product_type_slug, prohibited_claim, allowed_framing, internal_rationale, severity)
JOIN product_type pt ON pt.slug = v.product_type_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM claim_governance_rule cgr
  WHERE cgr.rule_scope = 'product_type'
    AND cgr.product_type_id = pt.id
    AND cgr.prohibited_claim = v.prohibited_claim
);

INSERT INTO preparedness_task (scenario_need_id, task_slug, title, description_public, internal_notes, priority, is_user_specific, requires_completion, recurrence_months, status)
SELECT sn.id, v.task_slug, v.title, v.description_public, v.internal_notes, v.priority::ioe_priority, true, true, v.recurrence_months, 'active'
FROM (VALUES
('documentveiligheid-evacuatie','documenten-checklist','documenten-kopieren-en-bundelen','Bundel je documenten','Bundel kopieen of foto''s van belangrijke documenten en bewaar ze samen in je documentenmap.','Task/content-only: no document product item and no completeness auto-claim.','must',6),
('persoonlijke-gereedheid-evacuatie','persoonlijke-gereedheid-checks','noodcontacten-noteren','Noteer noodcontacten','Noteer belangrijke noodcontacten en zorg dat ze periodiek actueel blijven.','Task/content-only: contacts remain a readiness check, not a product item.','must',6),
('persoonlijke-gereedheid-evacuatie','persoonlijke-gereedheid-checks','persoonlijke-medicatie-inpakken-check','Controleer persoonlijke medicatie','Controleer zelf welke persoonlijke medicatie, voorschriften of medische hulpmiddelen je moet meenemen.','Task/content-only: no personal-medication SKU, no supplier_offer, no dosage advice.','must',3),
('persoonlijke-gereedheid-evacuatie','persoonlijke-gereedheid-checks','sleutels-cash-en-laders-check','Controleer sleutels, cash en laders','Controleer of reservesleutels, contant geld en benodigde laders klaar liggen voor vertrek.','Task/content-only: no keys/cash/chargers as generic product items.','should',6),
('persoonlijke-gereedheid-evacuatie','persoonlijke-gereedheid-checks','evacuatietas-periodiek-controleren','Controleer je evacuatietas periodiek','Controleer periodiek of je evacuatietas nog logisch is ingepakt, draagbaar blijft en actuele spullen bevat.','Task/content-only: bag remains container/carry solution, not package truth.','should',6)
) AS v(scenario_slug, need_slug, task_slug, title, description_public, internal_notes, priority, recurrence_months)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
JOIN scenario_need sn ON sn.scenario_id = s.id AND sn.need_id = n.id
ON CONFLICT (task_slug) DO UPDATE SET scenario_need_id=EXCLUDED.scenario_need_id, title=EXCLUDED.title, description_public=EXCLUDED.description_public, internal_notes=EXCLUDED.internal_notes, priority=EXCLUDED.priority, is_user_specific=EXCLUDED.is_user_specific, requires_completion=EXCLUDED.requires_completion, recurrence_months=EXCLUDED.recurrence_months, status=EXCLUDED.status;

COMMIT;
