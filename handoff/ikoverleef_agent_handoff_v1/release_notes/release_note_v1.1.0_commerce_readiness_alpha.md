# Release note — v1.1.0-commerce-readiness-alpha

## Fase

Fase 16-18 — Commerce readiness, API-contract & checklist export

## Baseline

- Vertrekbasis: `v1.0.4-public-funnel-polish`
- Vertrekcommit: `8ad9342`
- Nieuwe tag: `v1.1.0-commerce-readiness-alpha`

## Doel

Deze release bereidt de public funnel voor op toekomstige headless commerce zonder echte commerce te bouwen. De release voegt JSON-contracten, een commerce-preview payload, een checklistcontract en een printvriendelijke checklistpagina toe.

## Scope

Wel toegevoegd:

- commerce architecture blueprint
- publieke recommendation JSON
- commerce payload preview
- checklist JSON
- printvriendelijke checklistpagina
- regression voor API/checklist/commerce readiness

Niet toegevoegd:

- Shopify-integratie
- Shopify Storefront/Admin API
- tokens of secrets
- cart creation
- checkout session
- betaling
- orderdatabase
- account/auth
- e-mail
- voorraadreservering
- productlogica-, scoring-, quantity- of coveragewijzigingen

## Commerce architecture blueprint

Toegevoegd:

- `handoff/ikoverleef_agent_handoff_v1/docs/commerce_architecture_blueprint_v1.md`

De blueprint legt vast:

- headless Shopify als toekomstige commerce-richting
- Directus/engine als IP- en advieslaag
- ownership matrix
- Directus → Shopify one-way sync principe
- toekomstige cart mapping
- fasering voor checklist/download/mail/koop als pakket

## API-routes

Nieuwe routes:

- `GET /api/health`
- `GET /api/recommendation`
- `GET /api/recommendation/commerce-payload`
- `GET /api/recommendation/checklist`

Bestaande public funnel- en interne routes blijven werken.

## Recommendation JSON-contract

`/api/recommendation` retourneert:

- preview mode
- input met labels
- sections
- tasks
- warnings
- summary
- disclaimer

Standaard worden geen raw run-id, QA-viewnamen of technische coveragevelden publiek gemaakt.

## Commerce payload preview

`/api/recommendation/commerce-payload` retourneert:

- `commerce_mode=preview`
- `commerce_provider_target=shopify_headless_future`
- `cart_eligible=false`
- indicatieve demo-pricing
- lines met SKU, title, quantity, section en commerce_action
- `shopify_variant_id=null`

Er wordt geen cart, checkout of order aangemaakt.

## Checklist JSON

`/api/recommendation/checklist` retourneert:

- generated timestamp
- input
- items met aantallen
- tasks
- warnings
- checklistdisclaimer

## Printvriendelijke checklist

Toegevoegd:

- `/pakket/checklist`

De pagina toont:

- gekozen pakketniveau
- gekozen add-ons
- huishouden
- duur
- gegenereerde datum
- items met aantallen
- taken
- aandachtspunten
- printknop

Geen PDF-download, e-mail of opslag.

## Bewust buiten scope

- echte checkout
- betaling
- account/auth
- orderdatabase
- klantprofielopslag
- e-mailverzending
- voorraadreservering
- Shopify API-calls
- secrets
- schemawijzigingen
- nieuwe enumwaarden
- supplier_offer uitbreiding

## Validatie

Validatie vereist:

- alle bestaande regressions groen
- `npm run test:public-funnel-polish-poc` groen
- `npm run test:commerce-readiness-poc` groen
- QA blocking = 0
- generated lines without sources = 0
- producttype mismatch = 0
- forbidden UI links/CTA’s = 0

## Open punten

- Definitieve commerce adapter volgt later.
- Shopify variant mapping volgt pas na product- en prijsstrategie.
- Checklistdownload/PDF en mailflow zijn expliciet latere beslissingen.

## Conclusie

Commerce readiness alpha is voorbereid: de funnel heeft nu stabiele API-contracten, een commerce-preview payload en een checklist-exportflow zonder echte commercefunctionaliteit.
