# Fase 16-18 — Commerce readiness, API-contract & checklist export v1

## 1. Waar we staan

Laatste baseline:

- Tag: `v1.0.4-public-funnel-polish`
- Commit: `8ad9342`
- Status: public funnel en checkout-preview werken.
- De funnel is geschikt voor echte frontend-/gebruikerstest.
- Er is nog geen echte checkout, betaling, account, order, voorraadreservering, leverancierskoppeling of Shopify-integratie.

De huidige fase heeft een werkende route van homepage tot checkout-preview. De volgende stap is de commerciele architectuur en technische contractlaag voorbereiden, zonder al externe commerce-systemen te koppelen.

## 2. Doel

Fase 16-18 bundelt drie stappen:

1. Commerce architecture blueprint.
2. Recommendation API / commerce payload contract.
3. Checklist/export flow.

Doel:

- Vastleggen hoe de toekomstige headless commerce-architectuur werkt.
- Vastleggen welke data Directus/engine owned blijft en welke data later Shopify owned wordt.
- Een stabiel JSON-contract maken voor recommendation-output.
- Een commerce-preview payload maken die later naar Shopify cart/draft cart kan worden vertaald.
- Een checklist-/exportflow toevoegen als eerste echte eindactie zonder checkout.
- De bestaande public funnel intact houden.

## 3. Niet-doen-lijst

Niet doen:

- Geen echte Shopify-integratie.
- Geen Shopify Storefront API.
- Geen Shopify Admin API.
- Geen Shopify tokens/secrets.
- Geen echte cart creation.
- Geen checkout session.
- Geen betaling.
- Geen PSP-integratie.
- Geen orderdatabase.
- Geen klantaccount.
- Geen auth.
- Geen wachtwoorden.
- Geen klantprofielopslag.
- Geen e-mailverzending.
- Geen Mail naar mezelf functionaliteit.
- Geen voorraadreservering.
- Geen 3PL-/fulfilmentkoppeling.
- Geen returnsproces.
- Geen echte PDF-library tenzij al aanwezig en zonder extra complexiteit.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen nieuwe contentbatch.
- Geen nieuwe producttypes.
- Geen nieuwe itemcatalogus.
- Geen scoring-, quantity- of coveragewijziging.
- Geen productlogica in frontend hardcoden.
- Geen directe package → item koppeling.
- Geen directe add-on → item koppeling.

## 4. Strategische architectuurrichting

Preferred direction:

- Headless frontend + eigen adviesengine + Directus content/backoffice + Shopify als toekomstige commerce-laag.

Rolverdeling:

- Frontend: klantreis, configurator, adviespresentatie, checklist, checkout entry.
- Adviesengine: pakketadvies, quantities, sections, tasks, warnings, explanations.
- Directus/PostgreSQL: scenario’s, needs, capabilities, productregels, item candidates, governance en toekomstige productmasterdata.
- Commerce adapter: vertaalt recommendation lines naar commerce lines.
- Shopify later: catalog/SKU, cart, checkout, betaling, orders, fulfilment, returns.

Belangrijk principe:

> Directus/engine bepaalt waarom iets in het pakket zit. Shopify handelt later alleen de transactie af.

## 5. Ownership matrix

| Domein | Source of truth nu | Source of truth later |
|---|---|---|
| Scenario’s | Directus/Postgres | Directus/Postgres |
| Needs/capabilities | Directus/Postgres | Directus/Postgres |
| Productregels | Directus/Postgres | Directus/Postgres |
| Quantity policies | Directus/Postgres + engine | Directus/Postgres + engine |
| Item candidates | Directus/Postgres | Directus/Postgres |
| Public explanations | Engine/DB mix | Bij voorkeur Directus/DB |
| SKU-identiteit | Directus/Postgres | Directus/Postgres + Shopify mirror |
| Prijs | demo UI-only | Shopify of commerce pricing source |
| Voorraad | niet actief | Shopify/fulfilment |
| Cart | niet actief | Shopify |
| Checkout | preview only | Shopify |
| Order | niet actief | Shopify |
| Betaling | niet actief | Shopify/PSP via Shopify |
| Pakketadvies | engine | engine |
| Checklist | frontend/API | frontend/API |

