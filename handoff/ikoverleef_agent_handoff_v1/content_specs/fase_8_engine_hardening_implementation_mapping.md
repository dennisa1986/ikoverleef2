# Fase 8 — Engine hardening implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt de inhoudelijke specificatie voor **Fase 8 — Engine hardening** naar het bestaande Ik overleef-datamodel en de bestaande POC-engine.

Fase 8 is geen contentbatch en introduceert bij voorkeur geen seeddata. De focus ligt op:

- runtime outputstructuur;
- multi-add-on parsing;
- deduplicatiecontrole;
- sectioning;
- tasks;
- warnings;
- QA summary;
- regressions;
- interne webapp-hardening.

## 2. Geen nieuwe enumwaarden

Voeg geen nieuwe enumwaarden toe voor:

```text
core
accessory
supporting
backup
optional
task
warning
section
core_items
accessories
supporting_items
backup_items
optional_additions
warnings
qa_summary
```

Deze termen zijn runtime/UI labels en mogen niet als database enumwaarden worden toegevoegd.

Gebruik bestaande waarden zoals ze al in het schema voorkomen:

- coverage_strength: `primary`, `secondary`, `backup` en eventueel bestaande waarden zoals `comfort` indien al aanwezig;
- source_type: `scenario_need`, `accessory_requirement`;
- claim_type: bestaande waarden zoals `verified_spec`, `assumed`, eventueel andere bestaande waarden als de mapping-check ze aantreft;
- quantity_policy.formula_type: bestaande waarden zoals `fixed`, `per_person`, `per_person_per_day`, `per_adult_per_day`, `per_child_per_day`, `per_household`;
- usage constraint types: alleen bestaande waarden.

## 3. Geen schemawijzigingen

Niet toevoegen:

- `generated_package_line.role`;
- `generated_package_line.section`;
- `generated_warning`;
- `recommendation_output_section`;
- `optional_addition`;
- nieuwe warningtabel;
- nieuwe tasktabel;
- nieuwe QA-view tenzij expliciet bestaand patroon en geen schema-impact;
- nieuwe supplier_offer velden;
- nieuwe profile/customer tabellen.

Fase 8 moet werken met bestaande tabellen:

- `recommendation_run`
- `recommendation_run_addon`
- `generated_package_line`
- `generated_line_source`
- `generated_line_coverage`
- `item_usage_constraint`
- `preparedness_task`
- scenario/need/capability/productrule/productvariant/candidate-tabellen
- bestaande QA views.

## 4. Section mapping

Runtime sections worden afgeleid in code. Een mogelijke helper:

```js
function classifyLine(line, sources, coverage, constraints) {
  // returns: core | accessory | supporting | backup | optional
}
```

Mapping:

### core

Gebruik `core` als:

- `is_core_line = true`;
- `is_accessory = false`;
- en er sufficient coverage bestaat;
- en het item niet governance-bekend supporting/backup is.

### accessory

Gebruik `accessory` als:

- `is_accessory = true`;
- of source_type `accessory_requirement` aanwezig is;
- of bestaande producttype-slug uit accessoirepatroon komt.

Voorbeelden van accessoireproducttypes:

- batterijen;
- kabels;
- gascartouche;
- ontsteking;
- kookvat;
- sanitair-absorptiemiddel;
- zipbags;
- nitril-handschoenen;
- verbandtape;
- paracord;
- tarp-haringen.

### supporting

Gebruik `supporting` als:

- coverage_strength hoofdzakelijk `secondary` is;
- counted_as_sufficient false of ondersteunend is;
- item bekend supporting-governance heeft;
- producttype/need duidt op ondersteunende dekking.

Voorbeelden:

- waterfilter;
- waterzuiveringstabletten;
- filterfles;
- buitenkooktoestel;
- thermometer;
- tarp-light;
- grondzeil.

### backup

Gebruik `backup` als:

- coverage_strength `backup` is;
- internal explanation/governance backup noemt;
- item niet primary sufficient mag zijn.

Voorbeelden:

- radio zwengel/solar-functies;
- waterbehandeling als backup;
- nooddeken/noodbivvy als backup warmte;
- filterfles bij drinkwaterzekerheid.

