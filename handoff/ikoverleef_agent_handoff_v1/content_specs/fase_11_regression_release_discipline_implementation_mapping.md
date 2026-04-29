# Fase 11 — Regression suite & release discipline implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt de inhoudelijke specificatie `fase_11_regression_release_discipline_v1.md` naar het bestaande Ik overleef-datamodel, de bestaande engine, de bestaande POC-server en de bestaande regressionstructuur.

Fase 11 is geen contentbatch en geen datamodelwijziging.

Het doel is:

- bestaande regressions orchestreren;
- MVP scenario sanity checks toevoegen;
- route smoke tests toevoegen;
- release gate discipline formaliseren;
- geen schemawijziging uitvoeren.

## 2. Geen nieuwe databaseconcepten

Niet toevoegen:

- nieuwe enumwaarden;
- nieuwe tabellen;
- nieuwe columns;
- nieuwe generated output tables;
- release registry tabel;
- test_result tabel;
- qa_result tabel;
- supplier_offer velden;
- checkout/account/session/cart-tabellen.

Alle release- en regressioninformatie blijft:

- code/scriptniveau;
- release note;
- runtime output;
- console output;
- eventueel JSON in memory tijdens testuitvoering.

## 3. Bestandsmapping

Voorgestelde bestanden:

```txt
fase_11_regression_release_discipline_v1.md
fase_11_regression_release_discipline_implementation_mapping.md
backend/regression_mvp_suite_poc.js
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v0.12.0_regression_suite_baseline.md
```

Te wijzigen:

```txt
backend/package.json
```

Alleen wijzigen indien nodig:

```txt
apps/internal-poc/server.js
backend/calculate.js
```

Voorkeur: niet wijzigen als bestaande exports/renderfuncties voldoende zijn.

## 4. NPM-script mapping

Nieuwe scripts:

```json
"test:mvp-suite-poc": "node regression_mvp_suite_poc.js"
```

Optioneel:

```json
"test:all-poc": "npm run test:mvp-suite-poc"
"test:release-gate-poc": "node regression_mvp_suite_poc.js"
```

Geen scripts verwijderen.

## 5. Regression orchestration mapping

De master suite mag bestaande scripts uitvoeren via Node `child_process.spawn` of `execFile`.

Aanbevolen:

- voer scripts sequentieel uit;
- toon naam, status en duur per script;
- stop niet noodzakelijk bij eerste failure als samenvatting nuttiger is, maar exit uiteindelijk met `1` als iets faalt;
- voorkom dat output onleesbaar wordt;
- behoud originele exit codes.

Minimaal te draaien scripts:

```txt
test:stroomuitval-poc
test:drinkwater-poc
test:voedsel-poc
test:hygiene-sanitatie-poc
test:ehbo-poc
test:warmte-droog-shelter-poc
test:evacuatie-poc
test:taken-profielen-poc
test:engine-hardening-poc
test:backoffice-hardening-poc
test:ui-mvp-poc
```

## 6. Direct engine check mapping

Gebruik bestaande exports uit `backend/calculate.js`, bij voorkeur:

- `DEFAULT_INPUT`
- `main`
- `loadRecommendationOutputForInput`

Als exports ontbreken maar eerder in Fase 8/10 zijn toegevoegd, hergebruik ze.

Geen nieuwe engine semantics toevoegen.

## 7. Route smoke mapping

Gebruik bestaande exports uit `apps/internal-poc/server.js`, bij voorkeur:

- `handleRequest`
- `renderMvpConfiguratorPage`
- `renderMvpRecommendationPage`
- `renderBackofficePage`
- `mvpInputFromSearchParams`
- `ensureRecommendationData`

Als `handleRequest` al testbaar is zoals in `regression_ui_mvp_poc.js`, hergebruik dat patroon.

Geen echte HTTP server nodig tenzij bestaande regression dit al veilig doet.

## 8. QA mapping

Gebruik bestaande QA views en helpers.

Minimaal controleren:

- `qa_generated_lines_without_sources = 0`
- `qa_generated_line_product_type_mismatch = 0`
- alle blocking QA views = 0

Gebruik bestaande lijsten uit `calculate.js` als ze exported zijn:

- `BLOCKING_QA_VIEWS`
- `WARNING_QA_VIEWS`
- `countView`

Als die niet beschikbaar zijn, kopieer geen nieuwe databaseconcepten; gebruik dezelfde viewnamen uit bestaande regressions.

