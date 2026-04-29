# Release note - v0.11.0-ui-mvp-baseline

## Fase
Fase 10 - UI MVP

## Baseline
- Vorige baseline: `v0.10.0-backoffice-hardening-baseline`
- Vorige releasecommit: `b842dbc`
- Nieuwe tag: `v0.11.0-ui-mvp-baseline`

## Doel
Deze baseline voegt de eerste MVP-waardige configurator- en adviesflow toe bovenop de bestaande recommendation engine.

## Architectuurprincipes
- Geen nieuwe contentbatch.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, betaling, winkelmand, account of klantprofielopslag.
- De UI toont bestaande engine-output en hardcodet geen pakketinhoud.

## Schema-impact
- Geen databasewijzigingen.
- Geen seeddata.
- Geen wijzigingen aan `backend/calculate.js`.
- Geen Directus-configwijzigingen.

## UI-routes
- `/mvp`
- `/mvp/recommendation`

Bestaande routes blijven werken:

- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## Configurator
De MVP-configurator ondersteunt:

- pakket `basispakket`;
- tier `basis` en `basis_plus`;
- multi-select add-ons;
- volwassenen, kinderen, huisdieren en duur in uren;
- preset `Aanbevolen MVP-start`;
- preset `Complete 72u POC`;
- CTA `Advies bekijken`.

## Adviesresultaat
Het adviesresultaat toont:

- gekozen pakket;
- tier;
- actieve add-ons;
- huishouden;
- duur;
- QA-status;
- aantallen per outputsectie;
- detailuitleg per item.

## Sections
De UI gebruikt de runtime sections uit Fase 8:

- core items;
- accessoires;
- supporting items;
- backup items;
- optional additions.

Per item toont de UI:

- titel;
- quantity;
- korte public explanation;
- runtime section;
- detailpaneel met sources, coverage en warnings.

## Tasks
Tasks blijven naast producten zichtbaar en worden niet als productregels weergegeven.

## Warnings
Warnings worden uit bestaande runtime output getoond, met rustige en zakelijke framing.

## QA summary
De UI toont:

- QA status;
- blocking total;
- warning/context total;
- generated lines without sources;
- generated line producttype mismatch;
- run id en actieve add-ons in debugdetails.

## Niet gebouwd
Niet gebouwd in deze fase:

- checkout;
- betaling;
- winkelmand;
- account;
- auth;
- klantprofielopslag;
- externe leverancierintegratie.

## Validatie
- `npm run test:stroomuitval-poc`: groen
- `npm run test:drinkwater-poc`: groen
- `npm run test:voedsel-poc`: groen
- `npm run test:hygiene-sanitatie-poc`: groen
- `npm run test:ehbo-poc`: groen
- `npm run test:warmte-droog-shelter-poc`: groen
- `npm run test:evacuatie-poc`: groen
- `npm run test:taken-profielen-poc`: groen
- `npm run test:engine-hardening-poc`: groen
- `npm run test:backoffice-hardening-poc`: groen
- `npm run test:ui-mvp-poc`: groen
- QA blocking: `0`
- Generated lines without sources: `0`
- Generated line producttype mismatch: `0`

Route smoke:

- `/mvp`: HTTP 200
- `/mvp/recommendation`: HTTP 200
- core items zichtbaar
- QA summary zichtbaar

## Bekende open punten
- De UI draait nog in de bestaande internal POC-server.
- Debugdetails zijn nog zichtbaar in de MVP-resultaatpagina.
- Er is nog geen publieke visuele huisstijl of assetlaag.
- Optional additions blijft afhankelijk van bestaande runtime output en kan leeg zijn.

## Conclusie
Fase 10 levert de eerste werkende UI MVP-flow: configureren, advies bekijken, secties begrijpen, tasks zien, warnings zien en QA-status controleren zonder buiten het bestaande datamodel te stappen.