## 6. API-routes

Voeg JSON-routes toe op de bestaande server.

Minimaal:

- `GET /api/health`
- `GET /api/recommendation`
- `GET /api/recommendation/commerce-payload`
- `GET /api/recommendation/checklist`

Queryparameters sluiten aan op bestaande funnelinput:

- `package`
- `tier`
- `addons`
- `adults`
- `children`
- `pets`
- `duration_hours`

Voor deze fase is GET voldoende. Geen persistence, geen sessie, geen auth.

## 7. Recommendation API-contract

`GET /api/recommendation` retourneert een publieke JSON-representatie van bestaande engine-output.

Minimaal:

```json
{
  "mode": "preview",
  "input": {
    "package_slug": "basispakket",
    "package_label": "Basispakket",
    "tier_slug": "basis_plus",
    "tier_label": "Basis+",
    "addon_slugs": ["stroomuitval", "drinkwater"],
    "addon_labels": ["Stroomuitval", "Drinkwater"],
    "household_adults": 2,
    "household_children": 0,
    "household_pets": 0,
    "duration_hours": 72
  },
  "sections": {
    "core_items": [],
    "accessories": [],
    "supporting_items": [],
    "backup_items": [],
    "optional_additions": []
  },
  "tasks": [],
  "warnings": [],
  "summary": {
    "item_count": 0,
    "task_count": 0,
    "warning_count_label": "0 uniek"
  },
  "disclaimer": "Preview; nog geen definitieve verkoopvoorraad of checkout."
}
```

Geen interne run-id, raw QA-views of technical coverage-jargon in de publieke API, tenzij `debug=true` expliciet wordt meegegeven.

## 8. Commerce payload contract

`GET /api/recommendation/commerce-payload` retourneert een preview payload die later naar Shopify vertaald kan worden.

Minimaal:

```json
{
  "commerce_mode": "preview",
  "commerce_provider_target": "shopify_headless_future",
  "cart_eligible": false,
  "package": {
    "slug": "basispakket",
    "label": "Basispakket",
    "tier_slug": "basis_plus",
    "tier_label": "Basis+"
  },
  "pricing": {
    "status": "indicative_demo",
    "display": "indicatief vanaf €249",
    "is_final": false
  },
  "lines": [
    {
      "sku": "IOE-EXAMPLE",
      "title": "Voorbeelditem",
      "quantity": 1,
      "section": "core_items",
      "commerce_action": "own_stock_candidate",
      "cart_eligible": false,
      "shopify_variant_id": null,
      "reason": "Nog geen definitieve verkoopvoorraad of Shopify-koppeling."
    }
  ],
  "tasks": [],
  "warnings": [],
  "next_actions": [
    "download_checklist",
    "print_checklist",
    "future_shopify_checkout"
  ],
  "disclaimer": "Preview; er wordt geen winkelmand of checkout aangemaakt."
}
```

Commerce actions voor nu:

- `own_stock_candidate`
- `future_supplier_item`
- `task_only`
- `non_commerce_warning`
- `not_for_sale`

Geen echte Shopify variant IDs verplicht.

## 9. Checklist API-contract

`GET /api/recommendation/checklist` retourneert checklistdata.

Minimaal:

```json
{
  "mode": "checklist_preview",
  "generated_at": "ISO timestamp",
  "input": {},
  "items": [
    {
      "title": "Waterpakket",
      "quantity": 3,
      "section": "Kern van je pakket",
      "note": "Waarom dit item in je advies staat."
    }
  ],
  "tasks": [],
  "warnings": [],
  "disclaimer": "Checklist-preview; geen bestelling."
}
```

## 10. Checklist/export route

Voeg een printvriendelijke checklistpagina toe:

- `/pakket/checklist`

Deze route gebruikt dezelfde queryparameters als `/pakket/advies`.

