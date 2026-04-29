-- Ik overleef - Contentbatch 8 Taken, profielafhankelijkheden & package-polish v1.
-- Adds content-only scenario tasks and profile-aware preparedness checks without new product modules.

BEGIN;

INSERT INTO addon (slug, name, description_public, framing_public, status, sort_order)
VALUES
('taken_profielen','Taken & profielen','Voor checks, profielafhankelijke aandachtspunten en pakketpolish zonder persoonlijke productgeneratie.','Taken en profielchecks verschijnen naast producten en helpen je pakket periodiek te herzien.','active',80)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description_public=EXCLUDED.description_public, framing_public=EXCLUDED.framing_public, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order;

INSERT INTO scenario (slug, name_internal, name_public, definition, default_duration_hours, location_scope, severity_level, status)
VALUES
('profiel-taken-thuis-72u','Profieltaken thuis 72u','Profiel en duur controleren','Controleer of de gekozen duur en huishoudsamenstelling nog kloppen voor het advies dat je ziet.',72,'home','elevated','active'),
('kinderen-voorbereiding-checks','Kinderen voorbereiding checks','Kinderen controleren','Taken voor kinderen en baby''s verschijnen als checklist, niet als automatische productmodule.',72,'home','elevated','active'),
('huisdieren-voorbereiding-checks','Huisdieren voorbereiding checks','Huisdieren controleren','Taken voor huisdieren verschijnen als checklist, niet als automatische productmodule.',72,'home','elevated','active'),
('persoonlijke-gereedheid-checks','Persoonlijke gereedheid checks','Persoonlijke checks','Persoonlijke zaken zoals medicatie, documenten, contacten, sleutels, cash en laders blijven checks en geen generieke producten.',72,'home','elevated','active'),
('pakketadvies-polish','Pakketadvies polish','Pakketadvies herzien','Taken helpen het pakket periodiek te controleren op houdbaarheid, batterijen en veranderingen in het huishouden.',72,'home','elevated','active')
ON CONFLICT (slug) DO UPDATE SET name_internal=EXCLUDED.name_internal, name_public=EXCLUDED.name_public, definition=EXCLUDED.definition, default_duration_hours=EXCLUDED.default_duration_hours, location_scope=EXCLUDED.location_scope, severity_level=EXCLUDED.severity_level, status=EXCLUDED.status;

INSERT INTO addon_scenario (addon_id, scenario_id, activation_mode, notes)
SELECT a.id, s.id, 'add', v.notes
FROM (VALUES
('taken_profielen','profiel-taken-thuis-72u','Contentbatch 8: activeert profiel- en duurchecks.'),
('taken_profielen','kinderen-voorbereiding-checks','Contentbatch 8: activeert kinderen- en babychecks als tasks.'),
('taken_profielen','huisdieren-voorbereiding-checks','Contentbatch 8: activeert huisdierenchecks als tasks.'),
('taken_profielen','persoonlijke-gereedheid-checks','Contentbatch 8: activeert persoonlijke readiness-checks zonder productitems.'),
('taken_profielen','pakketadvies-polish','Contentbatch 8: activeert package-polish en periodieke reviewtasks.')
) AS v(addon_slug, scenario_slug, notes)
JOIN addon a ON a.slug = v.addon_slug
JOIN scenario s ON s.slug = v.scenario_slug
ON CONFLICT (addon_id, scenario_id) DO UPDATE SET activation_mode=EXCLUDED.activation_mode, notes=EXCLUDED.notes;

