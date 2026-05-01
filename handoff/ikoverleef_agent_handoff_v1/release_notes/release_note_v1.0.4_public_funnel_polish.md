# Release note — v1.0.4-public-funnel-polish

## Fase

Fase 15.1 — Public funnel polish & trust cleanup

## Baseline

- Vertrekbasis: `v1.0.3-public-funnel-shell`
- Vertrekcommit: `2be2c1a`
- Nieuwe tag: `v1.0.4-public-funnel-polish`

## Doel

Deze correctieronde maakt de publieke funnel en MVP-adviespagina begrijpelijker en betrouwbaarder voor eindgebruikers, zonder nieuwe commerce-, account-, data- of enginefunctionaliteit te bouwen.

## Scope

Alle wijzigingen zijn UI-/presentatielaag en regression-only.

Niet gewijzigd:

- database schema
- enumwaarden
- `supplier_offer`
- contentbatch/producttypes/itemcatalogus
- recommendation-semantiek
- scoring, quantity policies of coverage
- checkout, betaling, order, account of klantprofielopslag

## Wat is verbeterd

- Ruwe database-slugs zijn vervangen door gebruikerslabels op publieke routes.
- Taskprioriteiten zijn vertaald naar begrijpelijke labels.
- Aandachtspuntentellers tonen dezelfde publieke logica.
- Technische warning-jargon is herschreven naar mensentaal.
- Ruwe constraint types zijn vertaald of verborgen.
- Waarschuwingsgroepering is aangescherpt voor evacuatie/documentcontext.
- Interne onderbouwing is alleen zichtbaar met `debug=true` of `internal=true`.
- Een echte printknop is toegevoegd voor checklist/advies.
- Publieke statuscopy is versimpeld naar `Advies opgehaald`.

## Sluglabeling

UI-only mapping:

- `basispakket` → Basispakket
- `basis` → Basis
- `basis_plus` → Basis+
- add-on slugs → eindgebruikerslabels

Database-slugs blijven ongewijzigd.

## Tasklabeling

UI-only mapping:

- `must` → Belangrijk
- `should` → Aanbevolen
- `could` → Optioneel

Task-slugs blijven alleen beschikbaar via interne/debugroutes.

## Warninglabeling

Bekende constraint types worden op publieke routes vertaald naar labels zoals:

- Hygiëne
- Opslag
- Kindveiligheid
- Medische beperking
- Brandveiligheid
- Ventilatie
- Binnengebruik
- Brandstofcompatibiliteit
- Houdbaarheid

Technische coverage-termen worden niet publiek getoond.

## Warninggroepering

Evacuatietas, documentenmap, drinkfles in evacuatiecontext en vergelijkbare CarrySafe/DryCarry-contexten vallen onder:

- Evacuatie & documenten

## Tellerconsistentie

Aandachtspunten tonen publiek als:

- uniek
- of uniek uit totaal

Deze logica is gelijkgetrokken op:

- `/mvp/recommendation`
- `/pakket/advies`
- `/pakket/checkout`

## Debuglink

De publieke link naar interne onderbouwing is verborgen op normale publieke routes.

Alleen zichtbaar bij:

- `debug=true`
- `internal=true`

## Printknop

Toegevoegd:

```html
<button type="button" onclick="window.print()">Print checklist</button>
```

De knop slaat geen data op en genereert geen download.

## Validatie

Validatie vereist:

- alle bestaande regressions groen
- `npm run test:mvp-rc-poc` groen
- `npm run test:end-user-framing-poc` groen
- `npm run test:public-funnel-poc` groen
- `npm run test:public-funnel-polish-poc` groen
- QA blocking = 0
- generated lines without sources = 0
- producttype mismatch = 0
- forbidden UI links/CTA’s = 0

## Bewust buiten scope

- echte checkout
- betaling
- winkelmand/cart
- account/auth
- orderdatabase
- klantprofielopslag
- e-mail
- voorraadreservering
- productprijzen als echte verkoopprijs
- productlogica- of enginewijzigingen

## Open punten

- Definitieve commerciële prijzen en assortiment volgen later.
- Publieke styling kan in een aparte visuele fase verder worden verfijnd.

## Conclusie

De public funnel is polish-ready voor een echte gebruikerstest, met minder interne ruis en duidelijkere vertrouwenssignalen.
