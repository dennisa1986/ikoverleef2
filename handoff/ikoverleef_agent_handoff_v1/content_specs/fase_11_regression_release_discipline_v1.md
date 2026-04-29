# Fase 11 — Regression suite & release discipline v1

## 1. Waar we staan

Project **Ik overleef** heeft inmiddels de belangrijkste MVP-bouwstenen als baselines vastgezet:

- `v0.1.0-stroomuitval-baseline`
- `v0.2.0-drinkwater-baseline`
- `v0.3.0-voedsel-bereiding-baseline`
- `v0.4.0-hygiene-sanitatie-baseline`
- `v0.5.0-ehbo-baseline`
- `v0.6.0-warmte-droog-shelter-light-baseline`
- `v0.7.0-evacuatie-baseline`
- `v0.8.0-taken-profielen-baseline`
- `v0.9.0-engine-hardening-baseline`
- `v0.10.0-backoffice-hardening-baseline`
- `v0.11.0-ui-mvp-baseline`

Er is nu een werkende basis met:

- database-first contentmodel;
- recommendation engine;
- multi-add-on runs;
- runtime outputsections;
- tasks;
- warnings;
- QA summary;
- backoffice POC;
- MVP configurator en adviesroute;
- losse regressions per contentbatch/fase.

Fase 11 is de stap waarin we van losse validaties naar één reproduceerbare **MVP release gate** gaan.

## 2. Doel van Fase 11

Het doel van Fase 11 is:

> Eén consistente regression- en release discipline neerzetten waarmee we vóór elke MVP-kandidaat kunnen bewijzen dat alle contentbatches, engine-output, backoffice en UI samen blijven werken.

Fase 11 moet niet primair nieuwe functionaliteit toevoegen. De waarde zit in:

- consolidatie;
- reproduceerbaarheid;
- releasechecks;
- master regression orchestration;
- route smoke tests;
- QA gate;
- baseline-overzicht;
- rapportagevorm voor toekomstige releases.

## 3. Niet doen in deze fase

Niet doen:

- geen checkout;
- geen betaling;
- geen winkelmand;
- geen auth;
- geen klantaccounts;
- geen klantprofielopslag;
- geen externe leverancierintegraties;
- geen nieuwe contentdomeinen;
- geen nieuwe producttypes;
- geen nieuwe itemcatalogus;
- geen nieuwe enumwaarden;
- geen schemawijzigingen;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK wijziging;
- geen directe package → item koppeling;
- geen directe add-on → item koppeling;
- geen wijziging aan scoring/quantity/coverage-semantiek zonder expliciete blokkademelding;
- geen snapshots die afhankelijk zijn van vluchtige UUID’s of timestamps.

## 4. Scope

Fase 11 omvat:

1. master regression suite;
2. release gate script;
3. route smoke tests;
4. QA summary gate;
5. expected output sanity checks;
6. tag/baseline discipline;
7. release report output;
8. package.json scripts;
9. release note.

## 5. Bestaande regressions die onderdeel worden van de suite

De suite moet minimaal deze bestaande scripts draaien:

- `npm run test:stroomuitval-poc`
- `npm run test:drinkwater-poc`
- `npm run test:voedsel-poc`
- `npm run test:hygiene-sanitatie-poc`
- `npm run test:ehbo-poc`
- `npm run test:warmte-droog-shelter-poc`
- `npm run test:evacuatie-poc`
- `npm run test:taken-profielen-poc`
- `npm run test:engine-hardening-poc`
- `npm run test:backoffice-hardening-poc`
- `npm run test:ui-mvp-poc`

Fase 11 voegt hier een overkoepelende suite bovenop toe.

## 6. Nieuwe regression suite

Voorgestelde nieuwe bestanden:

- `backend/regression_mvp_suite_poc.js`
- optioneel: `backend/release_gate_poc.js` als aparte wrapper, tenzij de master suite deze taak al goed afdekt.

Voorgestelde npm-scripts:

- `test:mvp-suite-poc`
- optioneel: `test:release-gate-poc`
- optioneel: `test:all-poc`

De master suite moet:

- alle bestaande regressions uitvoeren;
- falen zodra één onderliggende regression faalt;
- exit code `1` geven bij failure;
- exit code `0` geven bij volledig groen;
- een compacte samenvatting printen;
- run ids of relevante output per deeltest tonen waar beschikbaar;
- QA totals verzamelen of minimaal per onderliggende regression accepteren;
- geen externe services vereisen behalve de bestaande lokale databaseconfiguratie.

## 7. MVP scenario matrix voor suite

Naast het draaien van bestaande regressions moet de master suite expliciet enkele MVP-combinaties valideren.

Minimaal:

### 7.1 MVP-startpakket

Input:

- package: `basispakket`
- tier: `basis_plus`
- add-ons:
  - `stroomuitval`
  - `drinkwater`
  - `evacuatie`
- adults: `2`
- children: `0`
- pets: `0`
- duration_hours: `72`

Moet valideren:

- run slaagt;
- core items aanwezig;
- accessories aanwezig;
- tasks mogen afwezig zijn als `taken_profielen` niet actief is;
- warnings-sectie bestaat;
- QA summary bestaat;
- QA blocking = 0;
- geen generated lines zonder sources;
- geen producttype mismatch.

### 7.2 Complete 72u POC

Input:

- package: `basispakket`
- tier: `basis_plus`
- add-ons:
  - `stroomuitval`
  - `drinkwater`
  - `voedsel_bereiding`
  - `hygiene_sanitatie_afval`
  - `ehbo_persoonlijke_zorg`
  - `warmte_droog_shelter_light`
  - `evacuatie`
  - `taken_profielen`
