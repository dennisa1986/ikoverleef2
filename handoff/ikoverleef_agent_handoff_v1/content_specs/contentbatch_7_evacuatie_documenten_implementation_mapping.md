# contentbatch_7_evacuatie_documenten_implementation_mapping.md

**Project:** Ik overleef  
**Fase:** Fase 6 — Contentbatch 7 Evacuatie & documenten  
**Documenttype:** Implementatie-mapping naar bestaand datamodel  
**Status:** Verplicht vóór seed/engine/webapp/regression implementatie  
**Datum:** 2026-04-29  
**Hoort bij:** `contentbatch_7_evacuatie_documenten_v1.md`  
**Vorige baseline:** `v0.6.0-warmte-droog-shelter-light-baseline`  
**Beoogde baseline na implementatie:** `v0.7.0-evacuatie-baseline`

---

## 0. Doel en harde implementatieregel

Dit document vertaalt de inhoudelijke specificatie voor Contentbatch 7 naar de bestaande database- en engineconventies van Ik overleef.

De specificatie beschrijft wat inhoudelijk moet kloppen. Dit mappingdocument bepaalt hoe dat binnen het bestaande datamodel moet worden geïmplementeerd.

Vaste regels:

1. Eerst inhoudelijke specificatie.
2. Daarna expliciete implementation mapping naar het bestaande schema.
3. Daarna mapping-check.
4. Pas daarna seed/engine/webapp/regression implementeren.
5. Geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen zonder expliciete toestemming.
6. Database-first blijven.
7. Packages en add-ons nooit direct aan items koppelen.
8. Packages en add-ons activeren scenario’s.
9. Bestaande slugs, enumwaarden, QA-views en engineconcepten blijven leidend.

Bij conflict tussen specificatietaal en bestaande schemawaarden gaat dit mappingdocument voor.

---

## 1. Definitieve add-on slug

Gebruik voor Fase 6 consequent:

```text
addon=evacuatie
```

Deze slug is gekozen omdat Evacuatie een frontstage/commerciële MVP-add-on is. Documenten, signalering, licht en drinkwater onderweg zijn scenario’s binnen deze add-on.

Inspectieregel vóór implementatie:

Als de database al een andere slug vereist, bijvoorbeeld `evacuatie_documenten`, stop dan en rapporteer:

- welke slug al bestaat;
- waarom die gekozen zou moeten worden;
- impact op seed, engine, webapp en regression;
- of dit een scopewijziging betekent.

Zonder expliciet akkoord blijft `evacuatie` leidend.

Architectuurregel: de add-on activeert scenario’s. Geen directe add-on → item of package → item koppeling.

---

## 2. Code naar database-slug mapping

### 2.1 Add-on

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `ADDON-EVACUATION-DOCUMENTS` | `evacuatie` | Definitieve voorkeurslug. |

### 2.2 Scenario’s

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `SCN-EVAC-READY-HOME-72H` | `evacuatiegereed-thuis-72u` | Tas/container en gereedheid. |
| `SCN-DOCUMENT-SAFETY-EVAC` | `documentveiligheid-evacuatie` | Documentenmap + documenttasks. |
| `SCN-SIGNALING-EVAC` | `signalering-evacuatie` | Noodfluit en reflectie. |
| `SCN-LIGHT-ON-THE-MOVE-EVAC` | `licht-onderweg-evacuatie` | Licht onderweg, hergebruik stroomuitval. |
| `SCN-WATER-ON-THE-MOVE-EVAC` | `drinkwater-onderweg-evacuatie` | Water meenemen, hergebruik drinkwater. |
| `SCN-PERSONAL-READINESS-EVAC` | `persoonlijke-gereedheid-evacuatie` | Tasks/checks. |

### 2.3 Needs

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `NEED-EVAC-BAG-CARRY` | `evacuatietas-dragen` | Tas/container gebruiken. |
| `NEED-DOCUMENT-PROTECTION` | `documenten-beschermen` | Documentenmap. |
| `NEED-DOCUMENT-TASKS` | `documenten-checklist` | Task/content-only. |
| `NEED-SIGNALING-AUDIBLE` | `hoorbaar-signaleren` | Noodfluit. |
| `NEED-VISIBILITY-ON-THE-MOVE` | `zichtbaar-onderweg` | Reflectie. |
| `NEED-LIGHT-ON-THE-MOVE` | `licht-onderweg` | Headlamp/portable light. |
| `NEED-WATER-CARRY-EVAC` | `drinkwater-meenemen-evacuatie` | Drinkfles/filterfles. |
| `NEED-PERSONAL-READINESS-TASKS` | `persoonlijke-gereedheid-checks` | Task/content-only. |

