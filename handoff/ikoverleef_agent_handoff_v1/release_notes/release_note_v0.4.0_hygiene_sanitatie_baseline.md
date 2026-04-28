# Release note — v0.4.0-hygiene-sanitatie-baseline

## Fase
Fase 3 — Contentbatch 4 Hygiene, sanitatie & afval

## Baseline
- Commit: release commit met deze release note
- Tag: v0.4.0-hygiene-sanitatie-baseline
- Add-on slug: hygiene_sanitatie_afval

## Doel
Deze baseline voegt basishygiene, noodsanitatie en afvalcontainment toe aan de Ik overleef recommendation engine voor een 72-uurs thuissituatie.

## Architectuurprincipes
- Packages en add-ons hangen niet direct aan items.
- Add-on `hygiene_sanitatie_afval` activeert scenario's.
- Scenario's leiden via needs, capabilities, productregels, quantity policies, item candidates en accessoire requirements tot generated package lines.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, auth, klantaccount of betaalflow.

## Geimplementeerde scenario's
- hygiene-thuis-72u
- noodsanitatie-thuis-72u
- afvalbeheer-thuis-72u

## Geimplementeerde needs
- handhygiene
- basishygiene-reiniging
- noodtoilet-72u
- sanitatie-absorptie-afsluiting
- afval-insluiten
- afval-scheiden
- handbescherming

## Geimplementeerde capabilities
- handen-desinfecteren
- handen-reinigen
- oppervlak-reinigen-met-doekjes
- toiletafval-insluiten
- sanitair-absorberen
- afvalzak-gebruiken
- klein-afval-afsluitbaar-bewaren
- wegwerp-handbescherming

## Belangrijkste itemlogica Basis
- IOE-HANDGEL-BASIC
- IOE-HYGIENE-WIPES-BASIC
- IOE-SOAP-BASIC
- IOE-TOILET-BAGS-BASIC
- IOE-ABSORBENT-BASIC
- IOE-TOILET-PAPER-BASIC
- IOE-WASTE-BAGS-BASIC
- IOE-ZIPBAGS-BASIC
- IOE-GLOVES-NITRILE-BASIC

## Belangrijkste itemlogica Basis+
- IOE-HANDGEL-PLUS
- IOE-HYGIENE-WIPES-PLUS
- IOE-SOAP-PLUS
- IOE-TOILET-BAGS-PLUS
- IOE-ABSORBENT-PLUS
- IOE-TOILET-PAPER-PLUS
- IOE-WASTE-BAGS-PLUS
- IOE-ZIPBAGS-PLUS
- IOE-GLOVES-NITRILE-PLUS

## Quantity policy mapping
- Handgel: fixed 1 per huishouden
- Zeep: fixed 1 per huishouden
- Doekjes: per_person_per_day + 72 uur + pack-size rounding
- Noodtoiletzakken: per_person_per_day + 72 uur + pack-size rounding
- Absorber: accessoire/productregel + fixed 1 pack
- Toiletpapier: fixed 1 pack
- Vuilniszakken: fixed 1 pack
- Zipbags: accessoire/productregel + fixed 1 pack
- Nitril handschoenen: accessoire/productregel + fixed 1 pack, gededuped bij meerdere sources

## Governance
- Handgel dekt handhygiene, maar geen medische bescherming of volledige infectiepreventie.
- Doekjes dekken basale reiniging, maar geen sterilisatie.
- Noodtoiletzakken dekken tijdelijke noodsanitatie met usage warnings.
- Absorber is supporting/accessory en maakt afval niet veilig om zonder bescherming te hanteren.
- Vuilniszakken dekken afvalcontainment, maar geen volledige sanitatie.
- Zipbags ondersteunen klein/geurend afval, maar zijn geen oplossing voor gevaarlijk afval.
- Nitril handschoenen dekken handlingbescherming, maar geen medische steriliteit.
- Multi-source items behouden sources en quantities worden gededuped.

## Usage constraints
- Handgel: fire_risk, child_safety, storage_safety, expiry_sensitive, medical_claim_limit
- Doekjes: medical_claim_limit, storage_safety, expiry_sensitive
- Toiletzakken: hygiene_contamination_risk, disposal_requirement, storage_safety
- Absorber: dosage_warning, child_safety, storage_safety, hygiene_contamination_risk
- Vuilniszakken: hygiene_contamination_risk, disposal_requirement
- Zipbags: hygiene_contamination_risk, disposal_requirement
- Nitril handschoenen: medical_claim_limit, hygiene_contamination_risk, disposal_requirement

## Validatie
- npm run test:stroomuitval-poc: groen
- npm run test:drinkwater-poc: groen
- npm run test:voedsel-poc: groen
- npm run test:hygiene-sanitatie-poc: groen
- QA blocking: 0
- Generated lines without sources: 0
- Generated line producttype mismatch: 0

## Interne webapp
Gecontroleerde POC-routes:

http://127.0.0.1:4173/internal/recommendation-poc?addon=hygiene_sanitatie_afval&tier=basis

http://127.0.0.1:4173/internal/recommendation-poc?addon=hygiene_sanitatie_afval&tier=basis_plus

De interne webapp toont:
- core hygiene/sanitatie/afvalregels;
- accessories;
- multi-source items;
- quantities;
- sources;
- coverage;
- usage warnings;
- governance notes;
- QA-resultaat;
- verschil tussen Basis en Basis+.

## Bekende open punten
- Supporting/backup outputsecties zijn nog niet conceptueel gescheiden in het datamodel.
- Webapp leidt role voorlopig af uit bestaande productregel/source/coverage-informatie.
- Supplier offers blijven POC/handmatig.
- Geen checkout, klantaccount, betaalflow of externe leverancierintegratie.

## Conclusie
Fase 3 is afgerond en vastgezet als baseline `v0.4.0-hygiene-sanitatie-baseline`.
