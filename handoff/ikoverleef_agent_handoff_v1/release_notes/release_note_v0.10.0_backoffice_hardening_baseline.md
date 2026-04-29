# Release note - v0.10.0-backoffice-hardening-baseline

## Fase
Fase 9 - Backoffice hardening

## Baseline
- Vorige baseline: `v0.9.0-engine-hardening-baseline`
- Vorige releasecommit: `8a1c0d0`
- Nieuwe tag: `v0.10.0-backoffice-hardening-baseline`

## Doel
Deze baseline maakt de bestaande database en interne POC beter inspecteerbaar voor beheer, QA en release-discipline richting MVP.

## Architectuurprincipes
- Geen nieuwe contentbatch.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen release registry tabel.
- Geen dashboard/readiness tabellen.
- Geen recommendation semantics, scoring, quantity of coverage wijzigingen.
- Backoffice labels zijn runtime/UI-labels.

## Schema-impact
- Geen SQL views of tabellen aangemaakt.
- Backoffice-output wordt via read-only runtimequeries opgebouwd.
- Releasebaseline wordt via static runtimeconfig getoond, niet in de database opgeslagen.

## Backoffice route
Nieuwe interne route:

```txt
http://127.0.0.1:4173/internal/backoffice-poc
```

Optionele filters:

```txt
/internal/backoffice-poc?domain=qa
/internal/backoffice-poc?domain=readiness
/internal/backoffice-poc?domain=governance
/internal/backoffice-poc?domain=scenarios
```

## Scenario matrix
De backoffice toont per scenario/need:

- scenario slug en status;
- need slug, status en content-only vlag;
- capability count;
- product rule count;
- actieve Basis/Basis+ candidates;
- primary coverage candidate indicator;
- accessory requirement indicator;
- governance flag count.

## Product readiness
Runtime readiness wordt afgeleid uit bestaande item-, producttype-, capability-, supplier_offer-, usage_constraint-, governance- en candidate-data.

Labels:

- `ready`
- `needs_attention`
- `blocked`
- `poc_only`

Deze labels zijn geen database-enums.

## Candidate readiness
De backoffice toont per candidate:

- tier;
- producttype;
- item SKU;
- default candidate;
- itemstatus;
- producttype match;
- supplier offer count;
- capability count;
- readiness label.

## Governance attention
Usage constraints en governancecontext worden zichtbaar gemaakt met:

- item SKU;
- producttype;
- constraint type;
- severity;
- blocking flag;
- public warning;
- internal notes;
- governance context.

## Supplier offer attention
Supplier attention wordt afgeleid zonder supplier_offer schema-uitbreiding:

- supplier offer count;
- attention label;
- attention reason.

Ontbrekende supplier offers worden als aandachtspunt getoond, niet automatisch als nieuw blocking model.

## QA dashboard summary
De backoffice leest bestaande QA-views:

- blocking QA total;
- warning/context QA total;
- generated lines without sources;
- generated line producttype mismatch;
- per-view records;
- status `clean`, `attention` of `blocking`.

## Release baseline overview
Runtime/static overzicht, geen release registry:

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

## Directus/read-only aanpak
Deze fase levert inspectiequeries en een interne POC-route. De output kan later als basis dienen voor Directus read-only views of collections, maar er is geen Directus role/permission redesign en geen composite-PK wijziging uitgevoerd.

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
- QA blocking: `0`
- Generated lines without sources: `0`
- Generated line producttype mismatch: `0`

Backoffice smoke:

- `/internal/backoffice-poc`: HTTP 200
- QA summary zichtbaar
- Product readiness zichtbaar

## Bekende open punten
- Er zijn geen SQL views aangemaakt; de inspectie draait runtime via Node queries.
- Product readiness label `poc_only` is voorlopig een beheerlabel bij ontbrekende actieve supplier offers.
- Supplier offer freshness blijft beperkt tot bestaande velden en bestaande QA-context.
- Directus inrichting is nog niet als role/permission-config uitgewerkt.

## Conclusie
Fase 9 zet een beheerbare backoffice-inspectielaag neer bovenop het bestaande datamodel, zonder schema-impact en zonder recommendation-semantiek te wijzigen.