Toon:

- gekozen pakketniveau
- gekozen add-ons
- huishouden
- duur
- datum gegenereerd
- productregels met aantallen
- taken
- aandachtspunten
- demo-/geen-bestellingdisclaimer
- printknop met `window.print()`

Geen PDF-download verplicht in deze fase. Printvriendelijke HTML is voldoende.

## 11. Funnel-integratie

Voeg op relevante public funnel routes links/CTA’s toe:

- `Print checklist`
- `Open checklist`

Geen echte `Koop als pakket` actieve checkoutknop. Wel mag copy voorbereiden:

- `Koop als pakket volgt later na product- en leveranciersinvulling.`

## 12. Blueprint-document

Maak naast de specs ook:

- `handoff/ikoverleef_agent_handoff_v1/docs/commerce_architecture_blueprint_v1.md`

Inhoud minimaal:

- architectuurdiagram in tekst
- headless Shopify voorkeursrichting
- waarom Shopify voor commodity commerce
- waarom engine/Directus de IP-laag blijven
- ownership matrix
- Directus → Shopify one-way sync principe
- toekomstige cart mapping
- checklist/download/mail/koop als pakket fasering
- risico’s en open beslissingen
- niet-implementeren in deze fase

## 13. Regressie-eisen

Nieuwe regression:

- `backend/regression_commerce_readiness_api_checklist_poc.js`

Nieuw script:

- `test:commerce-readiness-poc`

Regression moet minimaal valideren:

1. `GET /api/health` geeft 200 JSON.
2. `GET /api/recommendation` geeft 200 JSON met input, sections, tasks, warnings, summary.
3. `GET /api/recommendation/commerce-payload` geeft 200 JSON met commerce_mode preview en cart_eligible false.
4. Commerce payload bevat lines met sku, title, quantity, section, commerce_action.
5. Commerce payload bevat geen echte shopify_variant_id verplichting.
6. Commerce payload maakt geen cart/checkout/order aan.
7. `GET /api/recommendation/checklist` geeft 200 JSON met items, tasks, warnings.
8. `/pakket/checklist` geeft 200 en bevat printknop.
9. Public funnel blijft werken.
10. `test:public-funnel-polish-poc` blijft groen.
11. `test:public-funnel-poc` blijft groen.
12. `test:mvp-rc-poc` blijft groen.
13. QA blocking = 0.
14. Geen secrets of Shopify tokens.
15. Geen forbidden checkout/payment/account/order CTA’s.

## 14. Verwachte bestanden

Waarschijnlijk wijzigen/toevoegen:

- `apps/internal-poc/server.js`
- `backend/package.json`
- `backend/regression_commerce_readiness_api_checklist_poc.js`
- `handoff/ikoverleef_agent_handoff_v1/content_specs/fase_16_18_commerce_readiness_api_checklist_v1.md`
- `handoff/ikoverleef_agent_handoff_v1/content_specs/fase_16_18_commerce_readiness_api_checklist_implementation_mapping.md`
- `handoff/ikoverleef_agent_handoff_v1/docs/commerce_architecture_blueprint_v1.md`
- `handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.1.0_commerce_readiness_alpha.md`

Niet wijzigen tenzij strikt noodzakelijk:

- `backend/calculate.js`
- database schema
- seeddata
- supplier_offer
- Directus config

## 15. Release

Beoogde tag:

- `v1.1.0-commerce-readiness-alpha`

Release note:

- `release_note_v1.1.0_commerce_readiness_alpha.md`

## 16. Fase-afrondingscriteria

Fase 16-18 is afgerond als:

- Commerce blueprint bestaat.
- API-contracten werken.
- Commerce payload preview werkt.
- Checklist JSON werkt.
- Printvriendelijke checklistpagina werkt.
- Public funnel blijft intact.
- Geen echte Shopify/checkout/payment/account/order is toegevoegd.
- Alle regressions groen zijn.
- QA blocking = 0.
- Release note, commit, tag en push zijn uitgevoerd.
