/**
 * Ik overleef — read-only recommendation engine POC.
 *
 * Implementation chain:
 *   package + addons -> scenarios
 *     -> scenario_needs (active, default_included, not content_only)
 *       -> scenario_need_product_rule
 *         -> quantity_policy (formula)
 *         -> product_variant @ tier -> default variant_item_candidate -> item
 *           -> item_accessory_requirement
 *             -> product_variant @ tier -> default candidate -> item
 *
 * Lines are deduped per item; multiple sources are recorded individually.
 */

const { Client } = require('pg');

const DEFAULT_INPUT = {
  package_slug: 'basispakket',
  tier_slug: 'basis_plus',
  addon_slugs: ['stroomuitval'],
  duration_hours: 72,
  household_adults: 2,
  household_children: 0,
  household_pets: 0,
};

function inputFromEnvironment() {
  const input = { ...DEFAULT_INPUT };
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(arg => arg.startsWith('--') && arg.includes('='))
      .map(arg => {
        const idx = arg.indexOf('=');
        return [arg.slice(2, idx), arg.slice(idx + 1)];
      }),
  );

  input.package_slug = args.package_slug || process.env.IOE_PACKAGE_SLUG || input.package_slug;
  input.tier_slug = args.tier_slug || process.env.IOE_TIER_SLUG || input.tier_slug;
  input.addon_slugs = (args.addon_slugs || process.env.IOE_ADDON_SLUGS || input.addon_slugs.join(','))
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  input.duration_hours = Number(args.duration_hours || process.env.IOE_DURATION_HOURS || input.duration_hours);
  input.household_adults = Number(args.household_adults || process.env.IOE_HOUSEHOLD_ADULTS || input.household_adults);
  input.household_children = Number(args.household_children || process.env.IOE_HOUSEHOLD_CHILDREN || input.household_children);
  input.household_pets = Number(args.household_pets || process.env.IOE_HOUSEHOLD_PETS || input.household_pets);
  return input;
}

function ceilWithMinMax(x, min, max) {
  let v = Math.ceil(x);
  if (min != null && v < Number(min)) v = Number(min);
  if (max != null && v > Number(max)) v = Number(max);
  return v;
}

function applyRounding(rule, value, packSize) {
  switch (rule) {
    case 'floor': return Math.floor(value);
    case 'nearest': return Math.round(value);
    case 'ceil': return Math.ceil(value);
    case 'minimum_one': return Math.max(1, Math.ceil(value));
    case 'pack_size': {
      const ps = Number(packSize || 1);
      return Math.ceil(value / ps);
    }
    case 'none':
    default: return value;
  }
}

function computeQuantity(policy, input) {
  const days = Math.max(1, Math.ceil(Number(input.duration_hours) / 24));
  const adults = Number(input.household_adults) || 0;
  const children = Number(input.household_children) || 0;
  const pets = Number(input.household_pets) || 0;

  const base = Number(policy.base_amount) || 0;
  const af = Number(policy.adult_factor) || 0;
  const cf = Number(policy.child_factor) || 0;
  const pf = Number(policy.pet_factor) || 0;
  const df = Number(policy.duration_day_factor) || 0;

  let raw;
  switch (policy.formula_type) {
    case 'fixed': raw = base; break;
    case 'per_adult': raw = base + af * adults; break;
    case 'per_child': raw = base + cf * children; break;
    case 'per_pet': raw = base + pf * pets; break;
    case 'per_person': raw = base + af * adults + cf * children; break;
    case 'per_household': raw = base; break;
    case 'per_adult_per_day': raw = base + af * adults * df * days; break;
    case 'per_child_per_day': raw = base + cf * children * df * days; break;
    case 'per_person_per_day': raw = base + (af * adults + cf * children) * (df || 1) * days; break;
    case 'per_device':
    case 'per_selected_parent_item':
    case 'pack_size_rounding':
    default: raw = base; break;
  }

  let qty = applyRounding(policy.rounding_rule || 'ceil', raw, policy.pack_size);
  qty = ceilWithMinMax(qty, policy.min_quantity, policy.max_quantity);
  return qty;
}

async function resolveScenarioIds(c, packageSlug, addonSlugs) {
  const ids = new Set();

  const pkg = await c.query(
    `SELECT s.id
       FROM package p
       JOIN package_scenario ps ON ps.package_id = p.id
       JOIN scenario s ON s.id = ps.scenario_id
      WHERE p.slug = $1 AND p.status = 'active' AND s.status = 'active'`,
    [packageSlug],
  );
  pkg.rows.forEach(r => ids.add(r.id));

  if (addonSlugs && addonSlugs.length) {
    const ad = await c.query(
      `SELECT s.id
         FROM addon a
         JOIN addon_scenario ag ON ag.addon_id = a.id
         JOIN scenario s ON s.id = ag.scenario_id
        WHERE a.slug = ANY($1) AND a.status = 'active' AND s.status = 'active'`,
      [addonSlugs],
    );
    ad.rows.forEach(r => ids.add(r.id));
  }
  return [...ids];
}

async function resolveActiveScenarioNeeds(c, scenarioIds) {
  if (!scenarioIds.length) return [];
  const r = await c.query(
    `SELECT sn.id, sn.scenario_id, sn.need_id, n.slug AS need_slug, n.content_only
       FROM scenario_need sn
       JOIN need n ON n.id = sn.need_id
      WHERE sn.scenario_id = ANY($1)
        AND sn.status = 'active'
        AND sn.default_included = true
        AND n.content_only = false`,
    [scenarioIds],
  );
  return r.rows;
}

async function resolveProductRules(c, scenarioNeedIds) {
  if (!scenarioNeedIds.length) return [];
  const r = await c.query(
    `SELECT snpr.id, snpr.scenario_need_id, snpr.product_type_id, snpr.role,
            snpr.priority, snpr.explanation, pt.slug AS product_type_slug
       FROM scenario_need_product_rule snpr
       JOIN product_type pt ON pt.id = snpr.product_type_id
      WHERE snpr.scenario_need_id = ANY($1)
        AND snpr.status = 'active'`,
    [scenarioNeedIds],
  );
  return r.rows;
}

async function resolvePolicyForRule(c, snprId) {
  const r = await c.query(
    `SELECT formula_type, unit, base_amount, adult_factor, child_factor, pet_factor,
            duration_day_factor, device_factor, pack_size, min_quantity, max_quantity, rounding_rule
       FROM quantity_policy
      WHERE scenario_need_product_rule_id = $1 AND status = 'active'
      LIMIT 1`,
    [snprId],
  );
  return r.rows[0] || null;
}

