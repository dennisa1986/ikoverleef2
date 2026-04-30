# Acceptance note — v1.0.0-mvp-rc1

## Baseline
- Tag: `v1.0.0-mvp-rc1`
- Commit: `abe7b48`
- Datum: 2026-04-30

## Handmatige test
De MVP RC1 is handmatig functioneel gecontroleerd door de gebruiker.

Vastgesteld:

- `npm run test:mvp-rc-poc` is groen.
- De MVP UI werkt na correcte `IOE_PG_URL` start.
- Drinkwater-profielruns werken.
- De complete functionele flow lijkt correct.
- QA blocking = 0.
- Er is geen checkout, account, betaling of winkelmand.

## Bevinding
MVP RC1 bewijst dat backoffice, database, recommendation engine, UI MVP en regression suite samen een uitlegbaar pakketadvies kunnen genereren.

## Niet-webshopstatus
Deze baseline is geen webshop en geen publieke frontend. Checkout, betaling, klantaccount, voorraadreservering en externe leverancierintegraties blijven bewust buiten scope.

## Besluit
MVP RC1 is functioneel geaccepteerd als basis voor demo-readiness en een besloten feedbackronde.
