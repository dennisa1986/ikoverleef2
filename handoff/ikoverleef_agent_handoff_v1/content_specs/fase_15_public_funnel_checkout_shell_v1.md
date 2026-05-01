# Fase 15 — Public funnel & checkout shell v1

## 1. Waar we staan

Laatste baseline:

- Tag: `v1.0.2-end-user-framing`
- Commit: `0bc1584`
- Status: MVP-adviesflow functioneert, is demo-ready en beter geschikt voor eindgebruikersreview.
- Belangrijk: het systeem is nog geen webshop. Er is nog geen echte checkout, betaling, account, order, voorraad, leverancierskoppeling of definitieve product-/prijsdata.

De huidige `/mvp`-flow bewijst dat de recommendation engine bestaande data kan vertalen naar een begrijpelijker advies. Fase 15 zet daar een commerciële funnel-shell omheen: homepage → stappenflow → adviesoverzicht → optionele account/lidmaatschapspitch → checkout-preview.

## 2. Doel

Fase 15 bouwt een publieke klantreis bovenop de bestaande engine-output.

Doel:

- Een gebruiker landt op een homepage.
- De gebruiker wordt via een duidelijke meerstapsflow door pakketkeuze, add-ons en huishouden geleid.
- De bestaande recommendation engine genereert het advies.
- De gebruiker ziet een overzicht en kan terug om keuzes aan te passen.
- De gebruiker ziet waarom een gratis account/lidmaatschap later waardevol is.
- De gebruiker ziet een checkout-preview zonder echte bestelling of betaling.
- De flow voelt commercieel logisch, maar blijft technisch veilig en eerlijk.

## 3. Niet-doen-lijst

Niet doen in Fase 15:

- Geen echte checkout.
- Geen betaling.
- Geen PSP-integratie.
- Geen winkelmand met persistente cart.
- Geen orderdatabase.
- Geen klantaccount.
- Geen auth.
- Geen wachtwoorden.
- Geen klantprofielopslag.
- Geen e-mailverzending.
- Geen voorraadreservering.
- Geen verzendkostenberekening.
- Geen facturen.
- Geen supplier-integraties.
- Geen echte prijzen uit supplier offers.
- Geen echte productfoto’s.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen nieuwe contentbatch.
- Geen nieuwe producttypes.
- Geen nieuwe itemcatalogus.
- Geen scoring-, quantity- of coverage-wijziging.
- Geen productlogica in frontend hardcoden.
- Geen directe package → item koppeling.
- Geen directe add-on → item koppeling.

## 4. Strategische scope

Fase 15 is geen webshopimplementatie maar een commerce-ready funnel shell.

Wel bouwen:

- Homepage.
- Stap 1: pakketniveau kiezen.
- Stap 2: add-ons kiezen.
- Stap 3: huishouden en duur invullen.
- Stap 4: adviesoverzicht en akkoord/aanpassen.
- Stap 5: gratis account/lidmaatschapspitch zonder echte registratie.
- Stap 6: checkout-preview zonder echte bestelling of betaling.
- Progress indicator.
- Querystring- of runtime-state-flow.
- Demo-vanafprijzen met expliciete disclaimer.
- Regression voor funnel-routes en verboden scope.

## 5. Routevoorstel

Gebruik de huidige POC-server voor snelheid.

Nieuwe publieke routes:

- `/` — homepage.
- `/pakket/start` — stap 1: Basis/Basis+.
- `/pakket/addons` — stap 2: add-ons.
- `/pakket/huishouden` — stap 3: huishouden.
- `/pakket/advies` — stap 4: adviesoverzicht.
- `/pakket/account` — stap 5: gratis account/lidmaatschapspitch.
- `/pakket/checkout` — stap 6: checkout-preview.

Bestaande routes blijven werken:

- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## 6. Homepage

Homepage moet uitleggen:

- Wat Ik overleef doet.
- Dat het gaat om nuchtere voorbereiding, niet om paniek.
- Dat de gebruiker een uitlegbaar noodpakketadvies krijgt.
- Dat de flow nog een demo/preview is en geen definitieve bestelling.
- Dat prijzen indicatief zijn totdat assortiment en leveranciers definitief zijn.

