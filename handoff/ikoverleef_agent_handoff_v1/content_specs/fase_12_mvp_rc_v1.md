# Fase 12 — MVP RC v1

## 1. Waar we staan

Project **Ik overleef** heeft nu de inhoudelijke domeinen, engine-output, backoffice-inspectie, UI MVP-flow en regression suite op baseline-niveau staan.

Afgeronde baselines:

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
- `v0.12.0-regression-suite-baseline`

Fase 12 is de stap naar een eerste formele **MVP release candidate**.

Beoogde tag:

```txt
v1.0.0-mvp-rc1
```

## 2. Definitie MVP RC

Een werkende MVP RC betekent:

```txt
Backoffice + database + recommendation engine + UI MVP + regression suite
waarmee een gebruiker een pakketkeuze kan maken
en het systeem automatisch een uitlegbaar pakketadvies genereert.
```

De MVP RC moet aantonen dat het systeem end-to-end functioneert voor:

- Basispakket;
- Basis en Basis+;
- meerdere add-ons;
- profielinput voor volwassenen, kinderen, huisdieren en duur;
- uitlegbare output met items, aantallen, sources, coverage, tasks, warnings en QA;
- backoffice-inspectie;
- reproduceerbare regression/release-gate.

## 3. Doel van Fase 12

Fase 12 voegt in principe **geen nieuw inhoudelijk domein** toe.

Het doel is:

1. MVP readiness vaststellen;
2. laatste route-/output-/releasepolish uitvoeren;
3. alle releasecriteria expliciet maken;
4. één MVP RC release note maken;
5. alle regressions en MVP-suite draaien;
6. formeel taggen als `v1.0.0-mvp-rc1`.

## 4. Niet doen

Niet bouwen in Fase 12:

- geen checkout;
- geen betaling;
- geen winkelmand;
- geen auth;
- geen klantaccount;
- geen klantprofielopslag;
- geen externe leverancierintegraties;
- geen voorraadreservering;
- geen nieuwe contentbatch;
- geen nieuwe producttypes;
- geen nieuwe itemcatalogus;
- geen schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen release registry tabel;
- geen analytics/eventtracking;
- geen publieke marketingwebsite;
- geen merkrebranding;
- geen SEO-/CMS-laag;
- geen customer fulfillment.

## 5. MVP RC scope

De MVP RC bevat:

| Onderdeel | Status in MVP RC |
|---|---|
| Database | bestaand POC/MVP-schema |
| Backoffice | interne backoffice POC/read-only inspectie |
| Engine | scenario/need/capability/productregelgedreven |
| UI | MVP configurator + adviesflow |
| Output | sections, tasks, warnings, QA summary |
| Tests | master regression suite |
| Release | Git tag + release note |
| Checkout | buiten scope |
| Account | buiten scope |
| Leveranciersintegratie | buiten scope |

## 6. Verplichte MVP routes

Minimaal moeten deze routes werken:

```txt
/mvp
/mvp/recommendation
/internal/recommendation-poc
/internal/backoffice-poc
```

Aanbevolen MVP smoke routes:

```txt
/mvp
/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72
/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen&adults=2&children=1&pets=1&duration_hours=72
/internal/recommendation-poc?addon=drinkwater&tier=basis_plus
/internal/recommendation-poc?addon=stroomuitval,drinkwater,evacuatie,taken_profielen&tier=basis_plus&adults=2&children=1&pets=1&duration_hours=72
/internal/backoffice-poc
/internal/backoffice-poc?domain=qa
/internal/backoffice-poc?domain=readiness
```

## 7. MVP RC outputcriteria

De adviesoutput moet minimaal bevatten:

- input summary;
- gekozen package;
- tier;
- actieve add-ons;
- huishouden;
- duur;
- core items;
- accessoires;
- supporting items;
- backup items;
- optional additions, mag leeg zijn;
- tasks;
- warnings;
- QA summary;
- detailuitleg met sources en coverage.