### optional

Fase 8 hoeft geen actieve optional items te genereren. Voeg een runtime section `optional_additions: []` toe.

Als bestaande productregels met `role = optional` veilig uitgelezen kunnen worden zonder generated package lines te maken, mogen ze intern als optional candidates worden getoond, maar niet als core productline.

## 5. Warning mapping

Warnings worden runtime verzameld uit:

1. `item_usage_constraint`;
2. internal/public explanations met governance-notes;
3. claim-governance records indien bestaand beschikbaar;
4. QA warning/context views.

Structuur in output mag bijvoorbeeld zijn:

```js
warnings: [
  {
    line_id,
    sku,
    item_title,
    warning_type,
    severity,
    public_warning,
    internal_notes,
    blocks_recommendation,
    source: 'item_usage_constraint'
  }
]
```

Dit is een JavaScript/outputobject, geen databasewijziging.

Gebruik bestaande `item_usage_constraint` velden. Voeg geen constraint enum toe.

## 6. Task mapping

Tasks blijven uit `preparedness_task`.

Mapping:

- active scenarios worden bepaald via package + add-ons;
- `preparedness_task.scenario_need_id` koppelt task aan actieve scenario need;
- task-only needs blijven content_only;
- tasks genereren geen productline tenzij er bestaande productregels zijn.

Fase 8 moet task-output als eigen runtime section tonen:

```js
tasks: [...]
```

Geen nieuwe tasktabel.

## 7. Multi-add-on mapping

### Engine

`calculate.js` gebruikt al `addon_slugs` als array. Fase 8 moet deze route blijven gebruiken.

CLI/env parsing mag meerdere add-ons accepteren via komma’s:

```bash
IOE_ADDON_SLUGS=evacuatie,drinkwater npm run calc
node calculate.js --addon_slugs=evacuatie,drinkwater
```

### Interne webapp

De huidige POC gebruikt waarschijnlijk `addon=` als enkelvoudige waarde. Fase 8 moet één van deze routes kiezen:

Voorkeur:

```text
/internal/recommendation-poc?addon=evacuatie,drinkwater&tier=basis_plus
```

Alternatief:

```text
/internal/recommendation-poc?addons=evacuatie,drinkwater&tier=basis_plus
```

Gebruik bij voorkeur `addon=` voor backwards compatibility, maar parse comma-separated values.

Backwards compatibility:

```text
addon=drinkwater
```

moet blijven werken.

## 8. Dedupe mapping

Bestaand gedrag:

```text
dedupe per item_id
quantity = max(quantity)
sources worden samengevoegd
```

Fase 8 moet dit expliciet valideren, niet conceptueel wijzigen.

Niet doen:

- geen optellen van quantities zonder policybesluit;
- geen nieuw dedupe-key schema;
- geen sourceverlies bij dedupe;
- geen coverageverlies bij dedupe.

Regression moet checken dat hergebruikte items bij multi-add-on runs één generated line krijgen en meerdere sources/coverage behouden.

## 9. Runtime QA mapping

Gebruik bestaande QA views:

Blocking views uit bestaande regressions:

- `qa_active_scenarios_without_needs`
- `qa_active_needs_without_capabilities`
- `qa_scenario_needs_without_product_rules`
- `qa_product_types_without_capabilities`
- `qa_active_items_without_capabilities`
- `qa_variant_item_product_type_mismatch`
- `qa_default_candidate_conflicts`
- `qa_items_with_claimed_primary_coverage`
- `qa_required_accessories_missing_candidate_items`
- `qa_active_consumables_without_quantity_policy`
- `qa_claim_governance_scope_invalid`
- `qa_quantity_policy_invalid_scope`

Generated-run views:

- `qa_generated_lines_without_sources`
- `qa_generated_line_product_type_mismatch`

Warning/context views indien aanwezig:

- `qa_active_accessory_items_without_capabilities`
- `qa_supplier_offers_stale`
- `qa_evacuation_items_without_physical_specs`
- `qa_weather_items_without_environmental_specs`

Fase 8 mag deze views alleen lezen. Geen nieuwe QA-view verplicht.

## 10. API/output helper mapping