async function resolveAccessoryPolicy(c, accReqId) {
  const r = await c.query(
    `SELECT formula_type, unit, base_amount, adult_factor, child_factor, pet_factor,
            duration_day_factor, pack_size, min_quantity, max_quantity, rounding_rule
       FROM quantity_policy
      WHERE item_accessory_requirement_id = $1 AND status = 'active'
      LIMIT 1`,
    [accReqId],
  );
  return r.rows[0] || null;
}

/**
 * Pick default candidate item for a (product_type, tier) combination.
 * Falls back to the highest fit_score active candidate that has a valid supplier offer.
 */
async function pickItemForProductType(c, productTypeId, tierSlug) {
  const r = await c.query(
    `SELECT vic.id AS vic_id, vic.item_id, vic.fit_score, vic.is_default_candidate,
            i.title, i.sku, i.quality_score, i.reliability_score,
            i.real_world_fit_score, so.availability_status,
            pv.id AS variant_id, pv.slug AS variant_slug
       FROM variant_item_candidate vic
       JOIN product_variant pv ON pv.id = vic.product_variant_id
       JOIN item i ON i.id = vic.item_id
       JOIN tier t ON t.id = vic.tier_id
       JOIN LATERAL (
         SELECT availability_status
           FROM supplier_offer so
          WHERE so.item_id = i.id
            AND so.status = 'active'
            AND so.availability_status IN ('in_stock', 'low_stock')
          ORDER BY so.is_preferred DESC, so.margin_score DESC, so.price_current ASC
          LIMIT 1
       ) so ON true
      WHERE pv.product_type_id = $1
        AND t.slug = $2
        AND vic.status = 'active'
        AND pv.status = 'active'
        AND i.status = 'active'
      ORDER BY vic.is_default_candidate DESC, vic.fit_score DESC
      LIMIT 1`,
    [productTypeId, tierSlug],
  );
  return r.rows[0] || null;
}

async function resolveAccessoryRequirements(c, itemId) {
  const r = await c.query(
    `SELECT iar.id, iar.required_product_type_id, iar.required_capability_id,
            iar.quantity_base, iar.is_mandatory, iar.reason,
            pt.slug AS required_product_type_slug,
            cap.slug AS required_capability_slug
       FROM item_accessory_requirement iar
       JOIN product_type pt ON pt.id = iar.required_product_type_id
       LEFT JOIN capability cap ON cap.id = iar.required_capability_id
      WHERE iar.item_id = $1 AND iar.status = 'active'`,
    [itemId],
  );
  return r.rows;
}

async function resolveItemCapabilities(c, itemId) {
  const r = await c.query(
    `SELECT ic.capability_id, ic.coverage_strength, ic.claim_type,
            ic.can_replace_primary, c.slug AS capability_slug
       FROM item_capability ic
       JOIN capability c ON c.id = ic.capability_id
      WHERE ic.item_id = $1`,
    [itemId],
  );
  return r.rows;
}

async function resolveNeedCapabilities(c, needId) {
  const r = await c.query(
    `SELECT nc.capability_id, nc.importance, nc.default_required_strength, nc.weight,
            c.slug AS capability_slug
       FROM need_capability nc
       JOIN capability c ON c.id = nc.capability_id
      WHERE nc.need_id = $1`,
    [needId],
  );
  return r.rows;
}

const STRENGTH_RANK = { primary: 4, secondary: 3, backup: 2, comfort: 1, none: 0 };

function meetsRequiredStrength(actual, required) {
  return STRENGTH_RANK[actual] >= STRENGTH_RANK[required];
}

const AVAILABILITY_SCORE = {
  in_stock: 100,
  low_stock: 75,
  preorder: 45,
  out_of_stock: 0,
  unknown: 35,
};

function computeSelectionScore(line) {
  const fitScore = Number(line.fit_score || 0);
  const qualityScore = Number(line.quality_score || 0);
  const reliabilityScore = Number(line.reliability_score || 0);
  const realWorldFitScore = Number(line.real_world_fit_score || 0);
  const availabilityScore = AVAILABILITY_SCORE[line.availability_status] ?? AVAILABILITY_SCORE.unknown;

  const weighted =
    fitScore * 0.35 +
    qualityScore * 0.2 +
    reliabilityScore * 0.2 +
    realWorldFitScore * 0.15 +
    availabilityScore * 0.1;

  return Math.max(0, Math.min(100, Number(weighted.toFixed(1))));
}

function sourceNeeds(line) {
  return [...new Set(line.sources.map(s => s.scenario_need_slug).filter(Boolean))];
}

function parentTitles(line) {
  return [...new Set(line.sources.map(s => s.parent_title).filter(Boolean))];
}

function derivedLineRole(line) {
  const roles = new Set(line.rule_roles || []);
  const needs = new Set(sourceNeeds(line));

  if (
    line.is_accessory ||
    roles.has('accessory') ||
    line.sources.some(s => s.source_type === 'accessory_requirement') ||
    [
      'handmatige-blikopener',
      'multitool-met-blikopener',
      'gascartouche',
      'ontsteking',
      'kookvat',
      'sanitair-absorptiemiddel',
      'zipbags',
      'nitril-handschoenen',
      'verbandtape',
    ].includes(line.product_type_slug)
  ) {
    return 'accessory';
  }

  if (
    needs.has('voedsel-verwarmen-ondersteunend') ||
    line.product_type_slug === 'buitenkooktoestel-gas' ||
    needs.has('temperatuur-controleren') ||
    line.product_type_slug === 'thermometer'
  ) {
    return 'supporting';
  }

  if (roles.has('backup')) return 'backup';
  return 'core';
}

