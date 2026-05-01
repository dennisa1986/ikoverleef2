# Fase 16-18 — Commerce readiness, API-contract & checklist export implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt Fase 16-18 naar de bestaande codebase en datamodelafspraken. De fase bereidt commerce en API-contracten voor, maar implementeert geen echte Shopify-, checkout-, payment-, account- of orderfunctionaliteit.

## 2. Baseline

Vertrekbasis:

- Tag: `v1.0.4-public-funnel-polish`
- Commit: `8ad9342`

## 3. Geen schemawijzigingen

Deze fase vereist geen:

- database schemawijziging
- nieuwe enumwaarden
- nieuwe Directus-collecties
- supplier_offer-uitbreiding
- Shopify credential tabel
- ordertabel
- carttabel
- customer/accounttabel
- paymenttabel
- leadtabel
- checkouttabel
- release registry

Alle nieuwe outputs zijn runtime/API-presentatie bovenop bestaande engine-output.

## 4. Route mapping

Nieuwe routes in bestaande POC-server:

| Route | Type | Doel |
|---|---|---|
| `/api/health` | JSON | eenvoudige health/API-status |
| `/api/recommendation` | JSON | publieke recommendation-output |
| `/api/recommendation/commerce-payload` | JSON | previewpayload voor toekomstige commerce adapter |
| `/api/recommendation/checklist` | JSON | checklistdata |
| `/pakket/checklist` | HTML | printvriendelijke checklistpagina |

Bestaande routes blijven werken:

- `/`
- `/pakket/start`
- `/pakket/addons`
- `/pakket/huishouden`
- `/pakket/advies`
- `/pakket/account`
- `/pakket/checkout`
- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## 5. Input mapping

Alle nieuwe routes gebruiken bestaande funnelinput:

| Query parameter | Engine input |
|---|---|
| `package` | `package_slug` |
| `tier` | `tier_slug` |
| `addons` | `addon_slugs` |
| `adults` | `household_adults` |
| `children` | `household_children` |
| `pets` | `household_pets` |
| `duration_hours` | `duration_hours` |

Gebruik dezelfde fallback/normalisatie als Fase 15/15.1:

- package: `basispakket`
- tier: `basis_plus` als onbekend
- add-ons: allowlist-only
- adults minimaal 1
- children minimaal 0
- pets minimaal 0
- duration_hours minimaal 24, default 72

## 6. Recommendation API mapping

`/api/recommendation` gebruikt bestaande `ensureRecommendationData(...)` en transformeert de output naar publieke JSON.

Publieke JSON mag bevatten:

- input met labels
- sections
- itemregels met title, quantity, section, public_explanation
- tasks met title, description, priority_label
- warnings met public text en groep
- summary counts
- disclaimer

Publieke JSON mag standaard niet bevatten:

- raw run-id
- raw QA-viewnamen
- raw coverage_strength
- raw generated_line_source internals
- scenario_need/accessory_requirement als technische source_type
- counted_as_sufficient
- raw slugs als primaire displaylabels

Als `debug=true` wordt meegegeven, mogen extra debugvelden optioneel worden toegevoegd, maar niet nodig voor deze fase.

## 7. Commerce payload mapping

`/api/recommendation/commerce-payload` gebruikt bestaande recommendation-output en maakt een preview-commercecontract.

Mapping per line:

| Recommendation field | Commerce field |
|---|---|
| SKU/item code | `sku` |
| item title | `title` |
| quantity | `quantity` |
| section | `section` |
| runtime role | `role` |
| explanation | `reason` |

Vaste previewvelden:

- `commerce_mode = preview`
- `commerce_provider_target = shopify_headless_future`
- `cart_eligible = false`
- `shopify_variant_id = null`
- `pricing.status = indicative_demo`
- `pricing.is_final = false`

Commerce action mapping:

