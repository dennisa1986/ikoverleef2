# Fase 9 — Backoffice hardening v1

## 1. Waar we staan in het plan

Project **Ik overleef** heeft de inhoudelijke en engine-baselines voor de MVP-kern inmiddels opgebouwd:

- Fase 0 — Stroomuitval baseline — afgerond
- Fase 1 — Drinkwaterzekerheid baseline — afgerond
- Fase 2 — Voedsel & voedselbereiding baseline — afgerond
- Fase 3 — Hygiëne, sanitatie & afval baseline — afgerond
- Fase 4 — EHBO & persoonlijke zorg baseline — afgerond
- Fase 5 — Warmte, droog blijven & shelter-light baseline — afgerond
- Fase 6 — Evacuatie & documenten baseline — afgerond
- Fase 7 — Taken, profielafhankelijkheden & package-polish baseline — afgerond
- Fase 8 — Engine hardening baseline — afgerond

Fase 9 richt zich op **Backoffice hardening**: de bestaande database, Directus-/beheerlaag, QA-output en interne controleweergave moeten bruikbaarer worden voor contentbeheer richting MVP.

Dit is geen nieuwe contentbatch en geen commercieel klanttraject. Het doel is beheerbaarheid, traceerbaarheid en release-discipline verbeteren zonder het bestaande datamodel te verbouwen.

## 2. Doel

Fase 9 moet aantonen dat een beheerder of contentoperator kan zien:

1. welke scenario’s, needs, capabilities, productregels en candidates actief zijn;
2. welke items voldoende gereed zijn voor gebruik in de recommendation engine;
3. welke candidates per tier beschikbaar zijn;
4. welke governance-, usage- en claimrisico’s bestaan;
5. welke supplier offers of POC-offers aandacht nodig hebben;
6. welke QA-views blocking of warning signalen geven;
7. welke releasebaseline actief is en welke regressions bij die baseline horen;
8. waar content incompleet, risicovol of stale is.

De fase levert bij voorkeur **beheer-views en inspectie-output** op bovenop bestaande tabellen. Schemawijzigingen zijn niet toegestaan zonder expliciete toestemming.

## 3. Niet-doen-lijst

Niet doen in Fase 9:

- geen checkout;
- geen klantaccounts;
- geen betaalflow;
- geen externe leverancierintegraties;
- geen echte voorraadreservering;
- geen nieuwe contentdomeinbatch;
- geen nieuwe productitems tenzij strikt nodig voor een beheer-smoke-test, bij voorkeur niet;
- geen nieuwe enumwaarden;
- geen schemawijzigingen;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen package → item koppeling;
- geen add-on → item koppeling;
- geen volledige Directus role/permission redesign;
- geen customer-facing CMS;
- geen PIM/ERP-integratie;
- geen dashboards die alleen met externe tooling werken.

## 4. Scope

Fase 9 omvat:

### 4.1 Backoffice inspectieviews

Maak of versterk bestaande database views, read-only SQL views of interne inspectiequeries voor:

- scenario matrix;
- product readiness;
- candidate readiness;
- supplier offer attention;
- governance attention;
- QA dashboard summary;
- release baseline overview;
- content completeness summary.

Als views al bestaan, hergebruik en breid ze schema-veilig uit. Als nieuwe views nodig zijn, maak alleen SQL views binnen bestaande schema/tabelstructuur. Geen nieuwe tabellen.

### 4.2 Interne webapp beheerweergave

Breid de interne POC uit met een backoffice/QA-inspectiepagina, bijvoorbeeld:

```txt
/internal/backoffice-poc
/internal/backoffice-poc?domain=all
/internal/backoffice-poc?domain=qa
/internal/backoffice-poc?domain=readiness
```

De exacte route mag aansluiten op bestaande serverstructuur.

De pagina moet minimaal tonen:

- QA summary;
- blocking QA views;
- warning/context QA views;
- scenario/need/productregel matrix;
- product readiness overzicht;
- candidate readiness per tier;
- governance/usage constraint attention;
- supplier offer freshness/POC-status voor zover bestaand;
- release baseline status.

### 4.3 Regression

Maak een backoffice-hardening regression die controleert dat de backoffice/QA views en interne inspectie-output werken zonder bestaande regressions te breken.

## 5. Backoffice-onderdelen

### 5.1 Scenario matrix

Doel: kunnen zien hoe scenario’s naar needs en productregels leiden.

Minimale kolommen in inspectie-output of view:

