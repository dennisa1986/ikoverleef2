# Commerce architecture blueprint v1

## Context

Baseline: `v1.0.4-public-funnel-polish` (`8ad9342`).

Deze blueprint beschrijft de voorkeursrichting voor toekomstige commerce rond Ik overleef. Dit document implementeert geen Shopify-koppeling, checkout, betaling, order, account of voorraadreservering.

## Architectuurdiagram in tekst

```txt
Publieke frontend
  -> configurator / funnel / checklist
  -> recommendation API
  -> commerce payload preview

Recommendation engine
  -> scenario's
  -> needs
  -> capabilities
  -> productregels
  -> quantity policies
  -> item candidates
  -> generated lines
  -> tasks / warnings / QA

Directus + PostgreSQL
  -> content/backoffice
  -> governance
  -> productmasterdata
  -> supplier/source notes

Commerce adapter (later)
  -> vertaalt recommendation lines naar commerce lines
  -> bewaakt cart eligibility
  -> bewaart uitleg waarom iets gekozen is

Shopify headless (later)
  -> catalog/SKU mirror
  -> cart
  -> checkout
  -> payment
  -> orders
  -> fulfilment/returns
```

## Voorkeursrichting

De voorkeursrichting is:

- headless frontend
- eigen recommendation engine
- Directus/PostgreSQL als content- en backoffice-laag
- Shopify later als commerce-laag

Belangrijk principe:

> Directus en de engine bepalen waarom iets in het pakket zit. Shopify handelt later alleen de transactie af.

## Waarom Shopify voor commodity commerce

Shopify is later logisch voor:

- cart en checkout
- betalingen via bestaande PSP-integraties
- orders en orderstatus
- fulfilment- en retourprocessen
- commodity catalog operations
- headless storefrontmogelijkheden

Ik overleef hoeft daarmee geen eigen payment-, order- of fulfilmentplatform te bouwen.

## Waarom engine/Directus de IP-laag blijven

De kernwaarde zit in:

- scenario- en need-modellering
- capability-dekking
- quantity policies
- governance en warnings
- tasks/checklists
- uitlegbaar advies
- QA en release discipline

Deze logica blijft buiten Shopify. Shopify krijgt later alleen verkoopbare varianten en cartregels.

## Ownership matrix

| Domein | Source of truth nu | Source of truth later |
|---|---|---|
| Scenario's | Directus/Postgres | Directus/Postgres |
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

## Directus naar Shopify one-way sync

Toekomstig principe:

```txt
Directus/Postgres productmasterdata
  -> commerce adapter/sync
  -> Shopify product/variant mirror
```

Richting is in principe one-way voor catalogusidentiteit en verkoopbaarheid. Shopify-orderdata hoeft niet terug de recommendation engine in om advieslogica te bepalen.

## Toekomstige cart mapping

De huidige commerce payload gebruikt:

- `sku`
- `title`
- `quantity`
- `section`
- `role`
- `commerce_action`
- `cart_eligible`
- `shopify_variant_id`
- `reason`

Later kan de adapter per line beslissen:

- verkoopbaar als eigen voorraad
- verkoopbaar als supplier item
- task-only
- warning-only
- niet te koop

In deze fase is `cart_eligible=false` en `shopify_variant_id=null`.

## Checklist/download/mail/koop als pakket fasering

Fasering:

1. Printvriendelijke checklist.
2. Checklistdownload, bijvoorbeeld PDF, pas als dit veilig en nuttig is.
3. Mail naar mezelf pas na expliciete consent, e-mailflow en opslagbeleid.
4. Koop als pakket pas na definitieve catalogus, prijzen, voorraad en checkout-integratie.

Fase 16-18 doet alleen stap 1.

## Risico's en open beslissingen

- Welke items worden eigen voorraad versus supplier/affiliate/future supplier?
- Waar komt definitieve prijsdata vandaan?
- Hoe wordt Shopify variant ID gekoppeld aan interne SKU?
- Welke productfoto's zijn definitief en rechtenvrij?
- Hoe worden bundels, multi-pack rounding en returns in commerce getoond?
- Welke account- en reminderfunctionaliteit is echt nodig?

## Niet implementeren in deze fase

- Shopify client
- Shopify tokens of environment variables
- Storefront API
- Admin API
- cart creation
- checkout session
- payment
- orderdatabase
- account/auth
- e-mail
- voorraadreservering
- fulfilment/returns
- schemawijzigingen
- nieuwe enumwaarden
- productlogica- of quantitywijzigingen
