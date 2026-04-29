# Fase 9 — Backoffice hardening implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt de inhoudelijke specificatie `fase_9_backoffice_hardening_v1.md` naar een implementatieaanpak binnen het bestaande Ik overleef-datamodel.

Fase 9 is geen nieuwe contentbatch. Er worden bij voorkeur geen nieuwe domeinitems, scenario’s, needs, capabilities of productregels toegevoegd. De fase richt zich op beheerbaarheid en inspectie.

## 2. Geen nieuwe enumwaarden

Niet toevoegen:

- `ready` als database enum;
- `blocked` als database enum;
- `needs_attention` als database enum;
- `poc_only` als database enum;
- `governance_risk` als database enum;
- `backoffice_status` enum;
- nieuwe QA status enum;
- nieuwe supplier status enum;
- nieuwe readiness enum;
- nieuwe warning enum;
- nieuwe output section enum.

Deze termen zijn uitsluitend runtime/UI-labels of rapportagetermen.

## 3. Geen schemawijzigingen

Niet toevoegen:

- nieuwe backoffice tabellen;
- nieuwe release registry tabel;
- nieuwe dashboard tabel;
- nieuwe readiness kolommen;
- nieuwe generated_package_line.role kolom;
- nieuwe generated_package_line.section kolom;
- nieuwe supplier_offer velden;
- nieuwe Directus surrogate IDs;
- nieuwe warning tabel;
- nieuwe optional addition tabel.

Alle output moet worden afgeleid uit bestaande tabellen, bestaande views, bestaande release notes/config of runtimequeries.

## 4. Mapping naar bestaande databaseconcepten

### 4.1 Scenario matrix

Afleiden uit bestaande tabellen zoals:

- `scenario`
- `scenario_need`
- `need`
- `need_capability` of bestaande need/capability-relatie
- `capability`
- `scenario_need_product_rule` of bestaande productregelstructuur
- `product_type`
- `item_candidate` of bestaande candidate-tabel
- `tier`
- `item`
- `item_capability`
- `accessory_requirement`
- `claim_governance_rule`
- `item_usage_constraint`

Als exacte tabelnamen afwijken: inspecteer de bestaande schema’s en gebruik de bestaande namen.

### 4.2 Product readiness

Runtime readiness afleiden uit bestaande velden:

- item status;
- producttype aanwezig;
- item capability count;
- supplier offer count;
- usage constraint count;
- governance rule count;
- active candidate count;
- QA view hits;
- source/coverage completeness waar via generated output beschikbaar.

Runtime labels:

- `ready`
- `needs_attention`
- `blocked`
- `poc_only`

Niet opslaan als enum of kolom.

### 4.3 Candidate readiness

Afleiden uit:

- candidate item;
- tier;
- producttype;
- default candidate marker;
- item status;
- producttype match;
- default candidate conflict QA;
- supplier offer presence;
- capabilities.

### 4.4 Governance attention

Afleiden uit:

- `claim_governance_rule`
- `item_usage_constraint`
- generated warnings uit Fase 8 runtime output;
- `blocks_recommendation`
- `severity`
- public/internal notes.

Geen nieuwe governance type enums toevoegen.

### 4.5 Supplier offer attention

Afleiden uit bestaande supplier_offer velden en bestaande QA views, zoals:

- supplier offer count per item;
- status indien bestaand;
- stale QA view indien bestaand;
- existing notes indien aanwezig.

Niet toevoegen aan `supplier_offer`:

- `source_url`
- `source_checked_at`
- `claim_coverage`
- `price_status`
- `source_status`

## 5. SQL view mapping

Nieuwe SQL views zijn toegestaan als zij:

- read-only zijn;
- alleen bestaande tabellen gebruiken;
- geen enumwaarden toevoegen;
- geen tabellen wijzigen;
- geen data migreren;
- geen Directus composite-PK wijziging vereisen.

Voorkeursnamen, alleen indien passend bij bestaande conventie:

```txt
bo_scenario_matrix
bo_product_readiness
bo_candidate_readiness
bo_governance_attention
bo_supplier_offer_attention
bo_qa_dashboard_summary
```

Als bestaande naming convention anders is, volg die.

