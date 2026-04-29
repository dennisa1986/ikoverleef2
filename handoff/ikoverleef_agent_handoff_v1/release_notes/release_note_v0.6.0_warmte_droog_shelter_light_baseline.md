# Release note — v0.6.0-warmte-droog-shelter-light-baseline

## Fase
Fase 5 — Contentbatch 6 Warmte, droog blijven & shelter-light

## Baseline
- Commit: release commit met deze release note
- Tag: v0.6.0-warmte-droog-shelter-light-baseline
- Add-on slug: warmte_droog_shelter_light

## Doel
Deze baseline voegt warmtebehoud, backup-noodwarmte, persoonlijke regenbescherming en shelter-light met tarp-accessoires toe aan de Ik overleef recommendation engine, met strikte begrenzing rond slaapcomfort, hypothermie en volledige shelterclaims.

## Architectuurprincipes
- Packages en add-ons hangen niet direct aan items.
- Add-on `warmte_droog_shelter_light` activeert scenario's.
- Scenario's leiden via needs, capabilities, productregels, quantity policies, item candidates en accessoire requirements tot generated package lines.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, auth, klantaccount of betaalflow.

## Geimplementeerde scenario's
- warmtebehoud-thuis-72u
- droog-blijven-thuis-72u
- beschutting-light-thuis-72u

## Geimplementeerde needs
- warmte-behouden
- noodwarmte-backup
- persoonlijk-droog-blijven
- lichte-beschutting
- beschutting-bevestigen
- grondvocht-barriere

## Geimplementeerde capabilities
- warmtedeken-gebruiken
- nooddeken-reflecterend
- regenponcho-gebruiken
- tarp-light-beschutting
- beschutting-bevestigen
- grondvocht-afschermen

## Belangrijkste itemlogica Basis
- IOE-THERMAL-BLANKET-BASIC (warmtedeken, primary, per persoon)
- IOE-EMERGENCY-BLANKET-BASIC (nooddeken, backup, per persoon)
- IOE-PONCHO-BASIC (poncho, primary, per persoon)
- IOE-TARP-LIGHT-BASIC (tarp-light, primary shelter-light, fixed 1)
- IOE-PARACORD-BASIC (paracord, accessory, fixed 1)
- IOE-TARP-PEGS-BASIC (tarp haringen, accessory, fixed 1)

## Belangrijkste itemlogica Basis+
- IOE-THERMAL-BLANKET-PLUS (warmtedeken, primary, per persoon)
- IOE-EMERGENCY-BIVVY-PLUS (noodbivvy, backup, per persoon)
- IOE-PONCHO-PLUS (poncho, primary, per persoon)
- IOE-TARP-LIGHT-PLUS (tarp-light, primary shelter-light, fixed 1)
- IOE-PARACORD-PLUS (paracord, accessory, fixed 1)
- IOE-TARP-PEGS-PLUS (tarp haringen, accessory, fixed 1)
- IOE-GROUNDSHEET-PLUS (grondzeil, supporting vochtbarrière, fixed 1)

## Quantity policy mapping
- Warmtedeken: per_person (adult_factor=1, child_factor=1) → 2 bij POC-huishouden van 2 volwassenen
- Nooddeken/noodbivvy: per_person → 2 bij POC-huishouden
- Regenponcho: per_person → 2 bij POC-huishouden
- Tarp-light: fixed 1 per huishouden
- Paracord: scenario-rule fixed 1 + accessoire requirement bij tarp-light fixed 1 (gededuped tot 1 lijn met meerdere sources)
- Tarp-haringen: scenario-rule fixed 1 + accessoire requirement bij tarp-light fixed 1 (gededuped)
- Grondzeil: fixed 1, alleen Basis+ heeft variant; engine skipt regel netjes voor Basis tier
- Geen nieuwe quantity formula enum toegevoegd

## Environmental en governance warnings
- Warmtedeken: warmtebehoud, geen medische onderkoelingsbehandeling, geen extreme weather garantie
- Nooddeken/noodbivvy: backup voor warmteverlies, geen slaapcomfort, geen onderkoelingsbehandeling
- Poncho: persoonlijke regenbescherming, geen shelter of onderkomen
- Tarp-light: tijdelijke afscherming, geen tent, geen full shelter, geen warmtebron
- Paracord en haringen: bevestiging/verankering, geen beschutting op zichzelf
- Grondzeil: supporting vochtbarrière, geen slaapmat, geen full shelter

## Usage constraints
- Warmtedeken: fire_risk, storage_safety, medical_claim_limit
- Nooddeken/noodbivvy: medical_claim_limit, child_safety (verstikking/verstrikking), storage_safety, fire_risk
- Poncho: storage_safety, fire_risk
- Tarp-light: storage_safety, fire_risk, child_safety (anchor/strugglerisico)
- Paracord: child_safety (verstikking/verstrikking), storage_safety
- Tarp-haringen: child_safety (scherp), storage_safety
- Grondzeil: storage_safety, fire_risk

## Validatie
- npm run test:stroomuitval-poc: groen
- npm run test:drinkwater-poc: groen
- npm run test:voedsel-poc: groen
- npm run test:hygiene-sanitatie-poc: groen
- npm run test:ehbo-poc: groen
- npm run test:warmte-droog-shelter-poc: groen
- QA blocking: 0
- Generated lines without sources: 0
- Generated line producttype mismatch: 0
- Geen full-shelter, slaapcomfort, hypothermie of extreme-weather overclaims

## Interne webapp
Gecontroleerde POC-routes:

http://127.0.0.1:4173/internal/recommendation-poc?addon=warmte_droog_shelter_light&tier=basis

http://127.0.0.1:4173/internal/recommendation-poc?addon=warmte_droog_shelter_light&tier=basis_plus

De interne webapp toont:
- core warmte/droog-regels;
- backup nooddeken/noodbivvy;
- supporting tarp-light shelter-light;
- accessories paracord en haringen;
- supporting grondzeil (Basis+);
- quantities per persoon vs fixed;
- sources;
- coverage (primary/backup/secondary);
- usage warnings;
- governance banners voor warmte- en shelter-light items;
- QA-resultaat;
- verschil tussen Basis en Basis+.

## Bekende open punten
- Per-product-type explanation en governance zijn nog code-driven in `backend/calculate.js`; hardcoded SKU-lijsten groeien lineair per fase. Kandidaat voor refactor naar database-driven explanations vóór Fase 6.
- Supplier offers blijven POC/handmatig.
- Geen checkout, klantaccount, betaalflow of externe leverancierintegratie.
- Geen tent-, slaapzak- of evacuatiebatch in deze fase.

## Conclusie
Fase 5 is afgerond en vastgezet als baseline `v0.6.0-warmte-droog-shelter-light-baseline`.
