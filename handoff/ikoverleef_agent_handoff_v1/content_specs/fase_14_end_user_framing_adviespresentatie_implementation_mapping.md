# Fase 14 — Eindgebruikersframing & adviespresentatie implementation mapping

## Doel

Dit mappingdocument vertaalt Fase 14 naar de bestaande repo en het bestaande datamodel.

Fase 14 wijzigt presentatie en framing. Fase 14 wijzigt niet:

- database-schema;
- enumwaarden;
- recommendation-semantiek;
- scoring;
- quantity policies;
- coverage;
- productregels;
- candidates;
- supplier_offer;
- Directus composite-PK;
- package/add-on → item architectuur.

## Bestandsmapping

Waarschijnlijk aan te passen:

- `apps/internal-poc/server.js`
- `backend/package.json`
- `backend/regression_end_user_framing_poc.js`
- `handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.0.2_end_user_framing.md`

Optioneel:

- `README.md` korte update over end-user framing.

Niet aanpassen tenzij strikt nodig:

- `backend/calculate.js`
- database seeds
- schema
- supplier_offer
- Directus config

## Route mapping

Bestaande routes blijven:

- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

Geen nieuwe route vereist.

Optioneel: `/mvp/recommendation?debug=1` alleen als dit volledig runtime-only is.

## Input mapping

Bestaande input blijft:

- `package`
- `tier`
- `addon` / `addons`
- `adults`
- `children`
- `pets`
- `duration_hours`

UI-label mapping:

- `basis` → `Basis`
- `basis_plus` → `Basis+`
- `stroomuitval` → `Stroomuitval`
- `drinkwater` → `Drinkwater`
- `voedsel_bereiding` → `Voedsel & bereiding`
- `hygiene_sanitatie_afval` → `Hygiëne, sanitatie & afval`
- `ehbo_persoonlijke_zorg` → `EHBO & persoonlijke zorg`
- `warmte_droog_shelter_light` → `Warmte, droog blijven & beschutting-light`
- `evacuatie` → `Evacuatie & documenten`
- `taken_profielen` → `Persoonlijke checks`

Deze mapping is UI-only. Slugs blijven ongewijzigd.

## Output mapping

Bestaande engine-output blijft leidend:

```js
sections.core_items
sections.accessories
sections.supporting_items
sections.backup_items
sections.optional_additions
tasks
warnings
qa_summary
lines
```

Eindgebruikersweergave:

- `core_items` → `Kern van je pakket`
- `accessories` → `Benodigde accessoires`
- `supporting_items + backup_items + optional_additions` → `Backup en ondersteuning`
- `tasks` → `Persoonlijke taken`
- `warnings` → `Aandachtspunten`

Interne/debugweergave blijft op:

- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## Interne details mapping

Op `/mvp/recommendation` niet prominent tonen:

- SKU;
- run-id;
- QA summary;
- backoffice-link;
- scenario_need;
- accessory_requirement;
- coverage_strength;
- counted_as_sufficient;
- capability slug;
- need slug;
- producttype slug.

Interne details blijven beschikbaar via interne routes.

## Warning mapping

Warnings blijven uit bestaande runtime-output komen.

Geen nieuwe warningtypes of enums.

Runtime groepering mag via tekst/slug-heuristiek:

- water/voedsel;
- vuur/gas;
- medisch/EHBO;
- evacuatie/documenten;
- opslag/houdbaarheid;
- persoonlijke checks.

Deduplicatie is runtime-only.

## CTA mapping

Toegestane CTA’s zijn presentatie-only:

- print/checklist via browser;
- checklist gebruiken;
- later pakketvoorstel aanvragen als demo-copy zonder verwerking;
- interne onderbouwing bekijken als intern gemarkeerde link.

Geen:

- checkout;
- cart;
- winkelmand;
- betaling;
- account;
- login;
- register;
- order;
- leadformulier met opslag;
- e-mailverzending.

## Prijs/gewicht mapping

Geen echte prijs- of gewichtsmapping.

Alleen placeholdercopy:

- `Prijs en gewicht volgen in de commerciële pakketfase.`
- `Nog geen verkoopvoorraad of definitieve leveranciersdata.`

Geen supplier_offer uitbreiding.

## Test mapping

Nieuw script:

```json
"test:end-user-framing-poc": "node regression_end_user_framing_poc.js"
```

Regression valideert:

- `/mvp` werkt;
- `/mvp/recommendation` werkt;
- eindgebruikerscopy bevat verwachting en volgende stap;
- hoofdweergave bevat geen dominante interne termen;
- checkout/payment/account/cart ontbreken;
- interne routes blijven werken;
- demo-readiness en MVP RC regressions blijven groen.

## Release mapping

Release note:

`handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.0.2_end_user_framing.md`

Voorgestelde tag:

`v1.0.2-end-user-framing`

## Go/no-go

Implementatie mag doorgaan als:

- geen schemawijziging nodig is;
- geen nieuwe enum nodig is;
- geen supplier_offer uitbreiding nodig is;
- geen productlogica wijzigt;
- geen checkout/account/payment wordt toegevoegd;
- interne routes intact blijven;
- bestaande regressions groen blijven.

Stop als:

- recommendation-semantiek aangepast moet worden;
- nieuwe DB-velden/tabel nodig lijken;
- echte prijs/voorraad/leverancierdata nodig lijkt;
- checkout/account/leadopslag nodig lijkt;
- contentlogica of productregels moeten wijzigen.
