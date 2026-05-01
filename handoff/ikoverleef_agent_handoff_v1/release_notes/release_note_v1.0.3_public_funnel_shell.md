# Release note — v1.0.3-public-funnel-shell

## Fase

Fase 15 — Public funnel & checkout shell

## Baseline

- Vertrekbasis: `v1.0.2-end-user-framing`
- Vertrekcommit: `0bc1584`
- Nieuwe tag: `v1.0.3-public-funnel-shell`

## Doel

Deze fase bouwt een publieke commerciële funnel-shell bovenop de bestaande recommendation engine. De gebruiker kan van homepage naar pakketkeuze, add-ons, huishouden, adviesoverzicht, lidmaatschapspitch en checkout-preview navigeren.

## Scope

Deze release is een commerce-ready preview. Er is geen echte webshopfunctionaliteit toegevoegd.

Bewust buiten scope:

- echte checkout
- betaling of PSP-integratie
- winkelmand/cart-persistentie
- orderdatabase
- account/auth/wachtwoorden
- klantprofielopslag
- e-mailverzending
- voorraadreservering
- leveranciersintegratie
- echte prijzen uit supplier offers
- nieuwe contentbatch, producttypes of itemcatalogus
- schemawijzigingen of nieuwe enumwaarden
- scoring-, quantity- of coverage-wijzigingen

## Wat is toegevoegd

- Publieke homepage op `/`.
- Stappenflow voor pakketadvies.
- UI-only demo-vanafprijzen met duidelijke disclaimer.
- Account/lidmaatschapspitch zonder registratie of opslag.
- Checkout-preview zonder order of betaling.
- Regression voor funnelroutes en verboden commerciële scope.

## Routes

- `/` — homepage
- `/pakket/start` — Basis/Basis+ kiezen
- `/pakket/addons` — situaties/add-ons kiezen
- `/pakket/huishouden` — huishouden en duur invullen
- `/pakket/advies` — adviesoverzicht op basis van engine-output
- `/pakket/account` — gratis account/lidmaatschapspitch
- `/pakket/checkout` — checkout-preview

Bestaande routes blijven werken:

- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## Tier/pricing-disclaimer

Demo-vanafprijzen zijn UI-only:

- Basis: indicatief vanaf EUR 149
- Basis+: indicatief vanaf EUR 249

Elke prijsweergave blijft indicatief en meldt dat definitieve prijs volgt na product- en leveranciersinvulling.

## Add-onstap

Add-ons worden UI-only gegroepeerd:

- Basiszekerheid
- Zorg & huishouden
- Omgeving & verplaatsing
- Persoonlijke checks

Slugs blijven gelijk aan bestaande add-ons.

## Huishoudenstap

Runtime input:

- volwassenen
- kinderen
- huisdieren
- duur in uren

Er wordt niets opgeslagen.

## Adviesoverzicht

Het adviesoverzicht gebruikt bestaande recommendation-output:

- kernitems
- accessoires
- backup/ondersteuning
- taken
- aandachtspunten
- QA-clean status via bestaande output

De frontend berekent geen productregels, quantities of coverage.

## Account/lidmaatschapspitch

De pitch legt latere waarde uit:

- houdbaarheidsdata bijhouden
- herinneringen
- jaarlijks herzien
- checklist bewaren
- updates ontvangen
- huishouden later aanpassen
- takenlijst beheren

Er wordt geen account aangemaakt en niets opgeslagen.

## Checkout-preview

De checkout-preview toont:

- pakketniveau
- add-ons
- huishouden
- demo-prijsindicatie
- itemsamenvatting
- taken/aandachtspunten
- accountkeuze

Er is geen order, betaling, cart, accountaanmaak of voorraadreservering.

## Validatie

Validatie vereist:

- alle bestaande regressions groen
- `npm run test:mvp-rc-poc` groen
- `npm run test:end-user-framing-poc` groen
- `npm run test:public-funnel-poc` groen
- QA blocking = 0
- generated lines without sources = 0
- producttype mismatch = 0
- forbidden UI links/CTA’s = 0

## Open punten

- Demo-prijzen zijn placeholders en geen verkoopprijzen.
- Productfoto’s, definitieve prijzen, voorraad en leveranciers volgen in latere commerciële fases.
- Account/lidmaatschap is alleen pitch-copy, geen registratie.

## Conclusie

Fase 15 maakt de bestaande MVP-adviesflow toegankelijk als publieke funnel-shell, zonder webshop- of orderfunctionaliteit toe te voegen.