- adults: `2`
- children: `1`
- pets: `1`
- duration_hours: `72`

Moet valideren:

- run slaagt;
- alle runtime outputsections bestaan;
- `core_items` bevat regels;
- `accessories` bevat regels;
- `supporting_items` bestaat;
- `backup_items` bestaat;
- `optional_additions` bestaat, mag leeg zijn;
- tasks aanwezig;
- warnings aanwezig of waarschuwingsectie zichtbaar;
- QA summary clean;
- geen verboden persoonlijke productitems.

### 7.3 Basis minimal sanity

Input:

- package: `basispakket`
- tier: `basis`
- add-ons:
  - `stroomuitval`
  - `drinkwater`
- adults: `1`
- children: `0`
- pets: `0`
- duration_hours: `72`

Moet valideren:

- run slaagt;
- Basis-output blijft kleiner/eenvoudiger dan Basis+ waar relevant;
- waterquantity blijft logisch;
- stroomuitval-items blijven aanwezig;
- QA clean.

## 8. Route smoke tests

De suite moet minimaal deze routes testen via de bestaande server/renderfuncties:

- `/mvp`
- `/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72`
- `/internal/recommendation-poc?addon=drinkwater&tier=basis_plus`
- `/internal/recommendation-poc?addon=stroomuitval,drinkwater,evacuatie,taken_profielen&tier=basis_plus&adults=2&children=1&pets=1&duration_hours=72`
- `/internal/backoffice-poc`
- `/internal/backoffice-poc?domain=qa`
- `/internal/backoffice-poc?domain=readiness`

Valideer:

- HTTP 200 of renderfunctie succesvol;
- geen server exception;
- geen checkout/account/betaling/winkelmand-termen;
- MVP-routes bevatten configurator/advies/sections;
- backoffice-route bevat QA/backoffice-informatie.

## 9. Release discipline

Fase 11 moet een release gate definiëren voor toekomstige releases.

Minimale gate:

1. git status schoon voor tracked files;
2. juiste laatste tag aanwezig;
3. alle regressions groen;
4. master suite groen;
5. QA blocking = 0;
6. generated lines without sources = 0;
7. producttype mismatch = 0;
8. geen nieuwe enumwaarden;
9. geen schemawijzigingen;
10. geen supplier_offer uitbreiding;
11. geen checkout/account/betaling;
12. release note aanwezig;
13. tag pas na validatie.

## 10. Expected output sanity

Fase 11 hoeft geen volledige snapshot testing te introduceren als dat te fragiel is.

Wel verplicht:

- sanity checks op aanwezigheid van kern-SKU’s per domein;
- sanity checks op section counts;
- sanity checks op task count in taken/profielen-run;
- sanity checks op QA clean;
- sanity checks op afwezigheid van verboden productitems.

Niet doen:

- geen snapshot op UUID’s;
- geen snapshot op exacte timestamps;
- geen brittle HTML snapshot van volledige pagina’s;
- geen volledige productlijst hard vastzetten als dat onderhoud onnodig zwaar maakt.

## 11. Verboden output

De master suite moet blijven valideren dat geen van deze productgroepen als generieke items verschijnen:

- persoonlijke medicatie;
- pijnstillers;
- documenten;
- identiteitsbewijzen;
- paspoort;
- cash;
- sleutels;
- contacten;
- babyspullen;
- huisdiervoer;
- huisdiermedicatie.

## 12. Backoffice checks

De suite moet valideren dat backoffice-output minimaal bevat:

- QA summary;
- scenario matrix;
- product readiness;
- candidate readiness;
- governance attention;
- supplier offer attention;
- release baseline-overzicht.

Er hoeven geen SQL views te worden toegevoegd.

## 13. UI checks

De suite moet valideren dat de MVP UI minimaal bevat:

- configurator;
- pakket/tier/add-on input;
- huishouden/duration input;
- adviesroute;
- core items;
- accessoires;
- supporting items;
- backup items;
- optional additions;
- tasks;
- warnings;
- QA summary.

## 14. Release note

Maak later bij implementatie:

- `release_note_v0.12.0_regression_suite_baseline.md`

Beoogde tag:

- `v0.12.0-regression-suite-baseline`

De release note moet vastleggen:

- doel van de suite;
- scripts;
- gatecriteria;
- uitgevoerde regressions;
- MVP scenario matrix;
- route smoke tests;
- QA-resultaat;
- open punten;
- conclusie.

## 15. Fase-afrondingscriteria

Fase 11 is technisch afgerond als:

- specificatie en mapping zijn opgenomen;
- mapping-check groen is;
- master regression suite bestaat;
- `npm run test:mvp-suite-poc` groen is;
- bestaande regressions groen blijven;
- route smoke tests groen zijn;
- QA blocking = 0;
- generated lines without sources = 0;
- producttype mismatch = 0;
- geen schemawijziging;
- geen nieuwe enumwaarden;
- geen supplier_offer uitbreiding;
- release note aanwezig;
- commit gemaakt;
- tag `v0.12.0-regression-suite-baseline` gemaakt;
- main en tag gepusht;
- repo tracked clean is.

## 16. Volgende fase

Na Fase 11 volgt:

- **Fase 12 — MVP RC**
- beoogde tag: `v1.0.0-mvp-rc1`

Fase 12 moet geen nieuwe domeinlogica meer toevoegen, maar de eerste end-to-end MVP-kandidaat markeren.