function publicExplanationForLine(line) {
  switch (line.sku) {
    case 'IOE-PB-20K-PLUS':
    case 'IOE-PB-10K-BASIC':
    case 'IOE-PB-SOLAR-10K':
      return 'Deze powerbank is toegevoegd omdat je bij stroomuitval je telefoon realistisch moet kunnen opladen. We rekenen zwengel- of kleine zonnepaneelfuncties hiervoor niet als primaire oplossing.';
    case 'IOE-HEADLAMP-AAA-PLUS':
    case 'IOE-HEADLAMP-AAA-BASIC':
      return 'Deze hoofdlamp geeft handsfree licht, zodat je veilig kunt bewegen en handelen terwijl je beide handen vrij houdt.';
    case 'IOE-LANTERN-AA-PLUS':
    case 'IOE-LANTERN-AA-BASIC':
      return 'Deze lantaarn is toegevoegd voor praktische ruimteverlichting op een centrale plek in huis.';
    case 'IOE-RADIO-AAUSB-PLUS':
    case 'IOE-RADIO-AA-BASIC':
    case 'IOE-RADIO-SOLAR-CRANK':
      return 'Deze noodradio is toegevoegd voor informatieontvangst bij stroom- of netwerkuitval. Laad-, zwengel- of lampfuncties tellen alleen als backup en vervangen geen powerbank, hoofdlamp of lantaarn.';
    case 'IOE-CABLE-USBC-SET':
    case 'IOE-CABLE-USBC-BASIC':
      return 'Deze kabelset maakt de powerbank praktisch bruikbaar voor apparaten met USB-C.';
    case 'IOE-BATT-AA-12':
    case 'IOE-BATT-AA-12-BASIC':
      return 'Deze AA-batterijen zijn toegevoegd voor de apparaten in je pakket die op AA werken, zoals de lantaarn en noodradio.';
    case 'IOE-BATT-AAA-12':
    case 'IOE-BATT-AAA-12-BASIC':
      return 'Deze AAA-batterijen zijn toegevoegd voor de hoofdlamp.';
    case 'IOE-FLASHLIGHT-AA-BASIC':
    case 'IOE-FLASHLIGHT-AA-PLUS':
      return 'Een zaklamp kan handig zijn als extra gerichte lichtbron, maar vervangt geen hoofdlamp of lantaarn.';
    case 'IOE-WATER-PACK-6L-BASIC':
    case 'IOE-WATER-PACK-6L-PLUS':
      return 'Deze drinkwatervoorraad is toegevoegd zodat je direct drinkbaar water beschikbaar hebt voor de gekozen duur en huishoudgrootte.';
    case 'IOE-JERRYCAN-10L-BASIC':
    case 'IOE-JERRYCAN-20L-PLUS':
      return 'Deze waterjerrycan is toegevoegd om thuis extra drinkwater veilig te kunnen opslaan. Een filter of tablet vervangt deze opslag niet.';
    case 'IOE-WATERFILTER-BASIC':
    case 'IOE-WATERFILTER-PLUS':
      return 'Dit waterfilter is toegevoegd als backup voor waterbehandeling volgens productspecificatie. Het vervangt geen voldoende drinkwatervoorraad.';
    case 'IOE-WATER-TABS-BASIC':
    case 'IOE-WATER-TABS-PLUS':
      return 'Deze waterzuiveringstabletten zijn een backupmethode voor waterbehandeling volgens instructie. Ze zijn geen universele oplossing voor elk water.';
    case 'IOE-BOTTLE-1L-BASIC':
    case 'IOE-BOTTLE-1L-PLUS':
      return 'Deze drinkfles is toegevoegd zodat je bij verplaatsing drinkwater praktisch kunt meenemen.';
    case 'IOE-FILTERBOTTLE-PLUS':
      return 'Deze filterfles combineert water meenemen met een filterfunctie volgens productspecificatie. De filterfunctie is ondersteunend en vervangt geen basisvoorraad.';
    case 'IOE-FOOD-PACK-1PD-BASIC':
    case 'IOE-FOOD-PACK-1PD-PLUS':
      return 'Dit voedselpakket is toegevoegd voor 72 uur voedseldekking per persoon. Het is houdbaar zonder koeling en bruikbaar zonder koken.';
    case 'IOE-CAN-OPENER-BASIC':
      return 'Deze handmatige blikopener is toegevoegd omdat de gekozen voedselvariant blikopening vereist.';
    case 'IOE-MULTITOOL-CAN-OPENER-PLUS':
      return 'Deze multitool vervangt de dedicated blikopener alleen omdat de blikopenerfunctie als capability is vastgelegd.';
    case 'IOE-COOKER-OUTDOOR-GAS-BASIC':
    case 'IOE-COOKER-OUTDOOR-GAS-PLUS':
      return 'Deze kookoplossing is ondersteunend en alleen voor buitengebruik. Het voedselpakket blijft ook zonder koken bruikbaar.';
    case 'IOE-FUEL-GAS-230G-BASIC':
    case 'IOE-FUEL-GAS-230G-PLUS':
      return 'Deze compatibele brandstof is toegevoegd als verplicht accessoire bij het buitenkooktoestel. Alleen buiten en volgens productinstructies gebruiken.';
    case 'IOE-IGNITION-LIGHTER-BASIC':
    case 'IOE-IGNITION-STORM-LIGHTER-PLUS':
      return 'Deze ontsteking is toegevoegd als verplicht accessoire bij het buitenkooktoestel. Buiten bereik van kinderen bewaren.';
    case 'IOE-COOK-POT-BASIC':
    case 'IOE-COOK-SET-PLUS':
      return 'Dit kookvat is toegevoegd als verplicht accessoire bij de ondersteunende kookoplossing.';
    case 'IOE-HANDGEL-BASIC':
    case 'IOE-HANDGEL-PLUS':
      return 'Deze handgel is toegevoegd voor praktische handhygiene volgens productinstructie. Dit is geen medische bescherming of volledige infectiepreventie.';
    case 'IOE-HYGIENE-WIPES-BASIC':
    case 'IOE-HYGIENE-WIPES-PLUS':
      return 'Deze hygienedoekjes zijn toegevoegd voor basale reiniging. Ze reinigen praktisch, maar steriliseren niet.';
    case 'IOE-SOAP-BASIC':
    case 'IOE-SOAP-PLUS':
      return 'Deze basiszeep ondersteunt handreiniging en basishygiene.';
    case 'IOE-TOILET-BAGS-BASIC':
    case 'IOE-TOILET-BAGS-PLUS':
      return 'Deze noodtoiletzakken zijn toegevoegd om toiletafval tijdelijk in te sluiten. Gebruik ze volgens instructie en met de getoonde waarschuwingen.';
    case 'IOE-ABSORBENT-BASIC':
    case 'IOE-ABSORBENT-PLUS':
      return 'Dit absorptiemiddel is toegevoegd als ondersteunend accessoire bij noodsanitatie. Het maakt afval niet veilig om zonder bescherming te hanteren.';
    case 'IOE-TOILET-PAPER-BASIC':
    case 'IOE-TOILET-PAPER-PLUS':
      return 'Dit toiletpapier is toegevoegd als praktisch verbruiksartikel bij de noodsanitatie-oplossing.';
    case 'IOE-WASTE-BAGS-BASIC':
    case 'IOE-WASTE-BAGS-PLUS':
      return 'Deze vuilniszakken zijn toegevoegd voor tijdelijke afvalcontainment van huishoudelijk afval. Ze zijn niet bedoeld voor gevaarlijk, chemisch of medisch afval.';
    case 'IOE-ZIPBAGS-BASIC':
    case 'IOE-ZIPBAGS-PLUS':
      return 'Deze zipbags ondersteunen het apart afsluitbaar bewaren van klein of geurend huishoudelijk afval.';
    case 'IOE-GLOVES-NITRILE-BASIC':
    case 'IOE-GLOVES-NITRILE-PLUS':
      if (sourceNeeds(line).some(need => ['zorg-handbescherming', 'basis-ehbo', 'wondreiniging-ondersteunen'].includes(need))) {
        return 'Deze nitril handschoenen zijn toegevoegd voor handling bij wondzorg. Ze zijn niet steriel en geen medische bescherming.';
      }
      return 'Deze nitril handschoenen zijn toegevoegd voor handling bij sanitatie en afval. Ze zijn niet steriel en geen medische bescherming.';
    case 'IOE-FIRSTAID-KIT-BASIC':
    case 'IOE-FIRSTAID-KIT-PLUS':
      return 'Deze EHBO-set is toegevoegd voor kleine incidenten. De set vervangt geen arts, professionele hulp of noodhulp.';
    case 'IOE-PLASTERS-BASIC':
    case 'IOE-PLASTERS-PLUS':
      return 'Deze pleisters zijn toegevoegd voor kleine wondafdekking. Ze zijn niet bedoeld voor ernstige verwondingen.';
    case 'IOE-STERILE-GAUZE-BASIC':
    case 'IOE-STERILE-GAUZE-PLUS':
      return 'Dit steriele gaas ondersteunt wondafdekking, maar garandeert geen infectiepreventie.';
    case 'IOE-WOUND-CLEANING-BASIC':
    case 'IOE-WOUND-CLEANING-PLUS':
      return 'Deze wondreiniging ondersteunt reinigen volgens productinstructie. Het behandelt of voorkomt geen infectie.';
    case 'IOE-MEDICAL-TAPE-BASIC':
    case 'IOE-MEDICAL-TAPE-PLUS':
      return 'Deze verbandtape is toegevoegd om gaas of verband te fixeren. Tape behandelt geen wond.';
    case 'IOE-THERMOMETER-PLUS':
      return 'Deze thermometer is toegevoegd als ondersteunend middel om temperatuur te meten. Hij stelt geen diagnose en geeft geen behandeladvies.';
    case 'IOE-THERMAL-BLANKET-BASIC':
    case 'IOE-THERMAL-BLANKET-PLUS':
      return 'Deze warmtedeken is toegevoegd om lichaamswarmte beter vast te houden bij kou of verwarmingsuitval. Dit is praktische warmteondersteuning en geen medische behandeling van onderkoeling.';
    case 'IOE-EMERGENCY-BLANKET-BASIC':
    case 'IOE-EMERGENCY-BIVVY-PLUS':
      return 'Deze nooddeken is toegevoegd als compacte backup voor warmtebehoud. Hij helpt warmteverlies beperken, maar vervangt geen warme slaapoplossing of medische hulp bij onderkoeling.';
    case 'IOE-PONCHO-BASIC':
    case 'IOE-PONCHO-PLUS':
      return 'Deze poncho is toegevoegd om jezelf droog te houden bij regen of natte omstandigheden. Een poncho is persoonlijke regenbescherming en geen volwaardige beschutting.';
    case 'IOE-TARP-LIGHT-BASIC':
    case 'IOE-TARP-LIGHT-PLUS':
      return 'Deze tarp-light is toegevoegd als eenvoudige tijdelijke afscherming. Hij is geen tent, woning of volwaardige shelter en biedt geen warmte.';
    case 'IOE-PARACORD-BASIC':
    case 'IOE-PARACORD-PLUS':
      return 'Deze paracord is toegevoegd om de tarp-light praktisch te kunnen bevestigen. Gebruik veilig en voorkom losraken of struikelgevaar.';
    case 'IOE-TARP-PEGS-BASIC':
    case 'IOE-TARP-PEGS-PLUS':
      return 'Deze haringen zijn toegevoegd om de tarp-light te verankeren. Ze zijn bevestiging en geen beschutting op zichzelf.';
    case 'IOE-GROUNDSHEET-PLUS':
      return 'Dit grondzeil is toegevoegd als ondersteunende vochtbarrière. Het is geen slaapmat of volledige beschuttingsoplossing.';
    case 'IOE-EVAC-BAG-BASIC':
    case 'IOE-EVAC-BAG-PLUS':
      return 'Deze evacuatietas is toegevoegd als draag- en packability-oplossing. De tas ordent en draagt spullen, maar bepaalt niet zelf de inhoud van je pakket.';
    case 'IOE-DOC-FOLDER-BASIC':
    case 'IOE-DOC-FOLDER-PLUS':
      return 'Deze documentenmap is toegevoegd om belangrijke papieren beschermd en compact te bundelen. De documenten zelf blijven een persoonlijke checklist.';
    case 'IOE-WHISTLE-BASIC':
    case 'IOE-WHISTLE-PLUS':
      return 'Deze noodfluit is toegevoegd als eenvoudige hoorbare signalering. Hij ondersteunt aandacht trekken, maar garandeert geen redding of hulp.';
    case 'IOE-REFLECTIVE-VEST-BASIC':
    case 'IOE-REFLECTIVE-VEST-PLUS':
      return 'Dit reflectievest is toegevoegd om onderweg beter zichtbaar te zijn. Het ondersteunt zichtbaarheid, maar garandeert geen veiligheid.';
    default:
      if (line.is_accessory) {
        const parents = parentTitles(line);
        return parents.length
          ? `Benodigd accessoire voor ${parents.join(' en ')}.`
          : 'Benodigd accessoire om de geselecteerde producten praktisch bruikbaar te maken.';
      }
      return line.sources[0]?.explanation || `Geselecteerd voor ${line.product_type_slug}.`;
  }
}