## 9. MVP scenario mapping

Gebruik bestaande add-on slugs:

```txt
stroomuitval
drinkwater
voedsel_bereiding
hygiene_sanitatie_afval
ehbo_persoonlijke_zorg
warmte_droog_shelter_light
evacuatie
taken_profielen
```

Gebruik bestaande package/tier slugs:

```txt
basispakket
basis
basis_plus
```

Gebruik bestaande profile runtime fields:

```txt
duration_hours
household_adults
household_children
household_pets
```

Geen klantprofielopslag toevoegen.

## 10. Outputsection mapping

Gebruik runtime output uit Fase 8/Fase 10:

```txt
sections.core_items
sections.accessories
sections.supporting_items
sections.backup_items
sections.optional_additions
tasks
warnings
qa_summary
```

Valideer aanwezigheid van keys, niet per se exact dezelfde aantallen behalve waar expliciet stabiel.

## 11. Expected output sanity mapping

Voorkeur: sanity checks op domeinvertegenwoordiging in plaats van volledige snapshots.

Voorbeelden:

- stroomuitval: licht/energie/informatie-item aanwezig;
- drinkwater: waterpack/jerrycan/filter/tabletten volgens bestaande regression;
- voedsel: food pack/kookondersteuning/accessoires;
- hygiëne: handhygiëne/sanitatie/afval;
- EHBO: EHBO-set/wondzorg;
- warmte: warmtedeken/poncho/tarp-light;
- evacuatie: tas/documentenmap/fluit/reflectie/water meenemen;
- taken: taskoutput aanwezig.

Geen UUID/timestamp snapshots.

## 12. Forbidden output mapping

Gebruik pattern checks op SKU/product_type/title.

Verboden generieke productitems:

```txt
MEDICATION
PAINKILLER
DOCUMENT
PASSPORT
ID
CASH
KEY
CONTACT
BABY
PET
HUISDIER
```

Let op: tasks mogen deze termen wel als tekst bevatten. De check moet gericht zijn op generated package lines/productitems, niet taskteksten.

## 13. Release gate mapping

De release gate blijft een script- en procesgate.

Geen database release registry.

Validaties:

- git status kan optioneel via `git status --porcelain` worden gelezen;
- tag-validatie kan optioneel via `git tag --list` of shell command;
- in CI/desktopcontext mag git-check informatief zijn als policies push blokkeren;
- regression failure is altijd blocking.

## 14. Backwards compatibility

Bestaande scripts moeten blijven werken:

- alle losse `test:*` scripts;
- `/mvp`;
- `/mvp/recommendation`;
- `/internal/recommendation-poc`;
- `/internal/backoffice-poc`.

Geen bestaande route verwijderen.

## 15. Mapping-check format

De agent moet vóór implementatie rapporteren:

```md
# Mapping-check Fase 11 — Regression suite & release discipline

## Baseline
- Laatste remote baseline:
- Tag:

## Schema-impact
- Geen schemawijziging nodig.
- Geen nieuwe enumwaarden nodig.
- Geen supplier_offer uitbreiding nodig.
- Geen nieuwe release/test tabellen nodig.

## Script mapping
- Master suite:
- Package scripts:
- Bestaande regressions:

## Route smoke mapping
- MVP configurator:
- MVP recommendation:
- Recommendation POC:
- Backoffice POC:

## QA mapping
- Blocking views:
- Generated line QA:

## Snapshot/sanity mapping
- Geen UUID/timestamp snapshots.
- Sanity checks op sections, domeinen, tasks, warnings en verboden items.

## Go / no-go
Conclusie:
- Implementatie kan doorgaan binnen bestaand datamodel.
```

## 16. Release mapping

Beoogde release:

```txt
v0.12.0-regression-suite-baseline
```

Release note:

```txt
release_note_v0.12.0_regression_suite_baseline.md
```

Commit message:

```txt
feat(test): add mvp regression suite and release gate
```

## 17. Stopcondities

Stop en rapporteer als implementatie alleen mogelijk lijkt met:

- nieuwe enumwaarde;
- schemawijziging;
- nieuwe database table;
- supplier_offer uitbreiding;
- Directus composite-PK wijziging;
- checkout/account/betaling;
- klantprofielopslag;
- wijziging aan recommendation semantics;
- wijziging aan scoring/quantity/coverage;
- hardcoded package/add-on → item koppeling.
