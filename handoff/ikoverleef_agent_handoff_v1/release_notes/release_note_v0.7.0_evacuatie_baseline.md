# Release note - v0.7.0-evacuatie-baseline

## Fase
Fase 6 - Contentbatch 7 Evacuatie & documenten

## Baseline
- Commit: release commit for tag `v0.7.0-evacuatie-baseline`
- Tag: v0.7.0-evacuatie-baseline
- Add-on slug: evacuatie

## Doel
Deze baseline voegt evacuatiegereedheid, documentbescherming, signalering, licht onderweg, drinkwater meenemen en persoonlijke readiness-checks toe aan de Ik overleef recommendation engine.

## Architectuurprincipes
- Packages en add-ons hangen niet direct aan items.
- Add-on `evacuatie` activeert scenario's.
- Scenario's leiden via needs, capabilities, productregels, quantity policies, item candidates en accessoire requirements tot generated package lines.
- Evacuatietas is een container- en draagoplossing, niet de waarheid van het pakket.
- Documenten, contacten, cash, sleutels en persoonlijke medicatie blijven tasks/checks.
- Cross-batch reuse blijft actief voor hoofdlamp, drinkfles en filterfles.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.

## Geimplementeerde scenario's
- evacuatiegereed-thuis-72u
- documentveiligheid-evacuatie
- signalering-evacuatie
- licht-onderweg-evacuatie
- drinkwater-onderweg-evacuatie
- persoonlijke-gereedheid-evacuatie

## Geimplementeerde needs
- evacuatietas-dragen
- documenten-beschermen
- documenten-checklist
- hoorbaar-signaleren
- zichtbaar-onderweg
- licht-onderweg
- drinkwater-meenemen-evacuatie
- persoonlijke-gereedheid-checks

## Geimplementeerde capabilities
- evacuatietas-gebruiken
- documenten-waterdicht-bewaren
- documenten-checklist-bijhouden
- hoorbaar-signaleren
- reflecterend-zichtbaar-zijn
- handsfree-licht-onderweg
- draagbaar-licht-onderweg
- drinkwater-meenemen
- water-filteren-onderweg-backup
- persoonlijke-gereedheid-checklist

## Belangrijkste itemlogica Basis
- IOE-EVAC-BAG-BASIC
- IOE-DOC-FOLDER-BASIC
- IOE-WHISTLE-BASIC
- IOE-REFLECTIVE-VEST-BASIC
- IOE-HEADLAMP-AAA-BASIC
- IOE-BATT-AAA-12-BASIC
- IOE-BOTTLE-1L-BASIC

## Belangrijkste itemlogica Basis+
- IOE-EVAC-BAG-PLUS
- IOE-DOC-FOLDER-PLUS
- IOE-WHISTLE-PLUS
- IOE-REFLECTIVE-VEST-PLUS
- IOE-HEADLAMP-AAA-PLUS
- IOE-BATT-AAA-12
- IOE-BOTTLE-1L-PLUS
- IOE-FILTERBOTTLE-PLUS

## Quantity policy mapping
- Evacuatietas: fixed 1 per huishouden
- Documentenmap: fixed 1 per huishouden
- Noodfluit: per_person
- Reflectievest: per_person
- Hoofdlamp: per_person
- Hoofdlamp-batterijen: bestaand accessoire requirement, fixed 1
- Drinkfles: per_person
- Filterfles Basis+: fixed 1 als supporting/backup
- Tasks: geen itemquantity

## Task/check mapping
- documenten-kopieren-en-bundelen
- noodcontacten-noteren
- persoonlijke-medicatie-inpakken-check
- sleutels-cash-en-laders-check
- evacuatietas-periodiek-controleren

Deze tasks genereren geen productlines.

## Reuse en cross-batch gedrag
- Hoofdlamp hergebruikt bestaande stroomuitval-items `IOE-HEADLAMP-AAA-BASIC` en `IOE-HEADLAMP-AAA-PLUS`.
- Drinkfles hergebruikt bestaande drinkwater-items `IOE-BOTTLE-1L-BASIC` en `IOE-BOTTLE-1L-PLUS`.
- Filterfles hergebruikt bestaand drinkwater-item `IOE-FILTERBOTTLE-PLUS`.
- AAA-batterijen voor de hoofdlamp blijven via bestaand accessoirepatroon meelopen.

## Physical/packability mapping
- Bestaande `item_physical_spec` is gebruikt.
- Nieuwe evacuation/mobile items hebben physical specs gekregen.
- Bestaande hoofdlamp-items hebben evacuation physical specs gekregen voor QA-packability.
- Geen nieuwe physical schema-objecten of enumwaarden.

## Governance
- Evacuatietas dekt alleen dragen en packability, niet de inhoud.
- Documentenmap dekt documentbescherming, niet documentcompleetheid.
- Documenten, cash, sleutels, contacten en persoonlijke medicatie blijven tasks/checks.
- Noodfluit ondersteunt signalering, maar garandeert geen redding.
- Reflectievest ondersteunt zichtbaarheid, maar garandeert geen veiligheid.
- Hoofdlamp ondersteunt licht onderweg, maar geen veilige evacuatiegarantie.
- Drinkfles dekt water meenemen, niet thuisvoorraad.
- Filterfles blijft supporting/backup en filtert niet automatisch elk water veilig.

## Usage constraints
- Evacuatietas: storage_safety, child_safety
- Documentenmap: storage_safety
- Noodfluit: child_safety, storage_safety
- Reflectievest: storage_safety
- Hoofdlamp: storage_safety
- Drinkfles: hygiene_contamination_risk
- Filterfles: medical_claim_limit, storage_safety

## Validatie
- npm run test:stroomuitval-poc: groen
- npm run test:drinkwater-poc: groen
- npm run test:voedsel-poc: groen
- npm run test:hygiene-sanitatie-poc: groen
- npm run test:ehbo-poc: groen
- npm run test:warmte-droog-shelter-poc: groen
- npm run test:evacuatie-poc: groen
- QA blocking: 0
- generated lines without sources: 0
- generated line product type mismatch: 0

## Interne webapp
Gecontroleerde POC-route:

`http://127.0.0.1:4173/internal/recommendation-poc?addon=evacuatie&tier=basis_plus`

De interne webapp toont:
- core evacuatie/document/signaling/water/light regels;
- containerframing voor de evacuatietas;
- reused items;
- supporting/backup filterfles;
- tasks;
- sources;
- coverage;
- usage constraints;
- QA-resultaat.

## Bekende open punten
- Preparedness tasks blijven een read-only checklistlaag en niet een volwaardige workflow-engine.
- Filterfles blijft bewust backup/supporting en vervangt geen primaire waterbasis.
- Documentcompleetheid, cash, sleutels en persoonlijke medicatie blijven gebruikersverantwoordelijkheid.
- Geen checkout, account, betaalflow of externe leverancierintegratie.

## Conclusie
Fase 6 is technisch afgerond en vastgezet als baseline `v0.7.0-evacuatie-baseline`.
