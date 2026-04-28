# Release note — v0.5.0-ehbo-baseline

## Fase
Fase 4 — Contentbatch 5 EHBO & persoonlijke zorg

## Baseline
- Commit: release commit met deze release note
- Tag: v0.5.0-ehbo-baseline
- Add-on slug: ehbo_persoonlijke_zorg

## Doel
Deze baseline voegt basale EHBO, kleine wondzorg, ondersteunende temperatuurcontrole en persoonlijke zorgchecks toe aan de Ik overleef recommendation engine.

## Architectuurprincipes
- Packages en add-ons hangen niet direct aan items.
- Add-on `ehbo_persoonlijke_zorg` activeert scenario's.
- Scenario's leiden via needs, capabilities, productregels, quantity policies, item candidates en accessoire requirements tot generated package lines.
- Persoonlijke medicatie en pijnstilling worden als preparedness tasks/checks vastgelegd, niet als generieke productregels.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, auth, klantaccount of betaalflow.

## Geimplementeerde scenario's
- ehbo-wondzorg-thuis-72u
- persoonlijke-zorg-thuis-72u
- persoonlijke-medicatie-check-thuis-72u

## Geimplementeerde needs
- basis-ehbo
- wonden-afdekken
- wondreiniging-ondersteunen
- verband-fixeren
- zorg-handbescherming
- temperatuur-controleren
- persoonlijke-medicatie-check
- pijnstilling-governance-check

## Geimplementeerde capabilities
- basis-ehbo-set-gebruiken
- pleisters-gebruiken
- steriel-gaas-gebruiken
- wondreiniging-ondersteunen
- verband-fixeren
- wegwerp-handschoenen-zorg
- temperatuur-meten
- persoonlijke-medicatie-herinneren
- pijnstilling-checklist

## Belangrijkste itemlogica Basis
- IOE-FIRSTAID-KIT-BASIC
- IOE-PLASTERS-BASIC
- IOE-STERILE-GAUZE-BASIC
- IOE-WOUND-CLEANING-BASIC
- IOE-MEDICAL-TAPE-BASIC
- IOE-GLOVES-NITRILE-BASIC

## Belangrijkste itemlogica Basis+
- IOE-FIRSTAID-KIT-PLUS
- IOE-PLASTERS-PLUS
- IOE-STERILE-GAUZE-PLUS
- IOE-WOUND-CLEANING-PLUS
- IOE-MEDICAL-TAPE-PLUS
- IOE-GLOVES-NITRILE-PLUS
- IOE-THERMOMETER-PLUS

## Quantity policy mapping
- EHBO-set: fixed 1 per huishouden
- Pleisters: fixed 1 pack
- Steriel gaas: fixed 1 pack
- Wondreiniging: fixed 1
- Verbandtape: accessoire/productregel + fixed 1
- Nitril handschoenen: accessoire/productregel + fixed 1 pack, hergebruikt uit Fase 3 en gededuped
- Thermometer: Basis+ fixed 1, supporting
- Persoonlijke medicatie: geen itemquantity
- Pijnstilling: geen itemquantity

## Medical governance
- EHBO-set dekt basis-EHBO, maar vervangt geen arts, professionele hulp of noodhulp.
- Pleisters dekken kleine wondafdekking, niet ernstige verwondingen.
- Steriel gaas ondersteunt wondafdekking, maar garandeert geen infectiepreventie.
- Wondreiniging ondersteunt reiniging volgens instructie, maar behandelt of voorkomt geen infectie.
- Verbandtape is fixatie/supporting, geen behandeling.
- Handschoenen dekken handbescherming bij wondzorg, maar geen steriele medische bescherming.
- Thermometer meet temperatuur, maar stelt geen diagnose en geeft geen behandeladvies.
- Persoonlijke medicatie wordt niet als generiek item gegenereerd.
- Pijnstilling wordt niet als generiek item gegenereerd.

## Usage constraints
- EHBO-set: medical_claim_limit, storage_safety, expiry_sensitive, child_safety
- Pleisters: medical_claim_limit, expiry_sensitive, storage_safety
- Steriel gaas: medical_claim_limit, expiry_sensitive, storage_safety, disposal_requirement
- Wondreiniging: medical_claim_limit, expiry_sensitive, child_safety, storage_safety
- Verbandtape: medical_claim_limit, storage_safety
- Nitril handschoenen: medical_claim_limit, hygiene_contamination_risk, disposal_requirement
- Thermometer: medical_claim_limit, storage_safety
- Persoonlijke medicatie/pijnstilling: preparedness tasks met medical-governance waarschuwing, geen productline

## Validatie
- npm run test:stroomuitval-poc: groen
- npm run test:drinkwater-poc: groen
- npm run test:voedsel-poc: groen
- npm run test:hygiene-sanitatie-poc: groen
- npm run test:ehbo-poc: groen
- QA blocking: 0
- Generated lines without sources: 0
- Generated line producttype mismatch: 0
- Verboden medicatie-/pijnstiller-SKU's: 0

## Interne webapp
Gecontroleerde POC-routes:

http://127.0.0.1:4173/internal/recommendation-poc?addon=ehbo_persoonlijke_zorg&tier=basis

http://127.0.0.1:4173/internal/recommendation-poc?addon=ehbo_persoonlijke_zorg&tier=basis_plus

De interne webapp toont:
- core EHBO-regels;
- accessories;
- supporting thermometer;
- quantities;
- sources;
- coverage;
- usage warnings;
- governance notes;
- QA-resultaat;
- verschil tussen Basis en Basis+;
- tasks/open punt rond persoonlijke medicatie en pijnstilling.

## Bekende open punten
- Preparedness tasks worden intern getoond als checks, niet als klantflow.
- Persoonlijke medicatie en pijnstilling blijven bewust buiten productgeneratie.
- Supplier offers blijven POC/handmatig.
- Geen checkout, klantaccount, betaalflow of externe leverancierintegratie.

## Conclusie
Fase 4 is afgerond en vastgezet als baseline `v0.5.0-ehbo-baseline`.