function internalExplanationForLine(line, selectionScore) {
  const needs = sourceNeeds(line);
  const parents = parentTitles(line);
  const role = derivedLineRole(line);
  const parts = [
    `role=${role}`,
    `scenario_need=${needs.length ? needs.join(',') : 'n/a'}`,
    `product_type=${line.product_type_slug}`,
    `sku=${line.sku}`,
    `candidate_fit=${line.fit_score ?? 'n/a'}`,
    `quality=${line.quality_score ?? 'n/a'}`,
    `reliability=${line.reliability_score ?? 'n/a'}`,
    `real_world_fit=${line.real_world_fit_score ?? 'n/a'}`,
    `availability=${line.availability_status || 'unknown'}`,
    `selection_score=${selectionScore}`,
    `sources=${line.sources.map(s => s.source_type).join(',')}`,
  ];

  if (parents.length) parts.push(`parent_items=${parents.join(',')}`);
  if (line.sku === 'IOE-RADIO-AAUSB-PLUS') {
    parts.push('governance=telefoonladen en orientatielicht zijn backup/weak coverage, niet primary sufficient');
  }
  if (['IOE-WATERFILTER-BASIC', 'IOE-WATERFILTER-PLUS', 'IOE-WATER-TABS-BASIC', 'IOE-WATER-TABS-PLUS', 'IOE-FILTERBOTTLE-PLUS'].includes(line.sku)) {
    parts.push('governance=waterbehandeling is backup/supporting en vervangt geen drinkwatervoorraad of thuisopslag');
  }
  if (['IOE-COOKER-OUTDOOR-GAS-BASIC', 'IOE-COOKER-OUTDOOR-GAS-PLUS', 'IOE-FUEL-GAS-230G-BASIC', 'IOE-FUEL-GAS-230G-PLUS', 'IOE-IGNITION-LIGHTER-BASIC', 'IOE-IGNITION-STORM-LIGHTER-PLUS', 'IOE-COOK-POT-BASIC', 'IOE-COOK-SET-PLUS'].includes(line.sku)) {
    parts.push('governance=voedselbereiding is supporting/accessory; geen primary food coverage; alleen buiten en volgens instructie');
  }
  if (['IOE-FOOD-PACK-1PD-BASIC', 'IOE-FOOD-PACK-1PD-PLUS'].includes(line.sku)) {
    parts.push('governance=core food coverage blijft no-cook en zonder koeling');
  }
  if (['IOE-HANDGEL-BASIC', 'IOE-HANDGEL-PLUS', 'IOE-HYGIENE-WIPES-BASIC', 'IOE-HYGIENE-WIPES-PLUS', 'IOE-GLOVES-NITRILE-BASIC', 'IOE-GLOVES-NITRILE-PLUS'].includes(line.sku)) {
    parts.push('governance=hygiene items maken geen medische of volledige infectiepreventieclaim');
  }
  if (['IOE-TOILET-BAGS-BASIC', 'IOE-TOILET-BAGS-PLUS', 'IOE-ABSORBENT-BASIC', 'IOE-ABSORBENT-PLUS', 'IOE-WASTE-BAGS-BASIC', 'IOE-WASTE-BAGS-PLUS', 'IOE-ZIPBAGS-BASIC', 'IOE-ZIPBAGS-PLUS'].includes(line.sku)) {
    parts.push('governance=sanitatie/afval is containment/supporting; geen gevaarlijk, chemisch of medisch afval claim');
  }
  if (['IOE-FIRSTAID-KIT-BASIC', 'IOE-FIRSTAID-KIT-PLUS', 'IOE-PLASTERS-BASIC', 'IOE-PLASTERS-PLUS', 'IOE-STERILE-GAUZE-BASIC', 'IOE-STERILE-GAUZE-PLUS', 'IOE-WOUND-CLEANING-BASIC', 'IOE-WOUND-CLEANING-PLUS', 'IOE-MEDICAL-TAPE-BASIC', 'IOE-MEDICAL-TAPE-PLUS', 'IOE-THERMOMETER-PLUS'].includes(line.sku)) {
    parts.push('governance=EHBO/persoonlijke zorg is ondersteunend; geen diagnose, behandeling of artsvervangende claim');
  }
  if (['IOE-THERMAL-BLANKET-BASIC', 'IOE-THERMAL-BLANKET-PLUS', 'IOE-EMERGENCY-BLANKET-BASIC', 'IOE-EMERGENCY-BIVVY-PLUS', 'IOE-PONCHO-BASIC', 'IOE-PONCHO-PLUS', 'IOE-TARP-LIGHT-BASIC', 'IOE-TARP-LIGHT-PLUS', 'IOE-PARACORD-BASIC', 'IOE-PARACORD-PLUS', 'IOE-TARP-PEGS-BASIC', 'IOE-TARP-PEGS-PLUS', 'IOE-GROUNDSHEET-PLUS'].includes(line.sku)) {
    parts.push('governance=warmte/droog/shelter-light is ondersteunend; geen slaapcomfort, geen onderkoelingbehandeling, geen full shelter en geen extreme weather garantie');
  }
  if (['IOE-EVAC-BAG-BASIC', 'IOE-EVAC-BAG-PLUS', 'IOE-DOC-FOLDER-BASIC', 'IOE-DOC-FOLDER-PLUS', 'IOE-WHISTLE-BASIC', 'IOE-WHISTLE-PLUS', 'IOE-REFLECTIVE-VEST-BASIC', 'IOE-REFLECTIVE-VEST-PLUS', 'IOE-HEADLAMP-AAA-BASIC', 'IOE-HEADLAMP-AAA-PLUS', 'IOE-BOTTLE-1L-BASIC', 'IOE-BOTTLE-1L-PLUS', 'IOE-FILTERBOTTLE-PLUS'].includes(line.sku) && needs.some(need => ['evacuatietas-dragen', 'documenten-beschermen', 'hoorbaar-signaleren', 'zichtbaar-onderweg', 'licht-onderweg', 'drinkwater-meenemen-evacuatie'].includes(need))) {
    parts.push('governance=evacuatie-items ondersteunen dragen, documentbescherming, zichtbaarheid, licht en water meenemen; geen veilige evacuatie-, reddings- of universele filterclaim');
  }
  if (['IOE-GLOVES-NITRILE-BASIC', 'IOE-GLOVES-NITRILE-PLUS'].includes(line.sku) && needs.some(need => ['zorg-handbescherming', 'basis-ehbo', 'wondreiniging-ondersteunen'].includes(need))) {
    parts.push('governance=handschoenen hergebruikt voor wondzorghandling; geen steriele medische bescherming');
  }

  return parts.join('; ');
}