### 2.4 Capabilities

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `CAP-EVAC-BAG-CARRY` | `evacuatietas-gebruiken` | Carry/packability, geen inhoudscoverage. |
| `CAP-DOCUMENT-WATERPROOF-STORAGE` | `documenten-waterdicht-bewaren` | Documentenmap. |
| `CAP-DOCUMENT-CHECKLIST` | `documenten-checklist-bijhouden` | Task-only. |
| `CAP-AUDIBLE-SIGNALING` | `hoorbaar-signaleren` | Noodfluit. |
| `CAP-VISIBILITY-REFLECTIVE` | `reflecterend-zichtbaar-zijn` | Reflectie. |
| `CAP-HANDS-FREE-LIGHT` | `handsfree-licht-onderweg` | Hoofdlamp. |
| `CAP-PORTABLE-LIGHT` | `draagbaar-licht-onderweg` | Zaklamp alternatief. |
| `CAP-WATER-CARRY` | `drinkwater-meenemen` | Drinkfles. |
| `CAP-WATER-FILTER-CARRY-BACKUP` | `water-filteren-onderweg-backup` | Filterfles supporting/backup. |
| `CAP-PERSONAL-READINESS-CHECKLIST` | `persoonlijke-gereedheid-checklist` | Task-only. |

### 2.5 Producttypes

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `PTYPE-EVAC-BAG` | `evacuatietas` | Nieuwe producttype indien nog niet bestaand. |
| `PTYPE-WATERPROOF-DOC-FOLDER` | `waterdichte-documentenmap` | Nieuwe producttype indien nog niet bestaand. |
| `PTYPE-WHISTLE` | `noodfluit` | Nieuwe producttype indien nog niet bestaand. |
| `PTYPE-REFLECTIVE-VISIBILITY` | `reflectievest` | Reflectie/zichtbaarheid. |
| `PTYPE-HEADLAMP` | `hoofdlamp` | Hergebruik bestaand uit stroomuitval. |
| `PTYPE-FLASHLIGHT` | `zaklamp` | Hergebruik bestaand alternatief. |
| `PTYPE-WATER-BOTTLE` | `drinkfles` | Hergebruik bestaand uit drinkwater. |
| `PTYPE-FILTER-BOTTLE` | `filterfles` | Hergebruik bestaand uit drinkwater. |

### 2.6 Items

| Item code | Aanbevolen item-slug | Opmerking |
|---|---|---|
| `IOE-EVAC-BAG-BASIC` | `ioe-evac-bag-basic` | Nieuwe POC-item. |
| `IOE-EVAC-BAG-PLUS` | `ioe-evac-bag-plus` | Nieuwe POC-item. |
| `IOE-DOC-FOLDER-BASIC` | `ioe-doc-folder-basic` | Nieuwe POC-item. |
| `IOE-DOC-FOLDER-PLUS` | `ioe-doc-folder-plus` | Nieuwe POC-item. |
| `IOE-WHISTLE-BASIC` | `ioe-whistle-basic` | Nieuwe POC-item. |
| `IOE-WHISTLE-PLUS` | `ioe-whistle-plus` | Nieuwe POC-item. |
| `IOE-REFLECTIVE-VEST-BASIC` | `ioe-reflective-vest-basic` | Nieuwe POC-item. |
| `IOE-REFLECTIVE-VEST-PLUS` | `ioe-reflective-vest-plus` | Nieuwe POC-item. |
| `IOE-HEADLAMP-AAA-BASIC` | bestaande item-slug | Hergebruik indien bestaand. |
| `IOE-HEADLAMP-AAA-PLUS` | bestaande item-slug | Hergebruik indien bestaand. |
| `IOE-BOTTLE-1L-BASIC` | bestaande item-slug | Hergebruik indien bestaand. |
| `IOE-BOTTLE-1L-PLUS` | bestaande item-slug | Hergebruik indien bestaand. |
| `IOE-FILTERBOTTLE-PLUS` | bestaande item-slug | Hergebruik indien bestaand. |