## 8. MVP RC backofficecriteria

De backoffice POC moet minimaal inzicht geven in:

- QA summary;
- scenario matrix;
- product readiness;
- candidate readiness;
- governance attention;
- supplier offer attention;
- release baseline overview;
- open attention points.

Runtime labels zoals `ready`, `needs_attention`, `blocked`, `poc_only` en `governance_risk` blijven UI-/runtime-labels en zijn geen database-enums.

## 9. MVP RC validatiecriteria

Alle bestaande regressions moeten groen zijn:

```bash
npm run test:stroomuitval-poc
npm run test:drinkwater-poc
npm run test:voedsel-poc
npm run test:hygiene-sanitatie-poc
npm run test:ehbo-poc
npm run test:warmte-droog-shelter-poc
npm run test:evacuatie-poc
npm run test:taken-profielen-poc
npm run test:engine-hardening-poc
npm run test:backoffice-hardening-poc
npm run test:ui-mvp-poc
npm run test:mvp-suite-poc
```

Daarnaast komt voor Fase 12 een extra MVP RC regression:

```bash
npm run test:mvp-rc-poc
```

## 10. Extra MVP RC regression

De MVP RC regression moet valideren:

1. root route `/` verwijst naar `/mvp` of werkt als MVP entry;
2. `/mvp` werkt;
3. `/mvp/recommendation` werkt voor MVP-startpakket;
4. `/mvp/recommendation` werkt voor complete 72u POC;
5. `/internal/recommendation-poc` blijft werken;
6. `/internal/backoffice-poc` blijft werken;
7. output bevat alle runtime sections;
8. tasks zijn zichtbaar;
9. warnings zijn zichtbaar;
10. QA summary is clean;
11. forbidden output items blijven afwezig;
12. geen checkout-/betaling-/account-/winkelmandtermen of links;
13. release baseline lijst bevat `v1.0.0-mvp-rc1` als target of current;
14. master suite is groen;
15. Git/tag sanity kan in rapportage worden bevestigd.

## 11. Forbidden output

Generated package lines mogen geen generieke productitems bevatten voor:

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

Deze onderwerpen mogen wel als tasks/checks voorkomen.

## 12. Release note

Maak een release note:

```txt
release_note_v1.0.0_mvp_rc1.md
```

Deze moet minimaal bevatten:

- fase;
- baseline;
- doel;
- MVP-definitie;
- scope;
- architectuurprincipes;
- wat werkt;
- wat bewust buiten scope is;
- routes;
- backoffice;
- engine/output;
- regression suite;
- validatie;
- bekende open punten;
- conclusie.

## 13. Bekende open punten die acceptabel zijn in RC1

Deze punten zijn acceptabel zolang ze expliciet in de release note staan:

- MVP UI draait nog binnen de interne POC-server;
- geen publieke merklaag;
- geen checkout;
- geen account;
- geen betaling;
- geen echte voorraadreservering;
- supplier offers blijven POC/handmatig;
- Directus role/permission inrichting blijft later;
- optional additions kan leeg zijn;
- child/pet/baby zijn deels taskmatig voorbereid, geen volledige productmodule;
- master suite kan in desktop-sandbox escalated execution nodig hebben.

## 14. Fase-afrondingscriteria

Fase 12 is afgerond wanneer:

- specificatie en mapping zijn opgenomen;
- mapping-check groen is;
- geen schemawijzigingen zijn gedaan;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen checkout/account/betaling is toegevoegd;
- MVP routes werken;
- backoffice route werkt;
- alle 12 bestaande regressions groen zijn;
- `npm run test:mvp-rc-poc` groen is;
- QA blocking = 0;
- generated lines without sources = 0;
- producttype mismatch = 0;
- release note aanwezig is;
- commit is gemaakt;
- tag `v1.0.0-mvp-rc1` is gemaakt;
- main en tag zijn gepusht;
- Git status clean is behalve bekende untracked setup/handoff/directus/review-bestanden.
