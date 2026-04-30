# Fase 14 — Eindgebruikersframing & adviespresentatie v1

## Waar staan we?

`v1.0.1-demo-readiness` bewijst dat de engine, database, interne MVP UI, backoffice POC en regressionsuite functioneel werken. De recente review laat zien dat de huidige `/mvp`-ervaring technisch klopt, maar nog te veel aanvoelt als interne validatie-tool.

De belangrijkste observatie: de gebruiker begrijpt globaal “noodpakketadvies”, maar mist verwachting vooraf en een duidelijke volgende stap achteraf. Ook staan interne begrippen zoals QA, run-id, SKU, capability, coverage en backoffice-links nog te prominent in de eindgebruikerservaring.

## Doel

Maak `/mvp` en `/mvp/recommendation` begrijpelijker voor een eindgebruiker, zonder webshop, checkout, account, prijzen, voorraad of leveranciersintegratie te bouwen.

De gebruiker moet na Fase 14 begrijpen:

- wat Ik overleef doet;
- wat hij/zij invult;
- wat het advies oplevert;
- dat dit nog geen bestelling is;
- welke producten kern zijn;
- welke taken hij/zij zelf moet doen;
- welke aandachtspunten belangrijk zijn;
- wat de volgende stap is.

## Niet doen

- Geen checkout.
- Geen betaling.
- Geen winkelmand.
- Geen auth.
- Geen klantaccount.
- Geen klantprofielopslag.
- Geen voorraadreservering.
- Geen externe leverancierintegraties.
- Geen echte prijzen.
- Geen echte productfoto’s.
- Geen nieuwe contentbatch.
- Geen nieuwe producttypes.
- Geen nieuwe itemcatalogus.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen recommendation-, scoring-, quantity- of coverage-wijziging.

## Kernkeuze

De huidige `/mvp` moet niet meer als interne tool voelen. Interne details blijven bestaan, maar horen op:

- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

De `/mvp`-flow wordt een eindgebruikersgerichte adviespreview.

## Gewenste configurator

Gebruik duidelijke framing:

- Titel: `Stel je noodpakketadvies samen`
- Intro: `Kies je huishouden, pakketniveau en situaties. Je krijgt daarna een uitlegbaar advies met producten, taken en aandachtspunten.`
- Verwachting: `Dit is een adviespreview, nog geen webshop of bestelling.`

Leg Basis en Basis+ uit:

- Basis: `Functioneel en nuchter instapniveau.`
- Basis+: `Robuustere keuzes en meer comfort/backup waar zinvol.`

Hernoem interne presets:

- `Aanbevolen MVP-start` → `Aanbevolen startadvies`
- `Complete 72u POC` → `Volledige 72-uurs demo`

## Add-on-groepering

De add-on slugs blijven hetzelfde, maar de UI groepeert ze menselijker:

### Basiszekerheid
- Stroomuitval
- Drinkwater
- Voedsel & bereiding

### Zorg & huishouden
- Hygiëne, sanitatie & afval
- EHBO & persoonlijke zorg

### Omgeving & verplaatsing
- Warmte, droog blijven & beschutting-light
- Evacuatie & documenten

### Persoonlijke checks
- Persoonlijke checks en taken

## Adviespagina

Bovenaan moet duidelijk staan:

> Dit advies laat zien welke producten en acties logisch zijn voor jouw gekozen situatie. Je kunt dit gebruiken als checklist of als basis voor een later pakketvoorstel. Dit is nog geen bestelling.

Vereenvoudig de hoofdsecties:

1. `Kern van je pakket`
2. `Benodigde accessoires`
3. `Backup en ondersteuning`
4. `Persoonlijke taken`
5. `Aandachtspunten`
6. `Wat kun je nu doen?`

Mapping:

- `core_items` → Kern van je pakket
- `accessories` → Benodigde accessoires
- `supporting_items + backup_items + optional_additions` → Backup en ondersteuning
- `tasks` → Persoonlijke taken
- `warnings` → Aandachtspunten

## Interne details verbergen op MVP-pagina

Niet prominent tonen op `/mvp/recommendation`:

- SKU-codes;
- run-id;
- Interne QA-status;
- backoffice-link;
- scenario_need;
- accessory_requirement;
- capability slug;
- coverage_strength;
- counted_as_sufficient;
- producttype slugs;
- need slugs.

Deze informatie blijft op interne routes.

## Aandachtspunten groeperen

Warnings/aandachtspunten mogen niet als één lange lijst verschijnen. Groepeer minimaal:

- Water & voedselveiligheid
- Vuur, gas & gebruiksveiligheid
- Medisch & EHBO
- Evacuatie & documenten
- Opslag & houdbaarheid
- Persoonlijke checks

Toon standaard alleen belangrijkste/gededupliceerde aandachtspunten, met optie om alles te tonen.

## Volgende stap / CTA

Voeg onderaan een sectie toe:

`Wat kun je nu doen?`

Toegestane acties:

- `Print of bewaar deze checklist`
- `Gebruik dit als boodschappenlijst`
- `Bespreek dit advies met je huishouden`
- `Vraag later een pakketvoorstel aan` als demo-copy, zonder echte verwerking
- `Bekijk interne onderbouwing` alleen intern gemarkeerd

Verboden:

- Bestel nu
- Afrekenen
- In winkelmand
- Betaling
- Account/login/register
- echte leadopslag
- echte e-mailverzending

## Demo-disclaimer

Toon subtiel:

> Demo-advies: productnamen en leveranciersinformatie kunnen placeholderdata zijn. De samenstelling toont de advieslogica, niet definitieve verkoopvoorraad.

## Prijs en gewicht

Niet implementeren als echte data. Wel toegestaan:

> Prijs en gewicht volgen in de commerciële pakketfase.

## Regression

Maak `backend/regression_end_user_framing_poc.js`.

Valideer minimaal:

1. `/mvp` geeft HTTP 200.
2. `/mvp/recommendation` geeft HTTP 200.
3. Verwachting vooraf is zichtbaar.
4. Volgende stap is zichtbaar.
5. Hoofdweergave bevat geen dominante interne termen.
6. Geen checkout/payment/account/cart CTA’s.
7. Productitems blijven zichtbaar.
8. Taken blijven zichtbaar.
9. Aandachtspunten blijven zichtbaar en gegroepeerd/gededupliceerd.
10. Interne routes blijven werken.
11. `npm run test:demo-readiness-poc` blijft groen.
12. `npm run test:mvp-rc-poc` blijft groen.

## Validatie

Draai alle bestaande regressions plus:

```bash
npm run test:end-user-framing-poc
```

## Afrondingscriteria

Fase 14 is klaar als:

- `/mvp` duidelijk uitlegt wat de gebruiker krijgt;
- `/mvp/recommendation` niet meer als interne validatietool voelt;
- interne details naar interne routes zijn verplaatst;
- er een duidelijke volgende stap is;
- aandachtspunten beter gegroepeerd zijn;
- geen checkout/account/payment scope-creep is;
- alle regressions groen zijn.

Voorgestelde tag:

`v1.0.2-end-user-framing`