- scenario_slug;
- scenario_status;
- need_slug;
- need_status;
- need_content_only;
- capability_count;
- product_rule_count;
- active_candidate_count_basis;
- active_candidate_count_basis_plus;
- has_primary_coverage_candidate;
- has_accessory_requirements;
- governance_flag_count.

Belangrijk: dit is inspectie-output. Het mag geen nieuw beslismodel introduceren.

### 5.2 Product readiness

Doel: zien welke items voldoende compleet zijn.

Minimale criteria:

- item actief;
- item heeft producttype;
- item heeft capabilities waar nodig;
- item heeft claim/governance waar claimgevoelig;
- item heeft usage constraints waar relevant;
- item heeft supplier offer of POC-offer als bestaand patroon;
- item heeft public explanation of voldoende gegenereerde explanation;
- item veroorzaakt geen QA-blocking.

Mogelijke readiness statussen zijn runtime labels, geen enumwaarden:

- ready;
- needs_attention;
- blocked;
- poc_only.

### 5.3 Candidate readiness

Doel: Basis/Basis+ candidatekwaliteit zichtbaar maken.

Minimale checks:

- per producttype/tier bestaat een default candidate waar verwacht;
- geen default conflicts;
- candidate item is active;
- candidate producttype matcht productregel;
- candidate heeft supplier offer of POC-bron;
- Basis en Basis+ verschillen waar inhoudelijk bedoeld;
- hergebruikte items blijven traceerbaar.

### 5.4 Supplier offer attention

Doel: handmatige POC-offers beheersbaar maken zonder supplier_offer schema-uitbreiding.

Niet doen:

- geen `source_url`, `source_checked_at`, `price_status`, `claim_coverage` toevoegen aan supplier_offer.

Wel doen:

- bestaande supplier_offer velden lezen;
- stale/ontbrekende offers via bestaande QA views of inspectiequeries tonen;
- POC-status afleiden uit bestaande notes/status/metadata waar beschikbaar;
- ontbrekende supplier offers als aandachtspunt tonen, niet automatisch blokkeren tenzij bestaande QA dat al doet.

### 5.5 Governance dashboard

Doel: claimgevoelige items zichtbaar maken.

Domeinen met hoge governancegevoeligheid:

- waterfiltering en zuivering;
- voedselbereiding/gas/vuur;
- hygiëne/sanitatie;
- EHBO/medische claims;
- shelter/warmte/extreem weer;
- evacuatie/signaling/filterfles;
- persoonlijke medicatie/tasks.

Minimale output:

- item_sku;
- product_type_slug;
- claim/governance note;
- usage constraints;
- warning severity;
- blocks_recommendation;
- source scenario/need indien traceerbaar;
- public warning.

### 5.6 QA dashboard

Doel: alle relevante QA-views als één compact overzicht.

Minimale output:

- blocking_total;
- warning_total;
- generated_lines_without_sources;
- generated_line_producttype_mismatch;
- per-view records;
- status clean/attention/blocking;
- timestamp/runtime context als beschikbaar.

Gebruik bestaande QA-views. Voeg geen nieuwe QA-view toe tenzij dit als SQL view kan zonder schemawijziging en zonder bestaande regressions te raken.

### 5.7 Release baseline overview

Doel: release-discipline zichtbaar maken.

Omdat er geen release-tabel mag worden toegevoegd, kan dit in deze fase via:

- release note bestanden;
- package.json scripts;
- Git tag naming;
- interne static config in server/regression;
- documentatie.

Minimaal tonen in interne backoffice POC:

- laatste baseline tag verwacht: `v0.9.0-engine-hardening-baseline` als inputbaseline voor Fase 9;
- huidige beoogde tag: `v0.10.0-backoffice-hardening-baseline`;
- beschikbare regression scripts;
- status van laatste lokale regression run als regression dat kan rapporteren;
- expliciete melding dat dit geen database release registry is.

## 6. Usage constraints en governance

Deze fase mag bestaande constraints lezen en tonen, maar geen nieuwe constraint enumwaarden toevoegen.

Runtime labels zoals `ready`, `blocked`, `poc_only`, `needs_attention`, `governance_risk` zijn alleen UI/rapportagelabels.

Claimgevoelige items mogen niet worden verstopt in beheer. Als een item usage constraints of governance notes heeft, moet dat zichtbaar zijn.

## 7. Public/internal explanation

Fase 9 hoeft geen klantgerichte copy te verbeteren. Wel moet de backoffice uitleg geven aan de beheerder:

- waarom een item aandacht nodig heeft;
- waarom een rule ontbreekt;
- waarom een candidate geblokkeerd of onvolledig is;
- welke QA-view geraakt wordt;
- welke vervolgstap logisch is.