Als views aanmaken in deze repo niet past bij het bestaande patroon, implementeer dezelfde queries in de interne POC en regression zonder database views.

## 6. Directus mapping

Fase 9 mag documenteren welke views in Directus beheerbaar/zichtbaar zouden moeten worden, maar hoeft geen volledige Directus configuratie of role/permission export te leveren.

Toegestaan:

- read-only SQL views maken die Directus later kan tonen;
- documentatie toevoegen voor Directus collectiegebruik;
- interne webapp als inspectiefront gebruiken.

Niet toegestaan:

- Directus schema wijzigen;
- composite PK oplossen met surrogate IDs;
- Directus role/permission redesign;
- auth toevoegen;
- klantaccount toevoegen.

## 7. Backoffice route mapping

Interne route:

```txt
/internal/backoffice-poc
```

Optionele queryfilters:

```txt
domain=qa
domain=readiness
domain=governance
domain=scenarios
```

Deze route leest:

- QA views;
- readiness queries;
- governance queries;
- supplier attention queries;
- release baseline static config.

Geen klantgerichte route.

## 8. Release baseline mapping

Omdat er geen release registry tabel komt, baseline-info als runtime/static config of documentatie:

```js
const RELEASE_BASELINES = [
  'v0.1.0-stroomuitval-baseline',
  'v0.2.0-drinkwater-baseline',
  'v0.3.0-voedsel-bereiding-baseline',
  'v0.4.0-hygiene-sanitatie-baseline',
  'v0.5.0-ehbo-baseline',
  'v0.6.0-warmte-droog-shelter-light-baseline',
  'v0.7.0-evacuatie-baseline',
  'v0.8.0-taken-profielen-baseline',
  'v0.9.0-engine-hardening-baseline'
]
```

Beoogde Fase 9 tag:

```txt
v0.10.0-backoffice-hardening-baseline
```

## 9. QA mapping

Gebruik bestaande QA-views. Bekende voorbeelden uit eerdere fases:

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
- `qa_generated_lines_without_sources`
- `qa_generated_line_product_type_mismatch`
- warning/context views zoals supplier stale, physical specs, environmental specs indien aanwezig.

Gebruik exacte bestaande viewnamen na schema-inspectie.

## 10. Regression mapping

Nieuwe regression:

```txt
backend/regression_backoffice_hardening_poc.js
```

Package script:

```json
"test:backoffice-hardening-poc": "node regression_backoffice_hardening_poc.js"
```

Regression test:

- QA summary query returns rows;
- scenario matrix query returns rows;
- product readiness query returns rows;
- candidate readiness query returns rows;
- governance attention query returns rows or zero-row valid structure;
- supplier attention query returns rows or zero-row valid structure;
- release baseline config contains expected baselines;
- internal backoffice route can render or core renderer can be invoked;
- no schema migration required;
- all existing regressions green.

## 11. Backwards compatibility

Fase 9 mag geen bestaande output breken:

- recommendation engine output blijft werken;
- Fase 8 runtime sections blijven werken;
- alle bestaande regression scripts blijven groen;
- interne recommendation POC blijft werken;
- multi-add-on URLs blijven werken.

## 12. Commit/tag mapping

Voorgestelde docs/implementation files:

```txt
fase_9_backoffice_hardening_v1.md
fase_9_backoffice_hardening_implementation_mapping.md
backend/regression_backoffice_hardening_poc.js
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v0.10.0_backoffice_hardening_baseline.md
```

Eventuele SQL view file, alleen als passend:

```txt
handoff/ikoverleef_agent_handoff_v1/database/backoffice_hardening_views.sql
```

Voorgestelde release commit:

```txt
feat(backoffice): add backoffice hardening baseline
```

Voorgestelde tag:

```txt
v0.10.0-backoffice-hardening-baseline
```

## 13. Stopcondities

Stop en rapporteer als implementatie alleen lukt met:

- nieuwe enumwaarde;
- schemawijziging;
- supplier_offer uitbreiding;
- Directus composite-PK aanpassing;
- nieuwe outputtabellen;
- klantaccount/auth;
- checkout;
- directe package/add-on → item koppeling;
- wijziging aan recommendation semantics;
- wijziging aan scoring/quantity/coverage zonder expliciete opdracht.