async function main(inputOverride = null, options = {}) {
  const dbUrl = process.env.IOE_PG_URL;
  if (!dbUrl) {
    throw new Error('IOE_PG_URL is required, for example postgresql://ioe_app:<password>@localhost:5432/ikoverleef_dev');
  }

  const input = inputOverride || inputFromEnvironment();
  const c = new Client({ connectionString: dbUrl });
  await c.connect();

  try {
    await c.query('BEGIN');

    const pkg = await c.query(`SELECT id FROM package WHERE slug=$1 AND status='active'`, [input.package_slug]);
    if (!pkg.rows.length) throw new Error(`Package not found or not active: ${input.package_slug}`);
    const tier = await c.query(`SELECT id FROM tier WHERE slug=$1 AND status='active'`, [input.tier_slug]);
    if (!tier.rows.length) throw new Error(`Tier not found or not active: ${input.tier_slug}`);

    const runRes = await c.query(
      `INSERT INTO recommendation_run
         (package_id, tier_id, household_adults, household_children, household_pets,
          duration_hours, calculation_version, status)
       VALUES ($1,$2,$3,$4,$5,$6,'v1','draft')
       RETURNING id`,
      [
        pkg.rows[0].id, tier.rows[0].id,
        input.household_adults, input.household_children, input.household_pets,
        input.duration_hours,
      ],
    );
    const runId = runRes.rows[0].id;

    if (input.addon_slugs && input.addon_slugs.length) {
      await c.query(
        `INSERT INTO recommendation_run_addon (recommendation_run_id, addon_id)
         SELECT $1, a.id FROM addon a WHERE a.slug = ANY($2)`,
        [runId, input.addon_slugs],
      );
    }

    const scenarioIds = await resolveScenarioIds(c, input.package_slug, input.addon_slugs);
    const scenarioNeeds = await resolveActiveScenarioNeeds(c, scenarioIds);
    const snIds = scenarioNeeds.map(s => s.id);
    const productRules = await resolveProductRules(c, snIds);
    const scenarioNeedById = new Map(scenarioNeeds.map(sn => [sn.id, sn]));
    const needCapabilityIdsByScenarioNeedId = new Map();

    async function capabilityIdsForScenarioNeed(scenarioNeedId) {
      if (needCapabilityIdsByScenarioNeedId.has(scenarioNeedId)) {
        return needCapabilityIdsByScenarioNeedId.get(scenarioNeedId);
      }
      const sn = scenarioNeedById.get(scenarioNeedId);
      if (!sn) return new Set();
      const needCaps = await resolveNeedCapabilities(c, sn.need_id);
      const ids = new Set(needCaps.map(nc => nc.capability_id));
      needCapabilityIdsByScenarioNeedId.set(scenarioNeedId, ids);
      return ids;
    }

    async function accessorySourcesForSelection(selection, req) {
      const relevantSources = [];
      if (req.required_capability_id) {
        for (const src of selection.sources) {
          if (!src.scenario_need_id) continue;
          const ids = await capabilityIdsForScenarioNeed(src.scenario_need_id);
          if (ids.has(req.required_capability_id)) relevantSources.push(src);
        }
      }

      if (!relevantSources.length && req.required_capability_id) {
        for (const sn of scenarioNeeds) {
          const ids = await capabilityIdsForScenarioNeed(sn.id);
          if (ids.has(req.required_capability_id)) {
            relevantSources.push({
              scenario_need_id: sn.id,
              scenario_need_slug: sn.need_slug,
            });
          }
        }
      }

      const baseSources = relevantSources.length ? relevantSources : selection.sources;
      return baseSources.map(src => ({
        source_type: 'accessory_requirement',
        scenario_need_id: src.scenario_need_id,
        scenario_need_slug: src.scenario_need_slug,
        accessory_requirement_id: req.id,
        parent_item_id: selection.item_id,
        parent_title: selection.title,
        required_capability_id: req.required_capability_id,
        required_capability_slug: req.required_capability_slug,
        explanation: req.reason,
      }));
    }

    /**
     * Step 1: pick a candidate item per product_rule, compute quantity, build raw selections.
     *   Each selection carries a single source object (scenario_need).
     */
    const rawSelections = [];
    for (const rule of productRules) {
      if (rule.role === 'optional') {
        continue;
      }
      const policy = await resolvePolicyForRule(c, rule.id);
      if (!policy) continue;
      const qty = computeQuantity(policy, input);
      if (qty <= 0) continue;

      const picked = await pickItemForProductType(c, rule.product_type_id, input.tier_slug);
      if (!picked) {
        console.warn(`No candidate found for product_type=${rule.product_type_slug} (rule ${rule.id})`);
        continue;
      }

      rawSelections.push({
        item_id: picked.item_id,
        product_type_id: rule.product_type_id,
        product_type_slug: rule.product_type_slug,
        title: picked.title,
        sku: picked.sku,
        fit_score: picked.fit_score,
        quality_score: picked.quality_score,
        reliability_score: picked.reliability_score,
        real_world_fit_score: picked.real_world_fit_score,
        availability_status: picked.availability_status,
        quantity: qty,
        is_accessory: false,
        rule_roles: [rule.role],
        primary_reason_scenario_need_id: rule.scenario_need_id,
        accessory_requirement_id: null,
        sources: [{
          source_type: 'scenario_need',
          scenario_need_id: rule.scenario_need_id,
          scenario_need_slug: scenarioNeedById.get(rule.scenario_need_id)?.need_slug,
          accessory_requirement_id: null,
          parent_item_id: null,
          parent_title: null,
          explanation: rule.explanation || `Product rule for ${rule.product_type_slug}`,
        }],
      });
    }

    /**
     * Step 2: for each core selection, resolve its accessory requirements.
     */
    const accessorySelections = [];
    for (const sel of rawSelections) {
      const reqs = await resolveAccessoryRequirements(c, sel.item_id);
      for (const req of reqs) {
        const accPolicy = await resolveAccessoryPolicy(c, req.id);
        const qty = accPolicy
          ? computeQuantity(accPolicy, input)
          : Number(req.quantity_base) || 1;

        const picked = await pickItemForProductType(c, req.required_product_type_id, input.tier_slug);
        if (!picked) {
          console.warn(`No accessory candidate for ${req.required_product_type_slug} (parent item ${sel.sku})`);
          continue;
        }

        const sources = await accessorySourcesForSelection(sel, req);
        const primaryReasonScenarioNeedId = sources[0]?.scenario_need_id || sel.primary_reason_scenario_need_id;

        accessorySelections.push({
          item_id: picked.item_id,
          product_type_id: req.required_product_type_id,
          product_type_slug: req.required_product_type_slug,
          title: picked.title,
          sku: picked.sku,
          fit_score: picked.fit_score,
          quality_score: picked.quality_score,
          reliability_score: picked.reliability_score,
          real_world_fit_score: picked.real_world_fit_score,
          availability_status: picked.availability_status,
          quantity: qty,
          is_accessory: true,
          rule_roles: ['accessory'],
          primary_reason_scenario_need_id: primaryReasonScenarioNeedId,
          accessory_requirement_id: req.id,
          required_capability_id: req.required_capability_id,
          required_capability_slug: req.required_capability_slug,
          parent_selection: sel,
          sources,
        });
      }
    }

    /**
     * Step 3: dedup by item_id. Quantities collapse to max; sources are concatenated.
     */
    const all = [...rawSelections, ...accessorySelections];
    const byItem = new Map();
    for (const sel of all) {
      const existing = byItem.get(sel.item_id);
      if (!existing) {
        byItem.set(sel.item_id, { ...sel, sources: [...sel.sources] });
        continue;
      }
      existing.quantity = Math.max(Number(existing.quantity), Number(sel.quantity));
      existing.sources.push(...sel.sources);
      existing.rule_roles = [...new Set([...(existing.rule_roles || []), ...(sel.rule_roles || [])])];
      // If at least one occurrence is non-accessory, treat dedup'd line as core.
      existing.is_accessory = existing.is_accessory && sel.is_accessory;
    }
    const lines = [...byItem.values()];

    /**
     * Step 4: write generated_package_line, generated_line_source, generated_line_coverage.
     */
    const writtenLines = [];
    for (const line of lines) {
      const selectionScore = computeSelectionScore(line);
      const lineRole = derivedLineRole(line);
      const insertedLine = await c.query(
        `INSERT INTO generated_package_line
           (recommendation_run_id, item_id, product_type_id, quantity,
            primary_reason_scenario_need_id, accessory_requirement_id,
            is_accessory, is_core_line, is_user_removable, is_user_replaceable,
            replacement_policy, selection_score, explanation_public, explanation_internal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false,'none',$9,$10,$11)
         RETURNING id`,
        [
          runId, line.item_id, line.product_type_id, line.quantity,
          line.primary_reason_scenario_need_id, line.accessory_requirement_id,
          lineRole === 'accessory', lineRole === 'core',
          selectionScore,
          publicExplanationForLine(line),
          internalExplanationForLine(line, selectionScore),
        ],
      );
      const lineId = insertedLine.rows[0].id;
      writtenLines.push({ ...line, generated_package_line_id: lineId });
    }

    // Map item_id -> generated_package_line_id (for parent_generated_package_line_id wiring).
    const lineIdByItem = new Map(writtenLines.map(l => [l.item_id, l.generated_package_line_id]));

    for (const line of writtenLines) {
      for (const src of line.sources) {
        const parentLineId = src.parent_item_id ? lineIdByItem.get(src.parent_item_id) : null;
        await c.query(
          `INSERT INTO generated_line_source
             (generated_package_line_id, source_type, scenario_need_id,
              accessory_requirement_id, parent_generated_package_line_id, explanation)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT DO NOTHING`,
          [
            line.generated_package_line_id,
            src.source_type,
            src.scenario_need_id,
            src.accessory_requirement_id,
            parentLineId,
            src.explanation,
          ],
        );
      }
    }

    /**
     * Step 5: coverage.
     *   Core line -> for each (need_capability) of the source's need that this item actually
     *               covers (item_capability), write coverage. counted_as_sufficient when
     *               actual coverage_strength meets required strength AND the claim is not a
     *               raw manufacturer_claim.
     *   Accessory line -> coverage is for the explicit required_capability against the
     *                     parent's scenario_need. This is what gives AA-batt two coverage
     *                     rows: one for lichtzekerheid, one for informatiezekerheid.
     */
    const itemCapsCache = new Map();
    const needCapsCache = new Map();
    const snToNeed = new Map(scenarioNeeds.map(s => [s.id, s.need_id]));

    async function getItemCaps(itemId) {
      if (itemCapsCache.has(itemId)) return itemCapsCache.get(itemId);
      const v = await resolveItemCapabilities(c, itemId);
      itemCapsCache.set(itemId, v);
      return v;
    }
    async function getNeedCaps(needId) {
      if (needCapsCache.has(needId)) return needCapsCache.get(needId);
      const v = await resolveNeedCapabilities(c, needId);
      needCapsCache.set(needId, v);
      return v;
    }

    const activeNeedCapabilities = [];
    for (const sn of scenarioNeeds) {
      const needCaps = await getNeedCaps(sn.need_id);
      for (const nc of needCaps) {
        activeNeedCapabilities.push({
          scenario_need_id: sn.id,
          need_id: sn.need_id,
          need_slug: sn.need_slug,
          ...nc,
        });
      }
    }

    for (const line of writtenLines) {
      const itemCaps = await getItemCaps(line.item_id);
      const itemCapById = new Map(itemCaps.map(ic => [ic.capability_id, ic]));
      const writtenCoverage = new Set(); // dedup (scenario_need_id, capability_id)
      const lineRole = derivedLineRole(line);

      for (const src of line.sources) {
        if (src.source_type === 'scenario_need' && src.scenario_need_id) {
          const needId = snToNeed.get(src.scenario_need_id);
          if (!needId) continue;
          const needCaps = await getNeedCaps(needId);
          for (const nc of needCaps) {
            const ic = itemCapById.get(nc.capability_id);
            if (!ic) continue;
            const key = `${src.scenario_need_id}::${nc.capability_id}`;
            if (writtenCoverage.has(key)) continue;
            writtenCoverage.add(key);

            const sufficient =
              lineRole !== 'backup' &&
              lineRole !== 'supporting' &&
              meetsRequiredStrength(ic.coverage_strength, nc.default_required_strength) &&
              ic.claim_type !== 'manufacturer_claim';

            await c.query(
              `INSERT INTO generated_line_coverage
                 (generated_package_line_id, scenario_need_id, capability_id,
                  coverage_strength, counted_as_sufficient, notes)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT DO NOTHING`,
              [
                line.generated_package_line_id,
                src.scenario_need_id,
                nc.capability_id,
                ic.coverage_strength,
                sufficient,
                `Auto-derived: item coverage_strength=${ic.coverage_strength}, claim_type=${ic.claim_type}, required=${nc.default_required_strength}.`,
              ],
            );
          }
        } else if (src.source_type === 'accessory_requirement' && src.required_capability_id && src.scenario_need_id) {
          const ic = itemCapById.get(src.required_capability_id);
          if (!ic) continue;
          const key = `${src.scenario_need_id}::${src.required_capability_id}`;
          if (writtenCoverage.has(key)) continue;
          writtenCoverage.add(key);

          const sufficient = ic.coverage_strength === 'primary' && ic.claim_type !== 'manufacturer_claim';

          await c.query(
            `INSERT INTO generated_line_coverage
               (generated_package_line_id, scenario_need_id, capability_id,
                coverage_strength, counted_as_sufficient, notes)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT DO NOTHING`,
            [
              line.generated_package_line_id,
              src.scenario_need_id,
              src.required_capability_id,
              ic.coverage_strength,
              sufficient,
              `Accessory coverage for ${src.required_capability_slug} via ${line.product_type_slug || 'accessory'}.`,
            ],
          );
        }
      }

      for (const nc of activeNeedCapabilities) {
        const ic = itemCapById.get(nc.capability_id);
        if (!ic) continue;

        const alreadyCovered = writtenCoverage.has(`${nc.scenario_need_id}::${nc.capability_id}`);
        if (alreadyCovered) continue;

        const wouldBeSufficient =
          meetsRequiredStrength(ic.coverage_strength, nc.default_required_strength) &&
          ic.claim_type !== 'manufacturer_claim' &&
          ic.can_replace_primary === true;
        const weakOrBackupEvidence =
          !wouldBeSufficient ||
          ic.coverage_strength === 'backup' ||
          ic.coverage_strength === 'comfort' ||
          ic.claim_type === 'manufacturer_claim' ||
          ic.can_replace_primary === false;

        if (!weakOrBackupEvidence) continue;

        writtenCoverage.add(`${nc.scenario_need_id}::${nc.capability_id}`);
        const weakNote = ic.claim_type === 'manufacturer_claim' || ic.coverage_strength === 'backup'
          ? 'Manufacturer claim / backupfunctie; niet meegeteld als primaire dekking'
          : `Weak coverage: coverage_strength=${ic.coverage_strength}, claim_type=${ic.claim_type}, required=${nc.default_required_strength}; niet meegeteld als primaire dekking.`;

        await c.query(
          `INSERT INTO generated_line_coverage
             (generated_package_line_id, scenario_need_id, capability_id,
              coverage_strength, counted_as_sufficient, notes)
           VALUES ($1,$2,$3,$4,false,$5)
           ON CONFLICT DO NOTHING`,
          [
            line.generated_package_line_id,
            nc.scenario_need_id,
            nc.capability_id,
            ic.coverage_strength,
            weakNote,
          ],
        );
      }
    }

    await c.query(`UPDATE recommendation_run SET status='calculated' WHERE id=$1`, [runId]);
    await c.query('COMMIT');

    /**
     * Output report.
     */
    const out = await c.query(
      `SELECT i.title, i.sku, gpl.quantity, gpl.is_accessory,
              gpl.selection_score, gpl.explanation_public,
              (SELECT count(*) FROM generated_line_source gls WHERE gls.generated_package_line_id = gpl.id) AS source_count,
              (SELECT count(*) FROM generated_line_coverage glc WHERE glc.generated_package_line_id = gpl.id) AS coverage_count
         FROM generated_package_line gpl
         JOIN item i ON i.id = gpl.item_id
        WHERE gpl.recommendation_run_id = $1
        ORDER BY gpl.is_accessory ASC, i.title ASC`,
      [runId],
    );

    console.log(`\nrecommendation_run_id = ${runId}\n`);
    console.log('Generated package lines:');
    console.log('  qty | type      | score | sources | coverage | sku                       | item');
    console.log('  ----+-----------+-------+---------+----------+---------------------------+----------------------------------------------');
    for (const r of out.rows) {
      console.log(
        `  ${String(r.quantity).padStart(3)} | ${(r.is_accessory ? 'accessory' : 'core     ').padEnd(9)} | ${String(r.selection_score).padStart(5)} | ${String(r.source_count).padStart(7)} | ${String(r.coverage_count).padStart(8)} | ${(r.sku || '').padEnd(25)} | ${r.title}`,
      );
    }
    console.log('\nPublic explanations:');
    for (const r of out.rows) {
      console.log(`  - ${r.title}: ${r.explanation_public}`);
    }

    const sources = await c.query(
      `SELECT i.title, gls.source_type, gls.explanation,
              sn_self.id IS NOT NULL AS has_sn,
              parent_i.title AS parent_item
         FROM generated_line_source gls
         JOIN generated_package_line gpl ON gpl.id = gls.generated_package_line_id
         JOIN item i ON i.id = gpl.item_id
         LEFT JOIN scenario_need sn_self ON sn_self.id = gls.scenario_need_id
         LEFT JOIN generated_package_line parent_gpl ON parent_gpl.id = gls.parent_generated_package_line_id
         LEFT JOIN item parent_i ON parent_i.id = parent_gpl.item_id
        WHERE gpl.recommendation_run_id = $1
        ORDER BY i.title, gls.source_type`,
      [runId],
    );
    console.log('\nSources:');
    for (const r of sources.rows) {
      console.log(`  - ${r.title}  [${r.source_type}]${r.parent_item ? ` parent=${r.parent_item}` : ''}: ${r.explanation}`);
    }

    const coverage = await c.query(
      `SELECT i.title, n.slug AS need_slug, c.slug AS capability_slug,
              glc.coverage_strength, glc.counted_as_sufficient, glc.notes
         FROM generated_line_coverage glc
         JOIN generated_package_line gpl ON gpl.id = glc.generated_package_line_id
         JOIN item i ON i.id = gpl.item_id
         JOIN scenario_need sn ON sn.id = glc.scenario_need_id
         JOIN need n ON n.id = sn.need_id
         JOIN capability c ON c.id = glc.capability_id
        WHERE gpl.recommendation_run_id = $1
        ORDER BY i.title, n.slug, c.slug`,
      [runId],
    );
    console.log('\nCoverage:');
    for (const r of coverage.rows) {
      console.log(
        `  - ${r.title}  ${r.need_slug} / ${r.capability_slug}  =>  ${r.coverage_strength}${r.counted_as_sufficient ? ' (sufficient)' : ''}${r.notes ? ` | ${r.notes}` : ''}`,
      );
    }
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    if (options.throwOnError) {
      throw e;
    }
    console.error('Engine failed:', e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_INPUT,
  main,
};