---

## 3. Geen nieuwe enumwaarden

Fase 6 mag geen nieuwe enumwaarden toevoegen zonder expliciete toestemming.

Semantische intenties die niet blind als enums mogen worden toegevoegd:

| Term | Niet doen | Wel doen |
|---|---|---|
| `container` | Niet als nieuwe line role enum. | Afleiden via producttype, explanation en coverage. |
| `packability` | Niet als nieuwe coverage enum. | Gebruik bestaande physical specs indien aanwezig, anders notes/internal explanation. |
| `task_only` | Niet als nieuwe enum tenzij bestaand. | Gebruik bestaande `preparedness_task` of `content_only`/notes. |
| `document_task` | Niet als nieuwe enum. | Gebruik task/checklistmechaniek. |
| `required_personal_action` | Niet als enum. | Task/public explanation. |
| `filter_backup` | Niet als nieuwe enum. | `coverage_strength = secondary` of `backup`. |

---

## 4. Coverage mapping

Gebruik uitsluitend bestaande coverage enumwaarden:

```text
primary
secondary
backup
```

| Specificatieterm | Database-mapping | Uitleg |
|---|---|---|
| `primary` | `coverage_strength = primary` | Alleen voor de bedoelde need. |
| `supporting` | `coverage_strength = secondary` of `backup` | Geen nieuwe enum. |
| `container` | primary voor `evacuatietas-dragen`, geen dekking voor inhoudsneeds | Tas mag geen water/licht/document needs dekken. |
| `task_only` | preparedness_task/content_only/notes | Geen generated productline. |
| `filter_backup` | `secondary` of `backup` | Filterfles vervangt geen drinkwaterbasis. |

Toegestane sufficient coverage:

| Need-slug | Capability-slug | Toegestane sufficient coverage |
|---|---|---|
| `evacuatietas-dragen` | `evacuatietas-gebruiken` | `primary` |
| `documenten-beschermen` | `documenten-waterdicht-bewaren` | `primary` |
| `hoorbaar-signaleren` | `hoorbaar-signaleren` | `primary` |
| `zichtbaar-onderweg` | `reflecterend-zichtbaar-zijn` | `primary` of `secondary` |
| `licht-onderweg` | `handsfree-licht-onderweg` | `primary` |
| `licht-onderweg` | `draagbaar-licht-onderweg` | `primary` of `secondary` |
| `drinkwater-meenemen-evacuatie` | `drinkwater-meenemen` | `primary` |
| `drinkwater-meenemen-evacuatie` | `water-filteren-onderweg-backup` | `secondary`/`backup` |

Verboden coverage:

- Evacuatietas mag geen dekking voor water, licht, documenteninhoud, EHBO, warmte of voedsel geven.
- Documentenmap mag geen documentcompleetheid dekken.
- Noodfluit mag geen communicatiezekerheid of redding dekken.
- Reflectievest mag geen veiligheidsgarantie claimen.
- Drinkfles mag geen thuisvoorraad of waterzuivering dekken.
- Filterfles mag geen universeel veilig water of voorraadvervanging claimen.
- Tasks mogen geen productcoverage genereren.

---

## 5. Claim type mapping

Gebruik alleen bestaande `claim_type` waarden. Bekend beschikbaar:

```text
verified_spec
assumed
```

Als `tested` aantoonbaar bestaat, alleen gebruiken voor daadwerkelijk geteste claims.

| Specificatieterm | Database-mapping | Opmerking |
|---|---|---|
| `validated` | `verified_spec` of `tested` indien bestaand | Productspecificaties. |
| `source_supported_or_poc` | `assumed` of `verified_spec` met internal note | POC-data duidelijk markeren. |
| `poc_assumption` | `assumed` + internal explanation | Geen nieuwe enum. |
| `manufacturer_claim` | Alleen gebruiken als al bestaand | Mag niet automatisch sufficient coverage geven. |
| `evacuation_safety_claim` | Niet als claim type | Governance/usage warning/notes. |

Stop en rapporteer als `verified_spec` of `assumed` niet bestaan.

---

## 6. Usage constraint mapping

Gebruik alleen bestaande `item_usage_constraint` types. Bekende types uit eerdere fasen zijn onder meer:

```text
medical_claim_limit
storage_safety
expiry_sensitive
hygiene_contamination_risk
fire_risk
child_safety
disposal_requirement
dosage_warning
```

Voor Fase 6 moet de agent eerst inspecteren welke bestaande constraint types beschikbaar zijn. Gebruik de beste bestaande fit. Als een gewenste nuance niet als bestaande enum bestaat, leg die vast in `public_warning`, `internal_notes`, item notes, claim governance of explanation.

Conceptterm mapping:

| Conceptterm | Voorkeursmapping | Fallback |
|---|---|---|
| `check_batteries` | bestaande battery/storage/expiry constraint indien aanwezig | public/internal warning |
| `not_full_evacuation_guarantee` | governance/public warning | internal explanation |
| `document_privacy` | storage_safety/privacy note indien mogelijk | public/internal warning |
| `follow_authorities` | governance note | public explanation |
| `visibility_not_guaranteed` | safety/governance note | public/internal warning |
| `filter_limitations` | bestaande waterfilter governance | public/internal warning |
| `pack_weight_warning` | physical/packability note indien bestaand | internal/public warning |
| `keep_documents_updated` | preparedness_task | task note |

---

## 7. Quantity policy mapping

Gebruik geen nieuwe `quantity_policy.formula_type` of rounding enums.

Bekende bestaande mechaniek uit eerdere batches:

```text
fixed
per_person
per_person_per_day
pack_size rounding
```

Gebruik `per_person` alleen als deze aantoonbaar bestaat. Als `per_person` niet bestaat, gebruik een schema-veilig bestaand alternatief, bijvoorbeeld `per_person_per_day` met passende factor, of `fixed` met POC-note. Rapporteer de keuze in de mapping-check.

| Conceptterm | Database-mapping | Opmerking |
|---|---|---|
| `one_per_household` | `fixed`, `base_amount = 1` | Tas/documentenmap. |
| `per_person` | bestaande `per_person` indien aanwezig | Fluit/reflectie/headlamp/bottle. |
| `per_person_poc_fixed` | fixed POC als per_person ontbreekt | Internal note vereist. |
| `reuse_existing_quantity` | bestaande policy van hergebruikte productregel | Headlamp/drinkfles. |
| `basis_plus_supporting_only` | tier/productvariant/candidate mapping | Filterfles Plus. |
| `task_only` | geen quantity policy | Preparedness_task/content_only. |

Aanbevolen POC quantities bij 2 volwassenen / 72 uur:

| Producttype | Policy mapping | POC-aantal |
|---|---|---:|
| `evacuatietas` | fixed 1 | 1 |
| `waterdichte-documentenmap` | fixed 1 | 1 |
| `noodfluit` | per_person of fixed POC | 2 of 1 |
| `reflectievest` | per_person of fixed POC | 2 of 1 |
| `hoofdlamp` | per_person/reuse existing | 2 of bestaand |
| `drinkfles` | per_person/reuse existing | 2 of bestaand |
| `filterfles` | Plus supporting fixed/per_person | 1 of bestaand |
| tasks | task_only | 0 productregels |

---

## 8. Accessoire requirement mapping

Gebruik bestaande `item_accessory_requirement` mechaniek waar mogelijk. Voeg geen nieuwe source_type enum toe.

Gebruik `generated_line_source.source_type = accessory_requirement` alleen als deze waarde al bestaat.

Accessoireketens:

| Parent/context | Required producttype | Mapping |
|---|---|---|
| Hoofdlamp | batterijen indien bestaande accessoireketen al bestaat | Hergebruik stroomuitvalpatroon. |
| Evacuatietas | geen standaard inhoud | Niet gebruiken als parent voor alle items. |
| Documentenmap | geen documentproducten | Tasks/checks. |
| Drinkfles/filterfles | geen thuisvoorraad | Productregel, geen accessoire van tas. |

Niet toegestaan:

```text
evacuatietas -> documentenmap
evacuatietas -> fluit
evacuatietas -> licht
evacuatietas -> waterfles
evacuatietas -> alle inhoud
```

Deduplicatie:

```text
Eén generated line per item, met meerdere generated_line_source regels, tenzij een bestaande quantity policy bewust optelling vereist.
```