INSERT INTO need (slug, name, category, definition, customer_explanation, content_only, status)
VALUES
('duur-profiel-check','Duur en profiel check','preparedness','Controleer of duur, volwassenen, kinderen en huisdieren nog kloppen voor de berekening.','Controleer of de gebruikte duur en huishoudsamenstelling nog aansluiten op je situatie.',true,'active'),
('kinderen-gereedheid-check','Kinderen gereedheid check','preparedness','Controleer kindgerelateerde aandachtspunten als checklist en niet als automatische productgeneratie.','Controleer, indien van toepassing, kindgerelateerde benodigdheden en afhankelijkheden.',true,'active'),
('baby-gereedheid-check','Baby gereedheid check','preparedness','Controleer babygerelateerde aandachtspunten als checklist en niet als automatische productgeneratie.','Controleer, indien van toepassing, babyspullen en verzorging apart.',true,'active'),
('huisdieren-gereedheid-check','Huisdieren gereedheid check','preparedness','Controleer huisdiergerelateerde aandachtspunten als checklist en niet als automatische productgeneratie.','Controleer, indien van toepassing, water, voer, medicatie en identificatie voor huisdieren.',true,'active'),
('persoonlijke-medicatie-check','Persoonlijke medicatie check','preparedness','De gebruiker moet persoonlijke medicatie en medische hulpmiddelen zelf controleren.','Persoonlijke medicatie blijft een persoonlijke check en wordt niet als generiek product toegevoegd.',true,'active'),
('documenten-contacten-check','Documenten en contacten check','preparedness','Controleer documenten, noodcontacten en andere persoonlijke gegevens als checklist.','Documenten en noodcontacten blijven checks en geen productitems.',true,'active'),
('sleutels-cash-laders-check','Sleutels, cash en laders check','preparedness','Controleer sleutels, contant geld en laders als persoonlijke readiness-check.','Sleutels, cash en laders blijven checklistwerk en worden niet als productitems gegenereerd.',true,'active'),
('pakketadvies-controleren','Pakketadvies controleren','preparedness','Controleer periodiek houdbaarheid, batterijen en de aansluiting van het advies op je huishouden.','Herzie het advies periodiek bij veranderingen in gezin, duur of risico''s.',true,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, customer_explanation=EXCLUDED.customer_explanation, content_only=EXCLUDED.content_only, status=EXCLUDED.status;

INSERT INTO scenario_need (scenario_id, need_id, urgency, relevance_score, default_included, customer_reason, internal_reason, duration_multiplier_allowed, household_multiplier_allowed, status)
SELECT s.id, n.id, v.urgency::ioe_urgency, v.relevance_score, true, v.customer_reason, v.internal_reason, false, false, 'active'
FROM (VALUES
('profiel-taken-thuis-72u','duur-profiel-check','critical',5,'Controleer of duur en huishoudsamenstelling nog kloppen voor het advies dat je ziet.','Task-only need; geen productregels.'),
('kinderen-voorbereiding-checks','kinderen-gereedheid-check','essential',4,'Controleer, indien van toepassing, of kinderen extra aandachtspunten hebben.','Task-only need; geen kindmodule of kinderproducten.'),
('kinderen-voorbereiding-checks','baby-gereedheid-check','supporting',3,'Controleer, indien van toepassing, of een baby extra spullen of verzorging vraagt.','Task-only need; geen babymodule of babyproducten.'),
('huisdieren-voorbereiding-checks','huisdieren-gereedheid-check','essential',4,'Controleer, indien van toepassing, water, voer, lijn of medicatie voor huisdieren.','Task-only need; geen huisdiermodule of huisdierproducten.'),
('persoonlijke-gereedheid-checks','persoonlijke-medicatie-check','essential',5,'Controleer zelf persoonlijke medicatie en medische hulpmiddelen.','Task-only need; geen medicatie-SKU''s, supplier offers of doseringsadvies.'),
('persoonlijke-gereedheid-checks','documenten-contacten-check','essential',5,'Controleer documenten, contactgegevens en bereikbaarheid van noodcontacten.','Task-only need; geen document- of contactproductitems.'),
('persoonlijke-gereedheid-checks','sleutels-cash-laders-check','essential',5,'Controleer sleutels, cash, laders en compatibiliteit van laadmiddelen.','Task-only need; geen sleutel-, cash- of laderproductitems vanuit deze batch.'),
('pakketadvies-polish','pakketadvies-controleren','essential',5,'Controleer periodiek of houdbaarheid, batterijen en huishoudaannames nog kloppen.','Task-only need; helpt package-polish zonder productgeneratie.')
) AS v(scenario_slug, need_slug, urgency, relevance_score, customer_reason, internal_reason)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
ON CONFLICT (scenario_id, need_id) DO UPDATE SET urgency=EXCLUDED.urgency, relevance_score=EXCLUDED.relevance_score, default_included=EXCLUDED.default_included, customer_reason=EXCLUDED.customer_reason, internal_reason=EXCLUDED.internal_reason, duration_multiplier_allowed=EXCLUDED.duration_multiplier_allowed, household_multiplier_allowed=EXCLUDED.household_multiplier_allowed, status=EXCLUDED.status;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('duur-en-profiel-controleren','Duur en profiel controleren','preparedness','Controleer of duur en huishoudprofiel nog kloppen voor de berekening.','task','active'),
('kinderen-voorbereiding-controleren','Kinderen voorbereiding controleren','preparedness','Controleer kindgerelateerde aandachtspunten als checklist.','task','active'),
('baby-voorbereiding-controleren','Baby voorbereiding controleren','preparedness','Controleer babygerelateerde aandachtspunten als checklist.','task','active'),
('huisdieren-voorbereiding-controleren','Huisdieren voorbereiding controleren','preparedness','Controleer huisdiergerelateerde aandachtspunten als checklist.','task','active'),
('persoonlijke-medicatie-controleren','Persoonlijke medicatie controleren','preparedness','Controleer persoonlijke medicatie en medische hulpmiddelen zelf.','task','active'),
('documenten-contacten-controleren','Documenten en contacten controleren','preparedness','Controleer documenten, contactgegevens en bereikbaarheid van noodcontacten.','task','active'),
('sleutels-cash-laders-controleren','Sleutels, cash en laders controleren','preparedness','Controleer sleutels, cash, laders en compatibiliteit daarvan.','task','active'),
('pakketadvies-periodiek-controleren','Pakketadvies periodiek controleren','preparedness','Controleer periodiek houdbaarheid, batterijen en aansluiting van het pakket op het huishouden.','task','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, v.importance::ioe_priority, v.required_strength::ioe_coverage_strength, v.weight, v.explanation
FROM (VALUES
('duur-profiel-check','duur-en-profiel-controleren','must','primary',5,'Duur en huishoudsamenstelling controleren hoort altijd bij package-polish.'),
('kinderen-gereedheid-check','kinderen-voorbereiding-controleren','must','primary',4,'Kinderen vragen eigen aandachtspunten, maar geen automatische productmodule.'),
('baby-gereedheid-check','baby-voorbereiding-controleren','should','primary',3,'Babychecks zijn checklistwerk, indien van toepassing.'),
('huisdieren-gereedheid-check','huisdieren-voorbereiding-controleren','must','primary',4,'Huisdierenchecks blijven checklistwerk, indien van toepassing.'),
('persoonlijke-medicatie-check','persoonlijke-medicatie-controleren','must','primary',5,'Persoonlijke medicatie blijft een expliciete checklist.'),
('documenten-contacten-check','documenten-contacten-controleren','must','primary',5,'Documenten en noodcontacten blijven checklistwerk.'),
('sleutels-cash-laders-check','sleutels-cash-laders-controleren','must','primary',5,'Sleutels, cash en laders blijven checklistwerk.'),
('pakketadvies-controleren','pakketadvies-periodiek-controleren','must','primary',5,'Periodieke review is nodig voor package-polish.')
) AS v(need_slug, capability_slug, importance, required_strength, weight, explanation)
JOIN need n ON n.slug = v.need_slug
JOIN capability c ON c.slug = v.capability_slug
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, minimum_real_world_fit_score, policy_notes)
SELECT sn.id, c.id, 'primary', true, false, 0, v.policy_notes
FROM (VALUES
('profiel-taken-thuis-72u','duur-profiel-check','duur-en-profiel-controleren','Task-only capability; geen productcoverage.'),
('kinderen-voorbereiding-checks','kinderen-gereedheid-check','kinderen-voorbereiding-controleren','Task-only capability; gebruik "indien van toepassing" als conditionele logica ontbreekt.'),
('kinderen-voorbereiding-checks','baby-gereedheid-check','baby-voorbereiding-controleren','Task-only capability; gebruik "indien van toepassing" als conditionele logica ontbreekt.'),
('huisdieren-voorbereiding-checks','huisdieren-gereedheid-check','huisdieren-voorbereiding-controleren','Task-only capability; geen huisdierproductmodule.'),
('persoonlijke-gereedheid-checks','persoonlijke-medicatie-check','persoonlijke-medicatie-controleren','Task-only capability; geen medicatieproduct of doseringsadvies.'),
('persoonlijke-gereedheid-checks','documenten-contacten-check','documenten-contacten-controleren','Task-only capability; geen document- of contactproductitems.'),
('persoonlijke-gereedheid-checks','sleutels-cash-laders-check','sleutels-cash-laders-controleren','Task-only capability; geen sleutel/cash/lader-productitems.'),
('pakketadvies-polish','pakketadvies-controleren','pakketadvies-periodiek-controleren','Task-only capability; periodieke package review zonder productgeneratie.')
) AS v(scenario_slug, need_slug, capability_slug, policy_notes)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
JOIN scenario_need sn ON sn.scenario_id = s.id AND sn.need_id = n.id
JOIN capability c ON c.slug = v.capability_slug
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, minimum_real_world_fit_score=EXCLUDED.minimum_real_world_fit_score, policy_notes=EXCLUDED.policy_notes;

INSERT INTO preparedness_task (scenario_need_id, task_slug, title, description_public, internal_notes, priority, is_user_specific, requires_completion, recurrence_months, status)
SELECT sn.id, v.task_slug, v.title, v.description_public, v.internal_notes, v.priority::ioe_priority, true, true, v.recurrence_months, 'active'
FROM (VALUES
('profiel-taken-thuis-72u','duur-profiel-check','duur-en-huishouden-controleren','Controleer duur en huishouden','Controleer of duur, volwassenen, kinderen en huisdieren nog kloppen voor dit advies.','Task-only: profile and duration review, no productline.','must',6),
('kinderen-voorbereiding-checks','kinderen-gereedheid-check','kinderen-benodigdheden-check','Controleer kinderen-benodigdheden','Controleer, indien van toepassing, eten, drinken, comfort, kleding, identificatie en afhankelijkheden voor kinderen.','Task-only: no child productmodule.','must',6),
('kinderen-voorbereiding-checks','baby-gereedheid-check','baby-benodigdheden-check','Controleer baby-benodigdheden','Controleer, indien van toepassing, luiers, voeding, verzorging, warmte en praktische babyspullen.','Task-only: no baby productmodule.','should',6),
('huisdieren-voorbereiding-checks','huisdieren-gereedheid-check','huisdieren-water-voer-check','Controleer huisdieren','Controleer, indien van toepassing, water, voer, identificatie, lijn/bench en noodzakelijke hulpmiddelen voor huisdieren.','Task-only: no pet food or pet medication productmodule.','must',6),
('persoonlijke-gereedheid-checks','persoonlijke-medicatie-check','persoonlijke-medicatie-controleren','Controleer persoonlijke medicatie','Controleer zelf persoonlijke medicatie, voorschriften en medische hulpmiddelen. Dit systeem geeft geen doseringsadvies en levert geen medicatieproducten.','Task-only: no personal medication product.','must',3),
('persoonlijke-gereedheid-checks','documenten-contacten-check','documenten-en-contacten-controleren','Controleer documenten en contacten','Controleer documenten, noodcontacten en bereikbaarheid van belangrijke gegevens.','Task-only: no document/contact productitems.','must',6),
('persoonlijke-gereedheid-checks','sleutels-cash-laders-check','sleutels-cash-laders-controleren','Controleer sleutels, cash en laders','Controleer reservesleutels, contant geld, laders en compatibiliteit met je huidige apparaten.','Task-only: no key/cash/charger productitems from this batch.','must',6),
('pakketadvies-polish','pakketadvies-controleren','houdbaarheid-en-batterijen-controleren','Controleer houdbaarheid en batterijen','Controleer periodiek houdbaarheid van water, voedsel, hygieneproducten en de status van batterijen of laadmiddelen.','Task-only: review existing package content and lifecycle.','should',6),
('pakketadvies-polish','pakketadvies-controleren','pakketadvies-periodiek-herzien','Herzie je pakketadvies periodiek','Herzie het pakketadvies bij veranderingen in gezinssamenstelling, duur, risicoprofiel of seizoensinvloed.','Task-only: package-polish and review.','should',6)
) AS v(scenario_slug, need_slug, task_slug, title, description_public, internal_notes, priority, recurrence_months)
JOIN scenario s ON s.slug = v.scenario_slug
JOIN need n ON n.slug = v.need_slug
JOIN scenario_need sn ON sn.scenario_id = s.id AND sn.need_id = n.id
ON CONFLICT (task_slug) DO UPDATE SET scenario_need_id=EXCLUDED.scenario_need_id, title=EXCLUDED.title, description_public=EXCLUDED.description_public, internal_notes=EXCLUDED.internal_notes, priority=EXCLUDED.priority, is_user_specific=EXCLUDED.is_user_specific, requires_completion=EXCLUDED.requires_completion, recurrence_months=EXCLUDED.recurrence_months, status=EXCLUDED.status;

COMMIT;
