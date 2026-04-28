# Release note — v0.3.0-voedsel-bereiding-baseline

## Fase
Fase 2 — Contentbatch 3 Voedsel & voedselbereiding

## Baseline
- Commit: ca75d26
- Tag: v0.3.0-voedsel-bereiding-baseline
- Add-on slug: voedsel_bereiding

## Doel
Deze baseline voegt voedselzekerheid en ondersteunende voedselbereiding toe aan de Ik overleef recommendation engine.

## Architectuurprincipes
- Packages en add-ons hangen niet direct aan items.
- Add-on `voedsel_bereiding` activeert scenario’s.
- Scenario’s leiden via needs, capabilities, productregels, quantity policies, item candidates en accessoire requirements tot generated package lines.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, auth, klantaccount of betaalflow.

## Geïmplementeerde scenario’s
- voedselzekerheid-thuis-72u
- voedselbereiding-stroomuitval-thuis

## Geïmplementeerde needs
- voedselzekerheid-72u
- eetbaar-zonder-koken
- houdbaar-zonder-koeling
- blikopenen
- voedsel-verwarmen-ondersteunend

## Geïmplementeerde capabilities
- houdbaar-voedsel-persoonsdag
- eetbaar-zonder-koken
- geen-koeling-nodig
- blikopenen
- buiten-verwarmen-koken
- compatibele-brandstof
- ontsteken
- kookvat-gebruiken

## Belangrijkste itemlogica
Basis:
- IOE-FOOD-PACK-1PD-BASIC
- IOE-CAN-OPENER-BASIC
- IOE-COOKER-OUTDOOR-GAS-BASIC
- IOE-FUEL-GAS-230G-BASIC
- IOE-IGNITION-LIGHTER-BASIC
- IOE-COOK-POT-BASIC

Basis+:
- IOE-FOOD-PACK-1PD-PLUS
- IOE-MULTITOOL-CAN-OPENER-PLUS
- IOE-COOKER-OUTDOOR-GAS-PLUS
- IOE-FUEL-GAS-230G-PLUS
- IOE-IGNITION-STORM-LIGHTER-PLUS
- IOE-COOK-SET-PLUS

## Quantity policy
- Voedsel: per_person_per_day + 72 uur + pack-size rounding
- Blikopener/multitool: fixed 1
- Stove: fixed 1
- Ontsteking: fixed 1
- Kookvat/kookset: fixed 1
- Fuel Basis: fixed 1
- Fuel Basis+: fixed 2

## Governance
- Voedselzekerheid blijft core.
- Voedsel is zonder koken bruikbaar.
- Voedsel is houdbaar zonder koeling.
- Koken/verwarmen is supporting.
- Stove/fuel/ignition/pot geven nooit primary food coverage.
- Gas/open vuur wordt niet als veilige binnenoplossing geclaimd.
- Usage constraints zijn vastgelegd voor binnengebruik, ventilatie, brandrisico, brandstofcompatibiliteit, kindveiligheid, opslagveiligheid en houdbaarheid.

## Validatie
- npm run test:stroomuitval-poc: groen
- npm run test:drinkwater-poc: groen
- npm run test:voedsel-poc: groen
- QA blocking: 0

## Interne webapp
Gecontroleerde POC-route:

http://127.0.0.1:4173/internal/recommendation-poc?addon=voedsel_bereiding&tier=basis_plus

De interne webapp toont:
- core voedselregels;
- accessories;
- supporting kookoplossing;
- sources;
- coverage;
- usage constraints;
- QA-resultaat.

## Bekende open punten
- Supporting/backup outputsecties zijn nog niet conceptueel gescheiden in het datamodel.
- Webapp leidt role voorlopig af uit bestaande productregel/source/coverage-informatie.
- Supplier offers blijven POC/handmatig.
- Geen checkout, klantaccount, betaalflow of externe leverancierintegratie.

## Conclusie
Fase 2 is afgerond en vastgezet als baseline `v0.3.0-voedsel-bereiding-baseline`.