Voorbeelden: headlamp bij stroomuitval + evacuatie; drinkfles bij drinkwater + evacuatie; filterfles bij drinkwater + evacuatie.

---

## 9. Physical/packability mapping

Gebruik bestaande physical/packability-specificaties als het schema die al ondersteunt.

Niet doen:

- geen nieuwe physical_specs tabel;
- geen nieuwe enumwaarden;
- geen schemawijziging voor gewicht/volume/packability.

Als bestaande physical specs velden/tabel bestaan, seed POC-waarden voor evacuatie-items waar QA dat vereist. Als alleen warning-QA bestaat en geen verplicht patroon beschikbaar is, rapporteer dat als open punt en leg packability vast in notes/internal explanations.

---

## 10. Supplier/source-regels

Geen supplier_offer schema-uitbreiding.

Niet toevoegen:

```text
source_status
source_url
source_checked_at
claim_coverage
price_status
packability_status
document_status
evacuation_claim_status
```

POC-sourceinformatie kan worden vastgelegd in bestaande velden zoals item notes, internal explanations, public explanations, claim governance notes, usage constraint notes, physical specs indien bestaand, en bestaande supplier_offer velden.

Elke generated line moet minimaal één `generated_line_source` hebben.

---

## 11. Supporting/core/accessory output mapping

| Producttype | Verwacht intern label | Mapping |
|---|---|---|
| `evacuatietas` | core/container | Productregel voor `evacuatietas-dragen`; geen inhoudscoverage. |
| `waterdichte-documentenmap` | core | Productregel voor `documenten-beschermen`. |
| `noodfluit` | core | Productregel voor `hoorbaar-signaleren`. |
| `reflectievest` | core/supporting | Productregel voor `zichtbaar-onderweg`. |
| `hoofdlamp` | core/reuse | Productregel voor `licht-onderweg`; dedupe met stroomuitval. |
| `zaklamp` | supporting/alternative | Alleen als gekozen. |
| `drinkfles` | core/reuse | Productregel voor `drinkwater-meenemen-evacuatie`. |
| `filterfles` | supporting/backup | Plus/reuse; filterfunctie niet primary waterbasis. |
| tasks | task/check | Preparedness_task/content_only, geen generated package line. |

Webapp-labels zoals `core`, `supporting`, `accessory`, `backup`, `task` mogen niet als nieuwe database-enums worden toegevoegd.

---

## 12. Task/check mapping

Gebruik bestaand `preparedness_task`-mechaniek als aanwezig.

Minimale tasks:

| Task slug | Need | Opmerking |
|---|---|---|
| `documenten-kopieren-en-bundelen` | `documenten-checklist` | ID/kopieën/verzekeringsgegevens/noodnummers. |
| `noodcontacten-noteren` | `persoonlijke-gereedheid-checks` | Offline contactlijst. |
| `persoonlijke-medicatie-inpakken-check` | `persoonlijke-gereedheid-checks` | Geen productline. |
| `sleutels-cash-en-laders-check` | `persoonlijke-gereedheid-checks` | Geen productline. |
| `evacuatietas-periodiek-controleren` | `persoonlijke-gereedheid-checks` | Gewicht, houdbaarheid, laadstatus. |

Geen generieke productitems voor documenten, ID-kaart, paspoort, cash, sleutels, persoonlijke medicatie of contactpersonen.

---

## 13. Seed-implementatieregels

Maak pas na mapping-check:

```text
contentbatch_7_evacuatie_documenten_seed.sql
```

Seed moet minimaal bevatten:

- add-on `evacuatie`;
- scenarioactivatie via add-on → scenario’s;
- scenario’s, needs, capabilities volgens mapping;
- need_capability/scenario capability policies volgens bestaande tabellen;
- producttypes, met hergebruik waar bestaand;
- productvarianten voor Basis en Basis+;
- item candidates voor Basis en Basis+;
- item capabilities;
- productregels;
- quantity policies;
- accessoire requirements alleen voor echte bestaande accessoireketens;
- supplier offers binnen bestaande velden;
- claim governance / usage constraints binnen bestaande velden;
- preparedness tasks;
- physical specs/notes indien bestaand;
- explanation templates of item explanations binnen bestaande patronen;
- QA-relevante dekking.

Seed mag niet bevatten:

- nieuwe enumwaarden;
- schemawijzigingen;
- supplier_offer uitbreiding;
- Directus composite-PK wijziging;
- directe add-on → item koppeling;
- directe package → item koppeling;
- tas → alle inhoud accessoireketen;
- documenten/cash/medicatie als productitems.

---

## 14. Engine mapping

Pas de engine alleen minimaal en gericht aan.

De engine moet later:

- `addon=evacuatie` ondersteunen;
- scenario’s activeren via add-on;
- fixed en per-person/schema-veilige quantities verwerken;
- bestaande headlamp/drinkfles/filterfles candidates kunnen hergebruiken;
- deduplicatie van cross-batch items behouden;
- tasks uit preparedness_task kunnen tonen;
- usage constraints/governance zichtbaar houden in output;
- QA blocking correct laten werken.

Niet doen:

- geen nieuwe quantity formula enum toevoegen;
- geen hardcoded add-on → item mapping;
- geen evacuatietas → alle inhoud hardcoding;
- geen document/medicatie/cash productgeneratie;
- geen volledige evacuatie/survivalmodule;
- geen nieuwe physical specs schema;
- geen overclaim rond redding, veiligheid, filteren of officiële instructies.

---

## 15. Interne webapp mapping

De interne webapp moet later minimaal ondersteunen:

```text
addon=evacuatie
tier=basis
tier=basis_plus
```

Te tonen onderdelen:

- core evacuatie/document/signaling/water/light regels;
- container-label of explanation voor evacuatietas;
- reused items;
- supporting/backup filterfles;
- tasks;
- quantities;
- sources;
- coverage;
- usage constraints;
- governance/public warnings;
- QA-resultaat;
- verschil tussen Basis en Basis+.

Geen checkout, account, betaalflow, voorraadreservering of leverancierintegratie.

---

## 16. Regression mapping

Maak later:

```text
regression_evacuatie_poc.js
npm run test:evacuatie-poc
```

Gebruik `addon=evacuatie`, tenzij de mapping-check vóór implementatie expliciet een andere bestaande slug heeft goedgekeurd.

Expected output Basis:

- `IOE-EVAC-BAG-BASIC`;
- `IOE-DOC-FOLDER-BASIC`;
- `IOE-WHISTLE-BASIC`;
- `IOE-REFLECTIVE-VEST-BASIC`;
- `IOE-HEADLAMP-AAA-BASIC` of gemapte bestaande basislichtoplossing;
- `IOE-BOTTLE-1L-BASIC` of gemapte bestaande basisdrinkfles;
- document/persoonlijke tasks.

Expected output Basis+:

- `IOE-EVAC-BAG-PLUS`;
- `IOE-DOC-FOLDER-PLUS`;
- `IOE-WHISTLE-PLUS`;
- `IOE-REFLECTIVE-VEST-PLUS`;
- `IOE-HEADLAMP-AAA-PLUS` of gemapte bestaande pluslichtoplossing;
- `IOE-BOTTLE-1L-PLUS` of gemapte bestaande plusdrinkfles;
- `IOE-FILTERBOTTLE-PLUS` als supporting/backup indien beschikbaar;
- document/persoonlijke tasks.

Minimale regression asserts:

1. `addon=evacuatie` werkt voor `tier=basis`.
2. `addon=evacuatie` werkt voor `tier=basis_plus`.
3. Basis en Basis+ bevatten evacuatietas.
4. Evacuatietas claimt alleen draag/packability, geen inhoudscoverage.
5. Basis en Basis+ bevatten documentenmap.
6. Documenttasks zijn zichtbaar en genereren geen documentproducten.
7. Basis en Basis+ bevatten noodfluit.
8. Zichtbaarheid/reflectie is afgedekt.
9. Licht onderweg is afgedekt.
10. Drinkwater meenemen is afgedekt.
11. Basis+ bevat filterfles of mapping rapporteert expliciet waarom niet.
12. Filterfles is supporting/backup en vervangt geen waterbasis.
13. Geen persoonlijke medicatie/documenten/cash/sleutels als productitems.
14. Geen overclaims rond veilige evacuatie, redding, zichtbaarheid of universele waterfiltering.
15. Usage constraints of public/internal warnings zijn aanwezig.
16. QA generated lines without sources = 0.
17. QA generated line producttype mismatch = 0.
18. QA blocking = 0.
19. Alle eerdere regressions blijven groen.
20. `npm run test:evacuatie-poc` is groen.

