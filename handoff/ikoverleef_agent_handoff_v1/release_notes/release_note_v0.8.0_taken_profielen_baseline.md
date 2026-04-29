# Release note - v0.8.0-taken-profielen-baseline

## Fase
Fase 7 - Contentbatch 8 Taken, profielafhankelijkheden & package-polish

## Baseline
- Commit: release commit for tag `v0.8.0-taken-profielen-baseline`
- Tag: v0.8.0-taken-profielen-baseline
- Add-on slug: taken_profielen

## Doel
Deze baseline bewijst dat Ik overleef naast productregels ook taken/checks, profielafhankelijkheden en package-polish betrouwbaar kan verwerken zonder persoonlijke productgeneratie.

## Architectuurprincipes
- Packages en add-ons hangen niet direct aan items.
- Add-on `taken_profielen` activeert scenario's.
- Task-only needs blijven `content_only` en genereren geen package lines.
- `preparedness_task` wordt gebruikt voor checks naast producten.
- Profielinput blijft tijdelijk en request-gebonden; er is geen klantprofielopslag.
- Bestaande quantity policies voor adults/children/duration blijven leidend.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen baby-/huisdierproductmodule.
- Geen persoonlijke medicatie-, documenten-, cash-, sleutel- of contactproductitems.

## Scenario's
- profiel-taken-thuis-72u
- kinderen-voorbereiding-checks
- huisdieren-voorbereiding-checks
- persoonlijke-gereedheid-checks
- pakketadvies-polish

## Needs
- duur-profiel-check
- kinderen-gereedheid-check
- baby-gereedheid-check
- huisdieren-gereedheid-check
- persoonlijke-medicatie-check
- documenten-contacten-check
- sleutels-cash-laders-check
- pakketadvies-controleren

## Capabilities
- duur-en-profiel-controleren
- kinderen-voorbereiding-controleren
- baby-voorbereiding-controleren
- huisdieren-voorbereiding-controleren
- persoonlijke-medicatie-controleren
- documenten-contacten-controleren
- sleutels-cash-laders-controleren
- pakketadvies-periodiek-controleren

## Task-only mapping
- `preparedness_task` is gebruikt voor alle Fase 7 output.
- De add-on `taken_profielen` genereert zelf geen productregels.
- Task-only needs blijven buiten `generated_package_line`.
- Profielgevoelige checks zijn generiek geformuleerd met "indien van toepassing" waar schema-conditionering ontbreekt.

## Profielafhankelijkheden
- Profielinput blijft beperkt tot runtime-input:
  - `household_adults`
  - `household_children`
  - `household_pets`
  - `duration_hours`
- Kinderen en huisdieren verschijnen als tasks/checks en niet als aparte productmodule.
- Persoonlijke medicatie blijft checklistwerk zonder product of doseringsadvies.

## Package-polish
- duur-en-huishouden-controleren
- kinderen-benodigdheden-check
- baby-benodigdheden-check
- huisdieren-water-voer-check
- persoonlijke-medicatie-controleren
- documenten-en-contacten-controleren
- sleutels-cash-laders-controleren
- houdbaarheid-en-batterijen-controleren
- pakketadvies-periodiek-herzien

## Quantity/profile behavior
- Geen nieuwe quantity policy types toegevoegd.
- Bestaande `child_factor` en `duration_day_factor` blijven werken.
- `pet_factor` blijft schema-ondersteund maar wordt in de huidige dataset nog niet actief gebruikt.
- Profielcombo-run met `drinkwater + taken_profielen` valideert dat bestaande quantiteiten blijven werken:
  - `IOE-WATER-PACK-6L-PLUS x4`
  - `IOE-JERRYCAN-20L-PLUS x1`
  - `IOE-WATERFILTER-PLUS x1`
  - `IOE-WATER-TABS-PLUS x1`

## Validatie
- npm run test:stroomuitval-poc: groen
- npm run test:drinkwater-poc: groen
- npm run test:voedsel-poc: groen
- npm run test:hygiene-sanitatie-poc: groen
- npm run test:ehbo-poc: groen
- npm run test:warmte-droog-shelter-poc: groen
- npm run test:evacuatie-poc: groen
- npm run test:taken-profielen-poc: groen
- QA blocking: 0
- generated lines without sources: 0
- generated line product type mismatch: 0
- verboden persoonlijke productitems: 0

## Interne webapp-route
- `http://127.0.0.1:4173/internal/recommendation-poc?addon=taken_profielen&tier=basis`
- `http://127.0.0.1:4173/internal/recommendation-poc?addon=taken_profielen&tier=basis_plus`

De interne POC toont:
- tasks/checks;
- profielinput en duration;
- warnings;
- QA-resultaat;
- bestaande productlabels wanneer een andere add-on actief is.

## Bekende open punten
- Multi-add-on URL's zoals `addon=evacuatie,taken_profielen` zijn niet als vaste webapp-flow toegevoegd; de huidige POC blijft op enkelvoudige add-onselectie gericht.
- Profielconditionering voor kinderen/baby's/huisdieren gebruikt algemene "indien van toepassing"-teksten, omdat `preparedness_task` geen conditionele targetingkolommen heeft.
- `pet_factor` bestaat in het schema, maar wordt in de huidige seeddata nog niet actief gebruikt door bestaande productpolicies.

## Conclusie
Fase 7 is afgerond als baseline `v0.8.0-taken-profielen-baseline` en bewijst dat tasks/checks, profielinput en package-polish naast de bestaande productengine kunnen meedraaien zonder schema-uitbreiding.