Voorbeelden:

- “Item heeft actieve usage constraints maar geen public warning.”
- “Scenario_need heeft geen productregel en is niet content_only.”
- “Basis+ candidate gebruikt hetzelfde item als Basis; controleer of dit bewust is.”
- “Supplier offer ontbreekt of is stale volgens bestaande QA.”

## 8. Expected output interne backoffice

Een interne backoffice/QA-route moet minimaal sections tonen:

```txt
QA summary
Scenario matrix
Product readiness
Candidate readiness
Governance attention
Supplier offer attention
Release baseline
Open attention points
```

Elke section mag compact zijn, maar moet data uit bestaande database of runtimeconfig tonen.

## 9. Coveragecriteria

Fase 9 is inhoudelijk voldoende als:

- beheerder kan scenario → need → productregel → candidate herleiden;
- product readiness zichtbaar is;
- governancegevoelige items zichtbaar zijn;
- supplier attention zichtbaar is;
- QA summary zichtbaar is;
- release baseline zichtbaar is;
- alle data read-only en database-first blijft;
- er geen nieuwe schema-/enumlaag nodig is.

## 10. Sourcecriteria

Elke backoffice-regel moet herleidbaar zijn naar bestaande bronnen:

- database views/queries;
- existing QA views;
- existing generated output;
- release note files/config;
- package scripts.

Geen externe connector of leverancierintegratie gebruiken.

## 11. QA-criteria

Minimale QA-eisen:

- alle bestaande regressions groen;
- nieuwe backoffice-hardening regression groen;
- QA blocking = 0;
- generated lines without sources = 0;
- generated line producttype mismatch = 0;
- backoffice views/queries geven resultaat;
- backoffice route geeft HTTP 200;
- geen schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer uitbreiding;
- geen Directus composite-PK wijziging.

## 12. Engine-aanpassingen

Fase 9 moet engine-aanpassingen vermijden tenzij nodig om bestaande QA/output te lezen. De focus ligt op inspectie en beheer.

Toegestane aanpassingen:

- shared helper voor QA summary hergebruiken;
- inspectiequeries toevoegen;
- runtime readinesslabels afleiden;
- serverroute voor backoffice POC toevoegen;
- regression toevoegen.

Niet toegestaan:

- recommendation semantics veranderen;
- scoring wijzigen;
- quantity policies wijzigen;
- itemselectie wijzigen;
- coverage semantics wijzigen.

## 13. Interne webapp-aanpassing

Minimale route:

```txt
/internal/backoffice-poc
```

Optionele filters:

```txt
/internal/backoffice-poc?domain=qa
/internal/backoffice-poc?domain=readiness
/internal/backoffice-poc?domain=governance
/internal/backoffice-poc?domain=scenarios
```

De route moet geen klantflow worden.

## 14. Regression test

Voorgestelde regression:

```txt
backend/regression_backoffice_hardening_poc.js
npm run test:backoffice-hardening-poc
```

Minimale testpunten:

1. backoffice QA summary query werkt;
2. scenario matrix query werkt;
3. product readiness query werkt;
4. candidate readiness query werkt;
5. governance attention query werkt;
6. supplier offer attention query werkt;
7. release baseline config is aanwezig;
8. interne backoffice route geeft HTTP 200 of renderfunctie kan zonder server worden getest;
9. geen schemawijziging vereist;
10. geen nieuwe enumwaarden vereist;
11. bestaande 9 regressions blijven groen;
12. backoffice regression is groen.

## 15. Release note

Voorgestelde release note:

```txt
release_note_v0.10.0_backoffice_hardening_baseline.md
```

Voorgestelde tag:

```txt
v0.10.0-backoffice-hardening-baseline
```

## 16. Fase-afrondingscriteria

Fase 9 is technisch afgerond als:

- specificatie en mapping zijn opgenomen;
- mapping-check is gerapporteerd;
- geen schemawijzigingen zijn gedaan;
- geen nieuwe enumwaarden zijn toegevoegd;
- backoffice/QA inspectie-output werkt;
- interne backoffice route werkt;
- regression backoffice hardening groen is;
- alle bestaande regressions groen zijn;
- release note aanwezig is;
- commit en tag zijn gepusht;
- bekende open punten expliciet zijn gerapporteerd.

## 17. Agent-opdracht voor volgende stap

Gebruik naast dit document ook:

```txt
fase_9_backoffice_hardening_implementation_mapping.md
```

Voer Fase 9 end-to-end uit met mapping-check vóór implementatie en volledige regressions vóór commit/tag/push.