Optioneel maar gewenst:

- combo-run `addon_slugs=['evacuatie','drinkwater']` toont dedupe of correcte multiple sources voor drinkfles/filterfles;
- combo-run `addon_slugs=['evacuatie','stroomuitval']` toont dedupe of correcte multiple sources voor headlamp.

---

## 17. Mapping-check vóór implementatie

Gebruik dit format:

```md
# Mapping-check Fase 6 — Evacuatie & documenten

## Add-on slug
Gekozen slug: `evacuatie`

## Coverage enumwaarden
Gebruikte bestaande waarden:
- primary
- secondary
- backup

Geen nieuwe coverage enumwaarden toegevoegd.

## Claim type waarden
Gebruikte bestaande waarden:
- verified_spec
- assumed

Geen nieuwe claim_type enumwaarden toegevoegd.

## Usage constraint types
Gebruikte bestaande waarden:
- ...

Geen nieuwe usage_constraint types toegevoegd.

## Generated source types
Gebruikte bestaande waarden:
- scenario_need
- accessory_requirement

Geen nieuwe source_type enumwaarden toegevoegd.

## Quantity policy mapping
- `one_per_household` → `fixed`, `base_amount = 1`
- `per_person` → bestaande `per_person` of schema-veilig alternatief
- `reuse_existing_quantity` → bestaande policies voor headlamp/drinkfles
- `basis_plus_supporting_only` → tier/productvariant/candidate mapping
- `task_only` → preparedness_task/content_only, geen productline

Geen nieuwe quantity policy enumwaarden toegevoegd.

## Reuse mapping
- Headlamp: hergebruik bestaande stroomuitval-items/candidates indien aanwezig.
- Drinkfles/filterfles: hergebruik bestaande drinkwater-items/candidates indien aanwezig.

## Task mapping
- Documenten en persoonlijke readiness worden tasks/checks.
- Geen documenten/cash/sleutels/medicatie als productitems.

## Physical/packability mapping
- Bestaande physical specs gebruikt indien aanwezig.
- Geen schemawijziging.

## Schema-impact
- Geen schemawijziging nodig.
- Geen supplier_offer uitbreiding nodig.
- Geen Directus composite-PK wijziging nodig.
- Geen package/add-on → item koppeling toegevoegd.
- Geen package → item koppeling toegevoegd.
- Geen tas → alle inhoud accessoireketen.

## Go / no-go
Conclusie:
- Implementatie kan doorgaan binnen bestaand datamodel.
```

Stop en rapporteer als een van deze punten niet binnen het bestaande datamodel past.

---

## 18. Release note en tag

Na volledige implementatie en groene validatie moet een release note worden toegevoegd voor:

```text
v0.7.0-evacuatie-baseline
```

Voorkeursbestandsnaam:

```text
release_note_v0.7.0_evacuatie_baseline.md
```

Voorkeurstag:

```text
v0.7.0-evacuatie-baseline
```

Als de agent een langere tag wil gebruiken, bijvoorbeeld `v0.7.0-evacuatie-documenten-baseline`, moet dit eerst expliciet worden gerapporteerd en goedgekeurd.

---

## 19. Samenvatting voor implementatie

Definitieve mappingkeuzes voor Fase 6:

- Add-on slug: `evacuatie`
- Scenario’s:
  - `evacuatiegereed-thuis-72u`
  - `documentveiligheid-evacuatie`
  - `signalering-evacuatie`
  - `licht-onderweg-evacuatie`
  - `drinkwater-onderweg-evacuatie`
  - `persoonlijke-gereedheid-evacuatie`
- Kernneeds:
  - `evacuatietas-dragen`
  - `documenten-beschermen`
  - `documenten-checklist`
  - `hoorbaar-signaleren`
  - `zichtbaar-onderweg`
  - `licht-onderweg`
  - `drinkwater-meenemen-evacuatie`
  - `persoonlijke-gereedheid-checks`
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer uitbreiding.
- Geen directe package/add-on → item koppeling.
- Tas blijft container, niet pakketwaarheid.
- Documenten/persoonlijke zaken blijven tasks/checks.
- Implementatie pas na mapping-check.
