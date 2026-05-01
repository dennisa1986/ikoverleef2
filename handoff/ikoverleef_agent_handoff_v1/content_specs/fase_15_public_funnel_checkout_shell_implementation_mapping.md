# Fase 15 — Public funnel & checkout shell implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt Fase 15 naar de bestaande codebase en datamodelafspraken. De fase is UI-/funnelgericht en vereist geen schemawijziging, geen nieuwe enumwaarden en geen wijziging aan recommendation-semantiek.

## 2. Baseline

Vertrekbasis:

- Tag: `v1.0.2-end-user-framing`
- Commit: `0bc1584`

## 3. Geen schemawijzigingen

Fase 15 vereist geen:

- database schemawijziging
- nieuwe enumwaarden
- nieuwe Directus-collecties
- supplier_offer-uitbreiding
- ordertabel
- carttabel
- customer/accounttabel
- paymenttabel
- leadtabel
- checkouttabel
- release registry

Alle nieuwe funnelstatus wordt via querystring/runtime-state afgehandeld.

## 4. Route mapping

Nieuwe routes in bestaande POC-server:

| Route | Doel | Data |
|---|---|---|
| `/` | Homepage | statische copy + CTA |
| `/pakket/start` | Stap 1 tierkeuze | querystring |
| `/pakket/addons` | Stap 2 add-ons | querystring |
| `/pakket/huishouden` | Stap 3 huishouden | querystring |
| `/pakket/advies` | Stap 4 overzicht/advies | existing recommendation engine |
| `/pakket/account` | Stap 5 account/lidmaatschap pitch | querystring |
| `/pakket/checkout` | Stap 6 checkout-preview | existing recommendation engine + querystring |

Bestaande routes blijven:

- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## 5. Input mapping

Frontend query parameters mappen naar bestaande runtime input.

| Funnel parameter | Engine input |
|---|---|
| `package` | `package_slug` |
| `tier` | `tier_slug` |
| `addons` | `addon_slugs` |
| `adults` | `household_adults` |
| `children` | `household_children` |
| `pets` | `household_pets` |
| `duration_hours` | `duration_hours` |

Fallbacks:

- package: `basispakket`
- tier: `basis_plus` als onbekend
- addons: allowlist-only, default eventueel `stroomuitval,drinkwater,evacuatie`
- adults: minimaal 1
- children: minimaal 0
- pets: minimaal 0
- duration_hours: minimaal 24, default 72

## 6. Tier/pricing mapping

Gebruik UI-only demo pricing constants.

Geen databaseprijzen.

Voorstel:

```js
const DEMO_PRICE_BANDS = {
  basis: {
    label: 'Basis',
    demoFromPrice: 149,
    description: 'Functioneel en nuchter.'
  },
  basis_plus: {
    label: 'Basis+',
    demoFromPrice: 249,
    description: 'Robuuster, met meer comfort en backup waar zinvol.'
  }
};
```

Verplichte tekst:

- `indicatief`
- `demo`
- `definitieve prijs volgt na product- en leveranciersinvulling`

Niet gebruiken als echte verkoopprijs.

## 7. Add-on mapping

Gebruik bestaande add-on slugs en labels uit Fase 14.

Groepen zijn UI-only:

- Basiszekerheid
- Zorg & huishouden
- Omgeving & verplaatsing
- Persoonlijke checks

Geen nieuwe add-onrecord.
Geen nieuwe add-on enum.
Geen directe add-on → item koppeling.

## 8. Recommendation mapping

Stap `/pakket/advies` en `/pakket/checkout` gebruiken bestaande recommendation engine-output.

Gebruik bestaande helperlogica indien aanwezig:

- `inputForSelection`
- `loadRecommendationData`
- render helpers uit `apps/internal-poc/server.js`

De frontend/funnel mag niet:

- productregels berekenen
- quantities berekenen
- coverage berekenen
- itemselectie doen
- Basis/Basis+ candidates kiezen
- dedupe doen

## 9. Account/lidmaatschap mapping

Stap 5 is alleen een front-end pitch.

Geen:

- account creation
- auth
- password
- email
- customer table
- profile table
- session table
- persistence

Gebruik querystring voor keuze:

- `account_intent=guest`
- `account_intent=later`

Of vergelijkbaar.

Copy:

- `Gratis account later activeren`
- `Ga verder als gast`
- `In deze demo wordt nog geen account aangemaakt en niets opgeslagen.`

## 10. Checkout-shell mapping

Checkout-preview is stateless.

Geen:

- order
- payment
- cart persistence
- PSP
- invoice
- shipment
- stock reservation

Gebruik bestaande input + recommendation-output om een preview te tonen.

Verboden woorden/CTA’s in actieve verkoopzin:

- `Bestel nu`
- `Afrekenen`
- `Betalen`
- `In winkelmand`
- `Plaats bestelling`

Wel toegestaan:

- `Checkout-preview`
- `Pakketvoorstel later aanvragen`
- `Terug naar advies`
- `Keuzes aanpassen`

## 11. Public vs internal mapping

Publieke funnelroutes tonen geen prominente technische debug:

- geen Run-ID
- geen SKU dominant
- geen QA summary als eindgebruikersblok
- geen coverage_strength
- geen scenario_need
- geen accessory_requirement
- geen counted_as_sufficient

Interne routes blijven beschikbaar voor debug:

- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## 12. Bestaande regressions

De volgende regressions moeten groen blijven:

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
- `test:mvp-suite-poc`
- `test:mvp-rc-poc`
- `test:demo-readiness-poc`
- `test:end-user-framing-poc`

Nieuwe regression:

- `test:public-funnel-poc`

## 13. Bestanden

Waarschijnlijk te wijzigen:

- `apps/internal-poc/server.js`
- `backend/package.json`
- `backend/regression_public_funnel_checkout_shell_poc.js`
- `handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.0.3_public_funnel_shell.md`

Docs toevoegen:

- `handoff/ikoverleef_agent_handoff_v1/content_specs/fase_15_public_funnel_checkout_shell_v1.md`
- `handoff/ikoverleef_agent_handoff_v1/content_specs/fase_15_public_funnel_checkout_shell_implementation_mapping.md`

Niet wijzigen tenzij strikt nodig:

- `backend/calculate.js`
- database schema
- seeddata
- supplier_offer
- Directus config

## 14. Mapping-check go/no-go

Implementatie mag doorgaan als bevestigd is:

- Geen schemawijziging nodig.
- Geen nieuwe enumwaarden nodig.
- Geen supplier_offer-uitbreiding nodig.
- Geen productlogica-wijziging.
- Geen scoring/quantity/coverage-wijziging.
- Geen echte checkout/account/payment/order.
- Geen secrets.
- Bestaande regressions blijven groen.

## 15. Afronding

Beoogde release:

- Commit: `feat(ui): add public funnel and checkout shell`
- Tag: `v1.0.3-public-funnel-shell`

Fase 15 is geslaagd als de gebruiker door de volledige funnel kan klikken tot checkout-preview en de bestaande recommendation engine-output intact blijft.
