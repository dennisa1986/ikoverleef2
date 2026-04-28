-- Ik overleef - Contentbatch 1 Stroomuitval v1.
-- Extends the existing Stroomuitval POC with Basis/Basis+ tier candidates,
-- non-default weak-claim items, and optional/supporting flashlight masterdata.

BEGIN;

INSERT INTO capability (slug, name, category, definition, measurable_unit, status)
VALUES
('gericht-licht-geven','Gericht licht geven','light','Een specifieke plek, route of object gericht kunnen verlichten.','lumen','active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, measurable_unit=EXCLUDED.measurable_unit, status=EXCLUDED.status;

INSERT INTO need_capability (need_id, capability_id, importance, default_required_strength, weight, explanation)
SELECT n.id, c.id, 'could', 'backup', 2, 'Een zaklamp kan nuttig zijn als extra gerichte lichtbron, maar vervangt hoofdlamp of lantaarn niet.'
FROM need n
JOIN capability c ON c.slug='gericht-licht-geven'
WHERE n.slug='lichtzekerheid'
ON CONFLICT (need_id, capability_id) DO UPDATE SET importance=EXCLUDED.importance, default_required_strength=EXCLUDED.default_required_strength, weight=EXCLUDED.weight, explanation=EXCLUDED.explanation;

INSERT INTO scenario_need_capability_policy (scenario_need_id, capability_id, required_strength, can_be_combined, can_replace_dedicated_item, policy_notes)
SELECT sn.id, c.id, 'backup', true, false, 'Zaklamp is supporting/backup en vervangt geen hoofdlamp of lantaarn.'
FROM scenario_need sn
JOIN scenario s ON s.id=sn.scenario_id AND s.slug='stroomuitval-thuis'
JOIN need n ON n.id=sn.need_id AND n.slug='lichtzekerheid'
JOIN capability c ON c.slug='gericht-licht-geven'
ON CONFLICT (scenario_need_id, capability_id) DO UPDATE SET required_strength=EXCLUDED.required_strength, can_be_combined=EXCLUDED.can_be_combined, can_replace_dedicated_item=EXCLUDED.can_replace_dedicated_item, policy_notes=EXCLUDED.policy_notes;

INSERT INTO product_type (slug, name, category, definition, lifecycle_type, default_replacement_months, is_container_or_kit, status)
VALUES
('zaklamp','Zaklamp','light','Handheld lichtbron voor gerichte verlichting bij stroomuitval.','durable',NULL,false,'active')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, definition=EXCLUDED.definition, lifecycle_type=EXCLUDED.lifecycle_type, default_replacement_months=EXCLUDED.default_replacement_months, is_container_or_kit=EXCLUDED.is_container_or_kit, status=EXCLUDED.status;

INSERT INTO product_type_capability (product_type_id, capability_id, default_coverage_strength, claim_basis, notes)
SELECT pt.id, c.id, v.strength::ioe_coverage_strength, v.claim_basis, v.notes
FROM (VALUES
('zaklamp','gericht-licht-geven','primary','inherent','Zaklamp geeft gericht licht, maar is supporting/optional.'),
('zaklamp','zonder-netstroom-functioneren','primary','typical','Zaklamp werkt zonder netstroom op batterijen.')
) AS v(product_type_slug, capability_slug, strength, claim_basis, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (product_type_id, capability_id) DO UPDATE SET default_coverage_strength=EXCLUDED.default_coverage_strength, claim_basis=EXCLUDED.claim_basis, notes=EXCLUDED.notes;

INSERT INTO product_variant (product_type_id, slug, name, module_scope, tier_minimum, tier_minimum_id, compactness_required, status)
SELECT pt.id, v.slug, v.name, 'home', v.tier_slug, t.id, false, 'active'
FROM (VALUES
('powerbank','stroomuitval-telefoon-basis','basis','Powerbank telefoonladen Basis'),
('powerbank','stroomuitval-telefoon-basis-plus','basis_plus','Powerbank telefoonladen Basis+'),
('hoofdlamp','handsfree-thuis-basis','basis','Hoofdlamp handsfree thuis Basis'),
('hoofdlamp','handsfree-thuis-basis-plus','basis_plus','Hoofdlamp handsfree thuis Basis+'),
('led-lantaarn','ruimteverlichting-thuis-basis','basis','LED-lantaarn ruimteverlichting thuis Basis'),
('led-lantaarn','ruimteverlichting-thuis-basis-plus','basis_plus','LED-lantaarn ruimteverlichting thuis Basis+'),
('noodradio','informatie-thuis-basis','basis','Noodradio informatie thuis Basis'),
('noodradio','informatie-thuis-basis-plus','basis_plus','Noodradio informatie thuis Basis+'),
('aa-batterijen','aa-pack-basis','basis','AA-batterijen pack Basis'),
('aa-batterijen','aa-pack-basis-plus','basis_plus','AA-batterijen pack Basis+'),
('aaa-batterijen','aaa-pack-basis','basis','AAA-batterijen pack Basis'),
('aaa-batterijen','aaa-pack-basis-plus','basis_plus','AAA-batterijen pack Basis+'),
('usb-c-kabelset','powerbank-accessoire-basis','basis','USB-C kabelset accessoire Basis'),
('usb-c-kabelset','powerbank-accessoire-basis-plus','basis_plus','USB-C kabelset accessoire Basis+'),
('zaklamp','gericht-licht-thuis-optioneel','basis','Zaklamp gericht licht thuis optioneel')
) AS v(product_type_slug, slug, tier_slug, name)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_type_id, slug) DO UPDATE SET name=EXCLUDED.name, module_scope=EXCLUDED.module_scope, tier_minimum=EXCLUDED.tier_minimum, tier_minimum_id=EXCLUDED.tier_minimum_id, compactness_required=EXCLUDED.compactness_required, status=EXCLUDED.status;

INSERT INTO item (product_type_id, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only, status)
SELECT pt.id, v.brand, v.model, v.title, v.sku, v.quality_score, v.reliability_score, v.real_world_fit_score, v.is_accessory_only, 'active'
FROM (VALUES
('powerbank','ChargeStrong','10K USB-C','ChargeStrong powerbank 10.000 mAh USB-C','IOE-PB-10K-BASIC',76,78,78,false),
('powerbank','ChargeStrong','20K USB-C PD','ChargeStrong powerbank 20.000 mAh USB-C PD','IOE-PB-20K-PLUS',90,90,90,false),
('powerbank','SunClaim','Solar 10K','SunClaim powerbank 10.000 mAh met klein zonnepaneel','IOE-PB-SOLAR-10K',72,70,60,false),
('hoofdlamp','HeadLite','Basic AAA','HeadLite Basic hoofdlamp AAA','IOE-HEADLAMP-AAA-BASIC',74,76,78,false),
('hoofdlamp','HeadLite','Pro AAA','HeadLite Pro hoofdlamp AAA','IOE-HEADLAMP-AAA-PLUS',88,88,90,false),
('led-lantaarn','RoomLite','Basic AA','RoomLite Basic LED-lantaarn AA','IOE-LANTERN-AA-BASIC',75,76,78,false),
('led-lantaarn','RoomLite','Pro AA','RoomLite Pro LED-lantaarn AA','IOE-LANTERN-AA-PLUS',88,88,88,false),
('noodradio','InfoSafe','Basic AA','InfoSafe Basic noodradio AA','IOE-RADIO-AA-BASIC',76,78,78,false),
('noodradio','InfoSafe','Pro AA/USB','InfoSafe Pro noodradio AA/USB met lampje en zwengel','IOE-RADIO-AAUSB-PLUS',86,88,86,false),
('noodradio','InfoSafe','SolarCrank','InfoSafe SolarCrank noodradio met zonnepaneel en zwengel','IOE-RADIO-SOLAR-CRANK',72,72,65,false),
('aa-batterijen','BatterySafe','AA 12-pack standaard','BatterySafe AA-batterijen 12 stuks standaard','IOE-BATT-AA-12-BASIC',72,76,76,true),
('aa-batterijen','BatterySafe','AA 12-pack long-life','BatterySafe AA-batterijen 12 stuks long-life','IOE-BATT-AA-12',84,86,86,true),
('aaa-batterijen','BatterySafe','AAA 12-pack standaard','BatterySafe AAA-batterijen 12 stuks standaard','IOE-BATT-AAA-12-BASIC',72,76,76,true),
('aaa-batterijen','BatterySafe','AAA 12-pack long-life','BatterySafe AAA-batterijen 12 stuks long-life','IOE-BATT-AAA-12',84,86,86,true),
('usb-c-kabelset','CableReady','USB-C Basic','CableReady USB-C laadkabel basis','IOE-CABLE-USBC-BASIC',72,76,76,true),
('usb-c-kabelset','CableReady','USB-C Set','CableReady USB-C kabelset','IOE-CABLE-USBC-SET',86,88,88,true),
('zaklamp','BeamLite','Basic AA','BeamLite Basic zaklamp AA','IOE-FLASHLIGHT-AA-BASIC',74,76,76,false),
('zaklamp','BeamLite','Pro AA','BeamLite Pro zaklamp AA','IOE-FLASHLIGHT-AA-PLUS',84,86,84,false)
) AS v(product_type_slug, brand, model, title, sku, quality_score, reliability_score, real_world_fit_score, is_accessory_only)
JOIN product_type pt ON pt.slug=v.product_type_slug
ON CONFLICT (sku) DO UPDATE SET product_type_id=EXCLUDED.product_type_id, brand=EXCLUDED.brand, model=EXCLUDED.model, title=EXCLUDED.title, quality_score=EXCLUDED.quality_score, reliability_score=EXCLUDED.reliability_score, real_world_fit_score=EXCLUDED.real_world_fit_score, is_accessory_only=EXCLUDED.is_accessory_only, status=EXCLUDED.status;

INSERT INTO item_capability (item_id, capability_id, coverage_strength, claim_type, can_replace_primary, real_world_fit_score, scenario_notes)
SELECT i.id, c.id, v.strength::ioe_coverage_strength, v.claim_type::ioe_claim_type, v.can_replace_primary, v.fit, v.notes
FROM (VALUES
('IOE-PB-10K-BASIC','telefoon-opladen','primary','verified_spec',true,78,'Betaalbare voldoende basisoplossing voor telefoonladen.'),
('IOE-PB-10K-BASIC','energie-opslaan','primary','verified_spec',true,78,'10.000 mAh basis energieopslag.'),
('IOE-PB-SOLAR-10K','telefoon-opladen','primary','verified_spec',true,72,'Als opgeladen powerbank bruikbaar voor telefoonladen.'),
('IOE-PB-SOLAR-10K','energie-opslaan','primary','verified_spec',true,72,'Accufunctie bruikbaar.'),
('IOE-PB-SOLAR-10K','handmatig-energie-opwekken','comfort','manufacturer_claim',false,35,'Klein zonnepaneel is backup/comfort, niet primary.'),
('IOE-HEADLAMP-AAA-BASIC','handsfree-licht-geven','primary','verified_spec',true,78,'Voldoende basis handsfree licht.'),
('IOE-HEADLAMP-AAA-BASIC','zonder-netstroom-functioneren','primary','verified_spec',true,78,'Werkt op AAA-batterijen.'),
('IOE-LANTERN-AA-BASIC','ruimte-verlichten','primary','verified_spec',true,78,'Voldoende basis ruimteverlichting.'),
('IOE-LANTERN-AA-BASIC','zonder-netstroom-functioneren','primary','verified_spec',true,78,'Werkt op AA-batterijen.'),
('IOE-RADIO-AA-BASIC','noodinformatie-ontvangen','primary','verified_spec',true,78,'Basis informatieontvangst op AA.'),
('IOE-RADIO-AA-BASIC','zonder-netstroom-functioneren','primary','verified_spec',true,78,'Werkt op AA-batterijen.'),
('IOE-RADIO-SOLAR-CRANK','noodinformatie-ontvangen','primary','verified_spec',true,72,'Informatie bruikbaar.'),
('IOE-RADIO-SOLAR-CRANK','zonder-netstroom-functioneren','primary','verified_spec',true,70,'Batterij/zwengel fallback.'),
('IOE-RADIO-SOLAR-CRANK','orientatielicht-geven','backup','manufacturer_claim',false,60,'Geen primary licht.'),
('IOE-RADIO-SOLAR-CRANK','telefoon-opladen','backup','manufacturer_claim',false,30,'Geen primary telefoonladen.'),
('IOE-RADIO-SOLAR-CRANK','handmatig-energie-opwekken','comfort','manufacturer_claim',false,35,'Geen primary energie.'),
('IOE-BATT-AA-12-BASIC','aa-apparaten-voeden','primary','verified_spec',true,76,'Basis AA-batterijen voor AA-apparaten.'),
('IOE-BATT-AAA-12-BASIC','aaa-apparaten-voeden','primary','verified_spec',true,76,'Basis AAA-batterijen voor AAA-apparaten.'),
('IOE-CABLE-USBC-BASIC','usb-c-verbinding-maken','primary','verified_spec',true,76,'Eenvoudige USB-C laadkabel.'),
('IOE-FLASHLIGHT-AA-BASIC','gericht-licht-geven','primary','verified_spec',true,76,'Gericht licht, niet handsfree.'),
('IOE-FLASHLIGHT-AA-BASIC','zonder-netstroom-functioneren','primary','verified_spec',true,76,'Werkt op AA-batterijen.'),
('IOE-FLASHLIGHT-AA-PLUS','gericht-licht-geven','primary','verified_spec',true,84,'Betere gerichte lichtbron, niet handsfree.'),
('IOE-FLASHLIGHT-AA-PLUS','zonder-netstroom-functioneren','primary','verified_spec',true,84,'Werkt op AA-batterijen.')
) AS v(sku, capability_slug, strength, claim_type, can_replace_primary, fit, notes)
JOIN item i ON i.sku=v.sku
JOIN capability c ON c.slug=v.capability_slug
ON CONFLICT (item_id, capability_id) DO UPDATE SET coverage_strength=EXCLUDED.coverage_strength, claim_type=EXCLUDED.claim_type, can_replace_primary=EXCLUDED.can_replace_primary, real_world_fit_score=EXCLUDED.real_world_fit_score, scenario_notes=EXCLUDED.scenario_notes;

INSERT INTO scenario_need_product_rule (scenario_need_id, product_type_id, role, priority, quantity_base, quantity_per_adult, min_quantity, max_quantity, allow_multifunctional_replacement, explanation, status)
SELECT sn.id, pt.id, 'optional', 'could', 1, NULL, 1, 1, false, 'Zaklamp kan als extra gerichte lichtbron nuttig zijn, maar vervangt geen hoofdlamp of lantaarn.', 'active'
FROM scenario_need sn
JOIN scenario s ON s.id=sn.scenario_id AND s.slug='stroomuitval-thuis'
JOIN need n ON n.id=sn.need_id AND n.slug='lichtzekerheid'
JOIN product_type pt ON pt.slug='zaklamp'
ON CONFLICT (scenario_need_id, product_type_id, role) DO UPDATE SET priority=EXCLUDED.priority, quantity_base=EXCLUDED.quantity_base, quantity_per_adult=EXCLUDED.quantity_per_adult, min_quantity=EXCLUDED.min_quantity, max_quantity=EXCLUDED.max_quantity, allow_multifunctional_replacement=EXCLUDED.allow_multifunctional_replacement, explanation=EXCLUDED.explanation, status=EXCLUDED.status;

INSERT INTO quantity_policy (scenario_need_product_rule_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT snpr.id, 'fixed', 'stuks', 1, 1, 1, 'ceil', 'Optional zaklamp: fixed 1 wanneer optional output expliciet wordt ondersteund.', 'active'
FROM scenario_need_product_rule snpr
JOIN product_type pt ON pt.id=snpr.product_type_id AND pt.slug='zaklamp'
WHERE snpr.status='active'
  AND NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.scenario_need_product_rule_id=snpr.id AND qp.status='active');

INSERT INTO variant_item_candidate (product_variant_id, item_id, tier_id, fit_score, is_default_candidate, selection_notes, status)
SELECT pv.id, i.id, t.id, v.fit_score, v.is_default, v.notes, 'active'
FROM (VALUES
('powerbank','stroomuitval-telefoon-basis','IOE-PB-10K-BASIC','basis',78,true,'Basis default powerbank.'),
('usb-c-kabelset','powerbank-accessoire-basis','IOE-CABLE-USBC-BASIC','basis',76,true,'Basis default USB-C kabel.'),
('hoofdlamp','handsfree-thuis-basis','IOE-HEADLAMP-AAA-BASIC','basis',78,true,'Basis default hoofdlamp.'),
('led-lantaarn','ruimteverlichting-thuis-basis','IOE-LANTERN-AA-BASIC','basis',78,true,'Basis default lantaarn.'),
('noodradio','informatie-thuis-basis','IOE-RADIO-AA-BASIC','basis',78,true,'Basis default noodradio.'),
('aa-batterijen','aa-pack-basis','IOE-BATT-AA-12-BASIC','basis',76,true,'Basis default AA-batterijpack.'),
('aaa-batterijen','aaa-pack-basis','IOE-BATT-AAA-12-BASIC','basis',76,true,'Basis default AAA-batterijpack.'),
('powerbank','stroomuitval-telefoon-basis-plus','IOE-PB-20K-PLUS','basis_plus',92,true,'Basis+ default powerbank.'),
('usb-c-kabelset','powerbank-accessoire-basis-plus','IOE-CABLE-USBC-SET','basis_plus',88,true,'Basis+ default kabelset.'),
('hoofdlamp','handsfree-thuis-basis-plus','IOE-HEADLAMP-AAA-PLUS','basis_plus',90,true,'Basis+ default hoofdlamp.'),
('led-lantaarn','ruimteverlichting-thuis-basis-plus','IOE-LANTERN-AA-PLUS','basis_plus',90,true,'Basis+ default lantaarn.'),
('noodradio','informatie-thuis-basis-plus','IOE-RADIO-AAUSB-PLUS','basis_plus',88,true,'Basis+ default noodradio.'),
('aa-batterijen','aa-pack-basis-plus','IOE-BATT-AA-12','basis_plus',86,true,'Basis+ default AA-batterijpack.'),
('aaa-batterijen','aaa-pack-basis-plus','IOE-BATT-AAA-12','basis_plus',86,true,'Basis+ default AAA-batterijpack.'),
('powerbank','stroomuitval-telefoon-basis','IOE-PB-SOLAR-10K','basis',65,false,'Non-default: zonnepaneelclaim kan tot schijnzekerheid leiden.'),
('noodradio','informatie-thuis-basis-plus','IOE-RADIO-SOLAR-CRANK','basis_plus',65,false,'Non-default: zwengel/zonnepaneelclaims niet robuust genoeg.'),
('zaklamp','gericht-licht-thuis-optioneel','IOE-FLASHLIGHT-AA-BASIC','basis',76,true,'Optional/supporting zaklamp Basis.'),
('zaklamp','gericht-licht-thuis-optioneel','IOE-FLASHLIGHT-AA-PLUS','basis_plus',84,true,'Optional/supporting zaklamp Basis+.')
) AS v(product_type_slug, variant_slug, sku, tier_slug, fit_score, is_default, notes)
JOIN product_type pt ON pt.slug=v.product_type_slug
JOIN product_variant pv ON pv.product_type_id=pt.id AND pv.slug=v.variant_slug
JOIN item i ON i.sku=v.sku
JOIN tier t ON t.slug=v.tier_slug
ON CONFLICT (product_variant_id, item_id, tier_id) DO UPDATE SET fit_score=EXCLUDED.fit_score, is_default_candidate=EXCLUDED.is_default_candidate, selection_notes=EXCLUDED.selection_notes, status=EXCLUDED.status;

INSERT INTO item_accessory_requirement (item_id, required_product_type_id, required_capability_id, quantity_base, is_mandatory, reason, status)
SELECT parent.id, rpt.id, c.id, 1, true, v.reason, 'active'
FROM (VALUES
('IOE-PB-10K-BASIC','usb-c-kabelset','usb-c-verbinding-maken','Powerbank praktisch bruikbaar maken met passende USB-C kabel.'),
('IOE-HEADLAMP-AAA-BASIC','aaa-batterijen','aaa-apparaten-voeden','Hoofdlamp werkt op AAA-batterijen.'),
('IOE-LANTERN-AA-BASIC','aa-batterijen','aa-apparaten-voeden','LED-lantaarn werkt op AA-batterijen.'),
('IOE-RADIO-AA-BASIC','aa-batterijen','aa-apparaten-voeden','Noodradio werkt op AA-batterijen.'),
('IOE-FLASHLIGHT-AA-BASIC','aa-batterijen','aa-apparaten-voeden','Zaklamp werkt op AA-batterijen.'),
('IOE-FLASHLIGHT-AA-PLUS','aa-batterijen','aa-apparaten-voeden','Zaklamp werkt op AA-batterijen.')
) AS v(parent_sku, required_pt_slug, cap_slug, reason)
JOIN item parent ON parent.sku=v.parent_sku
JOIN product_type rpt ON rpt.slug=v.required_pt_slug
JOIN capability c ON c.slug=v.cap_slug
ON CONFLICT (item_id, required_product_type_id) DO UPDATE SET required_capability_id=EXCLUDED.required_capability_id, quantity_base=EXCLUDED.quantity_base, is_mandatory=EXCLUDED.is_mandatory, reason=EXCLUDED.reason, status=EXCLUDED.status;

INSERT INTO quantity_policy (item_accessory_requirement_id, formula_type, unit, base_amount, min_quantity, max_quantity, rounding_rule, rationale, status)
SELECT iar.id, 'fixed', 'pack/stuks', 1, 1, 1, 'ceil', 'Contentbatch 1: een accessoirepack per required accessory type; gedeelde AA-bronnen worden door engine gededupliceerd.', 'active'
FROM item_accessory_requirement iar
JOIN item parent ON parent.id=iar.item_id
WHERE parent.sku IN ('IOE-PB-10K-BASIC','IOE-HEADLAMP-AAA-BASIC','IOE-LANTERN-AA-BASIC','IOE-RADIO-AA-BASIC','IOE-FLASHLIGHT-AA-BASIC','IOE-FLASHLIGHT-AA-PLUS')
  AND NOT EXISTS (SELECT 1 FROM quantity_policy qp WHERE qp.item_accessory_requirement_id=iar.id AND qp.status='active');

INSERT INTO supplier_offer (item_id, supplier_name, supplier_sku, price_current, currency, availability_status, lead_time_days, margin_score, is_preferred, last_checked_at, status)
SELECT i.id, 'Eigen beheer', v.supplier_sku, v.price_current, 'EUR', 'in_stock', 2, v.margin_score, v.is_preferred, now(), 'active'
FROM (VALUES
('IOE-PB-10K-BASIC','SUP-PB-10K-BASIC',19.95,70,true),
('IOE-CABLE-USBC-BASIC','SUP-CABLE-USBC-BASIC',4.95,72,true),
('IOE-HEADLAMP-AAA-BASIC','SUP-HEADLAMP-AAA-BASIC',9.95,70,true),
('IOE-LANTERN-AA-BASIC','SUP-LANTERN-AA-BASIC',14.95,70,true),
('IOE-RADIO-AA-BASIC','SUP-RADIO-AA-BASIC',19.95,68,true),
('IOE-BATT-AA-12-BASIC','SUP-BATT-AA-12-BASIC',4.95,65,true),
('IOE-BATT-AAA-12-BASIC','SUP-BATT-AAA-12-BASIC',4.95,65,true),
('IOE-PB-20K-PLUS','SUP-PB-20K-PLUS',39.95,70,true),
('IOE-CABLE-USBC-SET','SUP-CABLE-USBC-SET',7.95,75,true),
('IOE-HEADLAMP-AAA-PLUS','SUP-HEADLAMP-AAA-PLUS',19.95,72,true),
('IOE-LANTERN-AA-PLUS','SUP-LANTERN-AA-PLUS',24.95,72,true),
('IOE-RADIO-AAUSB-PLUS','SUP-RADIO-AAUSB-PLUS',34.95,68,true),
('IOE-BATT-AA-12','SUP-BATT-AA-12',6.95,65,true),
('IOE-BATT-AAA-12','SUP-BATT-AAA-12',6.95,65,true),
('IOE-PB-SOLAR-10K','SUP-PB-SOLAR-10K',24.95,60,false),
('IOE-RADIO-SOLAR-CRANK','SUP-RADIO-SOLAR-CRANK',29.95,60,false),
('IOE-FLASHLIGHT-AA-BASIC','SUP-FLASHLIGHT-AA-BASIC',7.95,65,true),
('IOE-FLASHLIGHT-AA-PLUS','SUP-FLASHLIGHT-AA-PLUS',14.95,65,true)
) AS v(sku, supplier_sku, price_current, margin_score, is_preferred)
JOIN item i ON i.sku=v.sku
ON CONFLICT (item_id, supplier_name, supplier_sku) DO UPDATE SET price_current=EXCLUDED.price_current, currency=EXCLUDED.currency, availability_status=EXCLUDED.availability_status, lead_time_days=EXCLUDED.lead_time_days, margin_score=EXCLUDED.margin_score, is_preferred=EXCLUDED.is_preferred, last_checked_at=EXCLUDED.last_checked_at, status=EXCLUDED.status;

INSERT INTO tier_selection_policy (tier_id, min_quality_score, min_reliability_score, min_real_world_fit_score, prefer_redundancy, price_weight, quality_weight, compactness_weight, durability_weight, rationale, status)
SELECT t.id, v.min_quality, v.min_reliability, v.min_fit, v.prefer_redundancy, v.price_weight, v.quality_weight, v.compactness_weight, v.durability_weight, v.rationale, 'active'
FROM (VALUES
('basis',70,70,70,false,1.2,0.8,0.1,0.4,'Basis kiest betaalbare maar voldoende betrouwbare items. Het doel is minimale doordachte dekking zonder onnodige upgrades.'),
('basis_plus',85,85,85,true,0.7,1.2,0.2,0.8,'Basis+ kiest robuustere items met hogere betrouwbaarheid en betere praktijkfit, zonder marketingclaims blind over te nemen.')
) AS v(tier_slug, min_quality, min_reliability, min_fit, prefer_redundancy, price_weight, quality_weight, compactness_weight, durability_weight, rationale)
JOIN tier t ON t.slug=v.tier_slug
WHERE NOT EXISTS (
  SELECT 1 FROM tier_selection_policy tsp
  WHERE tsp.tier_id=t.id AND tsp.scenario_need_id IS NULL AND tsp.product_type_id IS NULL AND tsp.status='active'
);

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type',
       'Deze radio laadt je telefoon betrouwbaar op via zwengel of zonnepaneel.',
       'De radio is bedoeld voor informatieontvangst. Zwengel-, zonnepaneel- of laadfuncties zijn backup/comfort en vervangen geen powerbank.',
       'Zwengel en klein zonnepaneel zijn geen primaire telefoonlaadstrategie.',
       'warning', 'active'
FROM product_type pt WHERE pt.slug='noodradio'
  AND NOT EXISTS (
    SELECT 1 FROM claim_governance_rule cgr
    WHERE cgr.rule_scope='product_type'
      AND cgr.product_type_id=pt.id
      AND cgr.prohibited_claim='Deze radio laadt je telefoon betrouwbaar op via zwengel of zonnepaneel.'
  );

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT NULL::uuid, i.id, 'item',
       'Deze powerbank laadt zichzelf betrouwbaar op via het geïntegreerde zonnepaneel.',
       'Het geïntegreerde zonnepaneel is een backup-/comfortfunctie. Voor telefoonladen telt de opgeladen powerbank zelf als primaire oplossing, niet het kleine zonnepaneel.',
       'Voorkomt schijnzekerheid rond geïntegreerde zonnepaneeltjes.',
       'warning', 'active'
FROM item i
WHERE i.sku='IOE-PB-SOLAR-10K'
  AND NOT EXISTS (
    SELECT 1 FROM claim_governance_rule cgr
    WHERE cgr.rule_scope='item'
      AND cgr.item_id=i.id
      AND cgr.prohibited_claim='Deze powerbank laadt zichzelf betrouwbaar op via het geïntegreerde zonnepaneel.'
  );

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type',
       'Het lampje van de radio vervangt een hoofdlamp of lantaarn.',
       'Een radio-lampje kan helpen als oriëntatielicht, maar vervangt geen hoofdlamp of ruimteverlichting.',
       'Radio-lampje blijft backup/oriëntatie.',
       'warning', 'active'
FROM product_type pt WHERE pt.slug='noodradio'
  AND NOT EXISTS (
    SELECT 1 FROM claim_governance_rule cgr
    WHERE cgr.rule_scope='product_type'
      AND cgr.product_type_id=pt.id
      AND cgr.prohibited_claim='Het lampje van de radio vervangt een hoofdlamp of lantaarn.'
  );

INSERT INTO claim_governance_rule (product_type_id, item_id, rule_scope, prohibited_claim, allowed_framing, internal_rationale, severity, status)
SELECT pt.id, NULL, 'product_type',
       'Een zaklamp vervangt handsfree licht of ruimteverlichting.',
       'Een zaklamp is nuttig als gerichte extra lichtbron, maar vervangt geen hoofdlamp of lantaarn.',
       'Zaklamp is optional/supporting in deze batch.',
       'warning', 'active'
FROM product_type pt WHERE pt.slug='zaklamp'
  AND NOT EXISTS (
    SELECT 1 FROM claim_governance_rule cgr
    WHERE cgr.rule_scope='product_type'
      AND cgr.product_type_id=pt.id
      AND cgr.prohibited_claim='Een zaklamp vervangt handsfree licht of ruimteverlichting.'
  );

COMMIT;
