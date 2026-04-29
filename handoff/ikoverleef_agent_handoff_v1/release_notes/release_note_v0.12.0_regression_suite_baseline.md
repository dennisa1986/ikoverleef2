# Release note — v0.12.0-regression-suite-baseline

## Fase
Fase 11 — Regression suite & release discipline

## Baseline
- Vorige baseline: `v0.11.0-ui-mvp-baseline`
- Vorige commit: `8d2aa07`
- Nieuwe tag: `v0.12.0-regression-suite-baseline`

## Doel
Deze baseline voegt een reproduceerbare MVP release gate toe. De suite orkestreert bestaande content-, engine-, backoffice- en UI-regressions en voert extra MVP sanity checks en route smoke tests uit.

## Architectuurprincipes
- Database-first blijft leidend.
- Geen nieuwe contentdomeinen.
- Geen nieuwe producttypes of itemcatalogus.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, betaling, winkelmand, auth, klantaccount of klantprofielopslag.
- Geen wijziging aan scoring-, quantity- of coverage-semantiek.
- Geen release registry, test_result of qa_result tabel.

## Schema-impact
- Geen databasewijziging.
- Geen seedwijziging.
- Geen engine-semantiekwijziging.
- Release- en testdiscipline is vastgelegd in scripts, release note en console-output.

## Master suite
Nieuw script:

```bash
npm run test:mvp-suite-poc
```

De master suite:
- draait alle bestaande POC-regressions sequentieel;
- rapporteert compact per script;
- faalt met exit code 1 zodra een onderdeel faalt;
- voert MVP scenario sanity checks uit;
- voert route smoke tests uit;
- controleert verboden generieke productitems;
- gebruikt geen UUID-, timestamp- of volledige HTML snapshots.

## Scripts
De master suite draait:

- `test:stroomuitval-poc`
- `test:drinkwater-poc`
- `test:voedsel-poc`
- `test:hygiene-sanitatie-poc`
- `test:ehbo-poc`
- `test:warmte-droog-shelter-poc`
- `test:evacuatie-poc`
- `test:taken-profielen-poc`
- `test:engine-hardening-poc`
- `test:backoffice-hardening-poc`
- `test:ui-mvp-poc`

## MVP scenario matrix
Gecontroleerde scenario's:

- MVP-startpakket: `stroomuitval,drinkwater,evacuatie`, `basis_plus`, 2 volwassenen, 72 uur.
- Complete 72u POC: alle MVP-add-ons, `basis_plus`, 2 volwassenen, 1 kind, 1 huisdier, 72 uur.
- Basis minimal sanity: `stroomuitval,drinkwater`, `basis`, 1 volwassene, 72 uur.

De checks valideren runtime sections, tasks, warnings, QA summary, domeinaanwezigheid en afwezigheid van verboden generieke productitems.

## Route smoke tests
Gecontroleerde routes:

- `/mvp`
- `/mvp/recommendation?tier=basis_plus&addons=stroomuitval,drinkwater,evacuatie&adults=2&children=0&pets=0&duration_hours=72`
- `/internal/recommendation-poc?addon=drinkwater&tier=basis_plus`
- `/internal/recommendation-poc?addon=stroomuitval,drinkwater,evacuatie,taken_profielen&tier=basis_plus&adults=2&children=1&pets=1&duration_hours=72`
- `/internal/backoffice-poc`
- `/internal/backoffice-poc?domain=qa`
- `/internal/backoffice-poc?domain=readiness`

## Forbidden output checks
De suite controleert generated package lines op afwezigheid van generieke productitems voor:

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

Taskteksten mogen deze onderwerpen wel noemen als checklist of persoonlijke voorbereiding.

## QA gate
Geverifieerd:

- QA blocking = 0
- generated lines without sources = 0
- generated line producttype mismatch = 0

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

## Bekende open punten
- De master suite start child processes; in de Codex desktop-sandbox vereist dat escalated execution, lokaal normaal Node/npm-gedrag.
- Er is nog geen CI-configuratie toegevoegd.
- Er is geen database release registry; baselines blijven Git-tags en release notes.

## Conclusie
Fase 11 is afgerond als regression suite en release discipline baseline `v0.12.0-regression-suite-baseline`.
