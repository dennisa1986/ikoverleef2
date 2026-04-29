# Release note — v1.0.0-mvp-rc1

## Fase
Fase 12 — MVP RC1

## Baseline
- Vorige baseline: `v0.12.0-regression-suite-baseline`
- Vorige commit: `3e3bd61`
- Nieuwe tag: `v1.0.0-mvp-rc1`

## MVP-definitie
MVP RC1 bewijst dat backoffice, database, recommendation engine, UI MVP en regression suite samen werken voor een uitlegbaar pakketadvies.

Een gebruiker kan een pakketkeuze maken met tier, add-ons, huishouden en duur. Het systeem genereert daarna automatisch items, aantallen, sources, coverage, tasks, warnings en QA summary.

## Doel
Deze release candidate markeert de eerste end-to-end MVP-kandidaat van Ik overleef.

## Scope
Binnen scope:

- Basispakket;
- Basis en Basis+;
- multi-add-on recommendations;
- profielinput voor volwassenen, kinderen, huisdieren en duur;
- MVP configurator en adviesroute;
- interne recommendation POC;
- interne backoffice POC;
- master regression suite;
- MVP RC regression.

## Architectuurprincipes
- Database-first.
- Packages en add-ons activeren scenario's; ze hangen niet direct aan items.
- De UI presenteert bestaande engine-output en hardcodet geen productlogica.
- Runtime sections, tasks, warnings en QA summary blijven outputstructuur, geen database schema.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen release registry, test_result of qa_result tabel.

## Wat Werkt
- MVP configurator op `/mvp`.
- MVP adviesroute op `/mvp/recommendation`.
- Interne recommendation inspectie op `/internal/recommendation-poc`.
- Interne backoffice inspectie op `/internal/backoffice-poc`.
- Basis en Basis+ output.
- Multi-add-on output.
- Profielinput voor huishouden en duur.
- Runtime sections:
  - core items;
  - accessoires;
  - supporting items;
  - backup items;
  - optional additions.
- Tasks en warnings naast producten.
- Sources en coverage per generated line.
- QA summary met blocking/generated-line controles.

## Wat Bewust Buiten Scope Is
- Geen checkout.
- Geen betaling.
- Geen winkelmand.
- Geen auth.
- Geen klantaccount.
- Geen klantprofielopslag.
- Geen voorraadreservering.
- Geen externe leverancierintegratie.
- Geen publieke marketingwebsite.
- Geen merkrebranding.
- Geen analytics/eventtracking.
- Geen volledige baby-, huisdier- of medicatiemodule.

## Routes
Gecontroleerde routes:

- `/`
- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

`/` verwijst naar `/mvp`.

## Backoffice
De backoffice POC toont read-only inspectie op bestaande data:

- QA summary;
- scenario matrix;
- product readiness;
- candidate readiness;
- governance attention;
- supplier offer attention;
- release baseline overview;
- open attention points.

## Engine/output
De engine-output bevat:

- input summary;
- package en tier;
- actieve add-ons;
- huishouden en duur;
- generated package lines;
- quantities;
- sources;
- coverage;
- usage warnings;
- tasks;
- QA summary.

## Regression suite
De MVP RC gebruikt:

- alle domeinregressions;
- engine hardening regression;
- backoffice hardening regression;
- UI MVP regression;
- master suite `npm run test:mvp-suite-poc`;
- MVP RC regression `npm run test:mvp-rc-poc`.

## Validatie
Groen gedraaid:

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
- `npm run test:mvp-suite-poc`
- `npm run test:mvp-rc-poc`

QA gate:

- QA blocking = 0
- generated lines without sources = 0
- generated line producttype mismatch = 0
- forbidden productitems = 0
- forbidden checkout/payment/account/cart links or CTAs = 0

## Bekende Open Punten
- MVP UI draait nog binnen de interne POC-server.
- Er is nog geen publieke merklaag.
- Supplier offers blijven POC/handmatig.
- Directus role/permission inrichting blijft later.
- Optional additions kan leeg zijn.
- Child/pet/baby zijn deels taskmatig voorbereid, geen volledige productmodule.
- De master suite kan in de Codex desktop-sandbox escalated execution nodig hebben door child processes.

## Conclusie
MVP RC1 is gereed als `v1.0.0-mvp-rc1`.