Primaire CTA:

- `Start je pakketadvies`

CTA gaat naar:

- `/pakket/start`

Voorbeeldcopy:

> Stel in enkele stappen een noodpakketadvies samen dat past bij jouw huishouden en de situaties waarvoor je voorbereid wilt zijn.

## 7. Stap 1 — Basis of Basis+

Doel: keuze voor pakketniveau met duidelijke implicatie.

Basis:

- Functioneel en nuchter.
- Gericht op belangrijkste behoeften.
- Betaalbaarder.
- Minder comfort en minder backup.

Basis+:

- Robuuster.
- Meer comfort en meer backup waar zinvol.
- Betere of ruimere keuzes.
- Geschikt voor gebruikers die minder op minimale oplossingen willen leunen.

Prijsbeleid in Fase 15:

- Alleen demo-/indicatieve vanafprijzen.
- Geen echte verkoopprijs.
- Geen totaalprijs claimen als definitief.

Voorstel demo-prijzen:

- Basis: `indicatief vanaf €149`
- Basis+: `indicatief vanaf €249`

Verplichte disclaimer:

> Prijsindicatie voor demo. Definitieve prijs volgt na product- en leveranciersinvulling.

## 8. Stap 2 — Add-ons

Framing:

- Niet: “waar ben je bang voor?”
- Wel: “Waar wil je op voorbereid zijn?”

Groepen:

Basiszekerheid:

- Stroomuitval
- Drinkwater
- Voedsel & bereiding

Zorg & huishouden:

- Hygiëne, sanitatie & afval
- EHBO & persoonlijke zorg

Omgeving & verplaatsing:

- Warmte, droog blijven & beschutting-light
- Evacuatie & documenten

Persoonlijke checks:

- Persoonlijke checks en taken

Slugs blijven exact gelijk aan bestaande add-ons:

- `stroomuitval`
- `drinkwater`
- `voedsel_bereiding`
- `hygiene_sanitatie_afval`
- `ehbo_persoonlijke_zorg`
- `warmte_droog_shelter_light`
- `evacuatie`
- `taken_profielen`

## 9. Stap 3 — Huishouden

Velden:

- Volwassenen
- Kinderen
- Huisdieren
- Duur in uren, standaard 72

Validatie/fallback:

- adults minimaal 1
- children minimaal 0
- pets minimaal 0
- duration_hours minimaal 24, standaard 72
- tier alleen `basis` of `basis_plus`
- add-ons alleen uit allowlist

Geen opslag van persoonsgegevens.

## 10. Stap 4 — Adviesoverzicht

Doel: samenvatten en akkoord vragen.

Toon:

- Gekozen pakketniveau.
- Demo-prijsindicatie.
- Gekozen add-ons.
- Huishouden.
- Duur.
- Aantal kernitems.
- Aantal accessoires.
- Aantal taken.
- Aantal aandachtspunten.
- Beknopte adviessecties.
- Link/knop om keuzes aan te passen.
- Knop naar account/lidmaatschapsstap.

Belangrijk:

- De recommendation engine blijft de bron van waarheid.
- Frontend mag geen productregels, quantities of coverage berekenen.
- Geen echte order.
- Geen echte totaalprijs.

## 11. Stap 5 — Gratis account/lidmaatschap

Doel: commerciële waarde van account/lidmaatschap uitleggen zonder echte accountbouw.

Benefits:

- Houdbaarheidsdata bijhouden.
- Herinneringen voor water, voedsel, batterijen en filters.
- Pakket jaarlijks herzien.
- Checklist bewaren.
- Updates ontvangen bij gewijzigde adviezen.
- Huishouden later aanpassen.
- Takenlijst beheren.

Fase 15 scope:

- Alleen keuze/pitch.
- Geen echte registratie.
- Geen e-mail.
- Geen wachtwoord.
- Geen opslag.

Keuzes:

- `Ga verder als gast`
- `Gratis account later activeren`

Copy moet duidelijk maken:

> In deze demo wordt nog geen account aangemaakt en niets opgeslagen.

## 12. Stap 6 — Checkout-preview

Doel: eindpunt van de commerciële funnel simuleren zonder verkooptransactie.

Toon:

- Pakketniveau.
- Add-ons.
- Huishouden.
- Demo-prijsindicatie.
- Samenvatting items.
- Samenvatting taken/aandachtspunten.
- Accountkeuze: gast / later account.
- Demo-disclaimer.

Verboden:

- `Bestel nu`
- `Afrekenen`
- `Betalen`
- `In winkelmand`
- `Plaats bestelling`
- echte orderbevestiging
- echte betaling
- echte cart
- echte accountaanmaak

Toegestane CTA:

- `Checkout-preview bekijken`
- `Pakketvoorstel later aanvragen`
- `Terug naar advies`
- `Keuzes aanpassen`

## 13. Demo-prijscontract

Geen echte prijzen in database.

Gebruik UI-only demo pricing constants, bijvoorbeeld:

```js
const DEMO_PRICE_BANDS = {
  basis: { label: 'Basis', from: 149 },
  basis_plus: { label: 'Basis+', from: 249 },
};
```

Altijd tonen met:

- `indicatief`
- `demo`
- `definitieve prijs volgt later`

Geen prijsberekening per item.

## 14. Datacontract

De funnel gebruikt bestaande runtime input:

- package_slug
- tier_slug
- addon_slugs
- household_adults
- household_children
- household_pets
- duration_hours

De funnel gebruikt bestaande output:

- sections.core_items
- sections.accessories
- sections.supporting_items
- sections.backup_items
- sections.optional_additions
- tasks
- warnings
- qa_summary
- input summary

Geen wijziging aan engine-output vereist.

## 15. Verwachte gebruikersflow

Voorbeeld:

1. User opent `/`.
2. User klikt `Start je pakketadvies`.
3. User kiest `Basis+`.
4. User kiest `Stroomuitval`, `Drinkwater`, `Evacuatie`.
5. User vult 2 volwassenen, 0 kinderen, 0 huisdieren, 72 uur in.
6. User ziet adviesoverzicht.
7. User kiest account later of gast.
8. User ziet checkout-preview met duidelijke demo-status.

## 16. Regressie-eisen

Nieuwe regression:

- `backend/regression_public_funnel_checkout_shell_poc.js`

Nieuw script:

- `test:public-funnel-poc`

Regression moet minimaal valideren:

1. `/` geeft 200 en bevat homepage/CTA.
2. `/pakket/start` geeft 200 en toont Basis/Basis+.
3. `/pakket/addons` geeft 200 en toont add-on-groepen.
4. `/pakket/huishouden` geeft 200 en toont huishoudenvelden.
5. `/pakket/advies` geeft 200 en gebruikt recommendation-output.
6. `/pakket/account` geeft 200 en toont benefits zonder echte registratie.
7. `/pakket/checkout` geeft 200 en toont checkout-preview.
8. Er is geen echte checkout/payment/account/cart CTA.
9. Demo-prijzen zijn duidelijk indicatief.
10. Bestaande `/mvp` blijft werken.
11. Bestaande `/mvp/recommendation` blijft werken.
12. Interne routes blijven werken.
13. `npm run test:end-user-framing-poc` blijft groen.
14. `npm run test:mvp-rc-poc` blijft groen.
15. QA blocking blijft 0.

## 17. Release

Beoogde tag:

- `v1.0.3-public-funnel-shell`

Release note:

- `release_note_v1.0.3_public_funnel_shell.md`

## 18. Fase-afrondingscriteria

Fase 15 is afgerond als:

- Alle funnelroutes werken.
- De gebruiker van homepage tot checkout-preview kan doorklikken.
- De bestaande engine-output wordt gebruikt.
- Geen echte checkout/payment/account/order is gebouwd.
- Demo-prijzen zijn duidelijk als indicatief gemarkeerd.
- Alle regressions groen zijn.
- QA blocking = 0.
- Release note, commit, tag en push zijn uitgevoerd.