- Product lines: `own_stock_candidate`
- Tasks: `task_only`
- Warnings: `non_commerce_warning`
- Items zonder commercebaarheid: `future_supplier_item` of `not_for_sale`

Geen Shopify variant IDs verplicht.
Geen cart aanmaken.
Geen checkout aanmaken.

## 8. Checklist mapping

`/api/recommendation/checklist` gebruikt dezelfde recommendation-output.

Checklist items:

- alle core items
- accessoires
- supporting/backup/optional in aparte of samengevoegde secties
- quantities
- public explanation of korte note

Checklist tasks:

- title
- public description
- priority label

Checklist warnings:

- public warning text
- group label

`/pakket/checklist` rendert dezelfde data als printvriendelijke HTML.

## 9. Blueprint mapping

Maak document:

- `handoff/ikoverleef_agent_handoff_v1/docs/commerce_architecture_blueprint_v1.md`

Dit is docs-only en legt toekomstige architectuur vast.

Geen code hoeft Shopify te importeren of API-calls te doen.

## 10. Shopify/headless mapping

Fase 16-18 legt alleen voorkeursrichting vast:

- Shopify later voor cart/checkout/payment/order/fulfilment/returns.
- Directus/engine blijven eigenaar van advieslogica.
- Directus → Shopify one-way sync als principe.
- Eigen commerce adapter vertaalt later recommendation payload naar Shopify cart lines.

Niet implementeren:

- Shopify clients
- tokens
- environment variables voor Shopify
- API-calls
- webhook handling
- product sync worker

## 11. Bestanden

Waarschijnlijk wijzigen/toevoegen:

- `apps/internal-poc/server.js`
- `backend/package.json`
- `backend/regression_commerce_readiness_api_checklist_poc.js`
- `handoff/ikoverleef_agent_handoff_v1/content_specs/fase_16_18_commerce_readiness_api_checklist_v1.md`
- `handoff/ikoverleef_agent_handoff_v1/content_specs/fase_16_18_commerce_readiness_api_checklist_implementation_mapping.md`
- `handoff/ikoverleef_agent_handoff_v1/docs/commerce_architecture_blueprint_v1.md`
- `handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.1.0_commerce_readiness_alpha.md`

Niet wijzigen tenzij strikt nodig:

- `backend/calculate.js`
- database schema
- seeddata
- supplier_offer
- Directus config

## 12. Regression mapping

Nieuwe script:

```json
"test:commerce-readiness-poc": "node regression_commerce_readiness_api_checklist_poc.js"
```

Valideer:

- API health
- recommendation JSON
- commerce payload JSON
- checklist JSON
- checklist HTML
- public funnel blijft werken
- bestaande core regressions blijven groen
- geen Shopify tokens/secrets
- geen echte checkout/payment/order/account

## 13. Release mapping

Beoogde release:

- Commit: `feat(commerce): add readiness api and checklist contracts`
- Tag: `v1.1.0-commerce-readiness-alpha`

Release note:

- `handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.1.0_commerce_readiness_alpha.md`

## 14. Mapping-check go/no-go

Implementatie mag doorgaan als bevestigd is:

- Geen schemawijziging nodig.
- Geen nieuwe enumwaarden nodig.
- Geen supplier_offer-uitbreiding nodig.
- Geen productlogica-wijziging.
- Geen scoring/quantity/coverage-wijziging.
- Geen echte Shopify-integratie.
- Geen echte checkout/account/payment/order.
- Geen secrets.
- Bestaande regressions blijven groen.

## 15. Afronding

Fase 16-18 is geslaagd als:

- JSON API-routes bestaan.
- Commerce payload preview bestaat.
- Checklist JSON bestaat.
- Printvriendelijke checklistpagina bestaat.
- Commerce blueprint bestaat.
- Public funnel blijft groen.
- Alle relevante regressions groen zijn.
- Release tag `v1.1.0-commerce-readiness-alpha` is gepusht.