Voeg desnoods een interne helper toe in `calculate.js` of aparte module binnen backend, bijvoorbeeld:

```js
buildRecommendationOutput(runId)
```

of:

```js
loadRecommendationOutput(client, runId)
```

De helper mag output structureren als:

```js
{
  run,
  input,
  sections: {
    core_items: [],
    accessories: [],
    supporting_items: [],
    backup_items: [],
    optional_additions: []
  },
  tasks: [],
  warnings: [],
  coverage: [],
  sources: [],
  qa_summary: {}
}
```

Belangrijk:

- dit is runtime JSON/JS, geen database schema;
- bestaande console output mag blijven;
- regression mag helper gebruiken als die wordt geëxporteerd;
- interne webapp mag dezelfde helper of gelijkwaardige querylogica gebruiken.

## 11. Interne webapp mapping

Webapp moet tonen:

- actieve add-ons als lijst;
- multi-add-on input;
- household profile;
- duration;
- sectioned output;
- tasks;
- warnings;
- QA summary;
- sources en coverage per item.

Geen nieuwe klantflow.

Backwards compatibility:

- bestaande single-add-on links blijven werken;
- existing routes met `addon=stroomuitval` enzovoort blijven werken.

## 12. Regression mapping

Nieuwe test:

```text
backend/regression_engine_hardening_poc.js
```

Npm-script:

```json
"test:engine-hardening-poc": "node regression_engine_hardening_poc.js"
```

Testinput minimaal:

```js
[
  { tier: 'basis_plus', addon_slugs: ['stroomuitval', 'evacuatie'] },
  { tier: 'basis_plus', addon_slugs: ['drinkwater', 'evacuatie'] },
  { tier: 'basis_plus', addon_slugs: ['drinkwater', 'taken_profielen'], children: 1, pets: 1 },
  { tier: 'basis_plus', addon_slugs: ['stroomuitval','drinkwater','voedsel_bereiding','hygiene_sanitatie_afval','ehbo_persoonlijke_zorg','warmte_droog_shelter_light','evacuatie','taken_profielen'] }
]
```

Validaties:

- run exists;
- generated lines exist where product add-ons are present;
- tasks exist where `taken_profielen` is present;
- dedupe source counts >= expected for reused items;
- section output has all expected section keys;
- optional_additions exists, may be empty;
- warnings exist where usage constraints exist;
- QA blocking = 0;
- generated line source mismatch views = 0.

## 13. Commit/release mapping

Voorgestelde release note:

```text
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v0.9.0_engine_hardening_baseline.md
```

Voorgestelde tag:

```text
v0.9.0-engine-hardening-baseline
```

Voorgestelde commit:

```text
feat(engine): harden recommendation output for mvp
```

## 14. Mapping-check format

Agent moet vóór implementatie rapporteren:

```md
# Mapping-check Fase 8 — Engine hardening

## Baseline
- Laatste remote baseline:
- Tag:

## Schema-impact
- Geen schemawijziging nodig.
- Geen nieuwe enumwaarden nodig.
- Geen supplier_offer uitbreiding nodig.
- Geen Directus composite-PK wijziging nodig.

## Runtime section mapping
- core:
- accessory:
- supporting:
- backup:
- optional:
- tasks:
- warnings:

## Multi-add-on mapping
- `addon=` comma-separated blijft backwards compatible.
- `addon_slugs` blijft array in engine.

## Dedupe mapping
- item_id dedupe blijft leidend.
- quantity=max blijft bestaand gedrag.
- sources blijven behouden.
- coverage blijft behouden.

## QA mapping
- bestaande QA views worden gelezen.
- geen nieuwe QA views vereist.

## Go / no-go
Conclusie:
- Implementatie kan doorgaan binnen bestaand datamodel.
```

## 15. Stopcriteria

Stop als Fase 8 alleen kan met:

- nieuwe enumwaarde;
- schemawijziging;
- nieuwe supplier_offer velden;
- nieuwe generated output tables;
- wijziging van Directus composite PK’s;
- conceptuele modelwijziging van package/add-on → item;
- verlies van bestaande regressions;
- forced quantity optelling zonder policybesluit;
- checkout/account/klantprofielopslag.
