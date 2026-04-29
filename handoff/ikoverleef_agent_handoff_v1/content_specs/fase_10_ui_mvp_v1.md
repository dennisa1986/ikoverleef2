# Fase 10 — UI MVP v1

## 0. Waar we staan

Ik overleef heeft inmiddels de kern van de recommendation engine, contentbaselines, runtime outputstructuur en backoffice-hardening staan.

Afgeronde baselines:

- `v0.1.0-stroomuitval-baseline`
- `v0.2.0-drinkwater-baseline`
- `v0.3.0-voedsel-bereiding-baseline`
- `v0.4.0-hygiene-sanitatie-baseline`
- `v0.5.0-ehbo-baseline`
- `v0.6.0-warmte-droog-shelter-light-baseline`
- `v0.7.0-evacuatie-baseline`
- `v0.8.0-taken-profielen-baseline`
- `v0.9.0-engine-hardening-baseline`
- `v0.10.0-backoffice-hardening-baseline`

Fase 10 bouwt geen nieuwe inhoudelijke productbatch. Deze fase maakt de eerste MVP-waardige UI-flow bovenop de bestaande engine en backofficefundering.

## 1. Doel

Doel van Fase 10:

Een werkende configurator- en adviesflow maken waarmee een gebruiker intern/POC-klantgericht kan:

1. pakket kiezen;
2. tier kiezen;
3. add-ons kiezen;
4. huishouden en duur invullen;
5. advies genereren;
6. pakketadvies bekijken;
7. uitleg, taken, waarschuwingen en secties begrijpen.

De UI moet aantonen dat Ik overleef niet alleen technisch advies kan genereren, maar dit ook begrijpelijk kan presenteren.

## 2. Strategische positionering

De UI MVP is geen webshop. De UI MVP is een advieservaring.

De gebruiker moet begrijpen:

- waarom iets in het pakket zit;
- wat essentieel is;
- wat accessoire is;
- wat ondersteunend of backup is;
- welke taken geen product zijn;
- welke waarschuwingen gelden;
- welke aannames gebruikt zijn.

## 3. Niet doen in deze fase

Niet doen:

- geen checkout;
- geen betaalflow;
- geen winkelmand;
- geen klantaccount;
- geen login/auth;
- geen voorraadreservering;
- geen externe leverancierintegraties;
- geen echte bestelknoppen;
- geen klantprofielopslag;
- geen e-mailflows;
- geen PDF-export als verplicht onderdeel;
- geen personalisatie buiten bestaande inputvelden;
- geen schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK wijziging;
- geen package → item koppeling;
- geen add-on → item koppeling;
- geen inhoudelijke nieuwe contentbatch.

## 4. Leidende architectuur

De UI mag alleen bestaande engine-output tonen.

De bestaande flow blijft:

```text
package / tier / add-ons / profiel
→ scenario’s
→ behoeften
→ capabilities
→ productregels
→ quantity policies
→ productvarianten
→ item candidates
→ accessoires
→ generated package lines
→ sections + sources + coverage + tasks + warnings + QA
```

De UI is een presentatie- en interactielaag bovenop deze flow. De UI mag geen inhoudelijke pakketwaarheid hardcoden.

## 5. MVP UI-flow

De MVP UI-flow bestaat uit minimaal deze stappen:

### Stap 1 — Start / pakketkeuze

De gebruiker kiest het pakket.

Voor MVP minimaal:

- Basispakket.

Andere pakketten hoeven nog niet te bestaan.

### Stap 2 — Tierkeuze

De gebruiker kiest:

- Basis;
- Basis+.

Uitleg:

- Basis = eenvoudige maar kloppende dekking;
- Basis+ = betere scenariofit, robuustere keuzes en minder zwakke schakels.

Basis+ mag niet worden uitgelegd als “gewoon meer spullen”.

### Stap 3 — Add-ons kiezen

Minimaal beschikbaar:

- Stroomuitval;
- Drinkwater;
- Voedsel & voedselbereiding;
- Hygiëne, sanitatie & afval;
- EHBO & persoonlijke zorg;
- Warmte, droog blijven & shelter-light;
- Evacuatie & documenten;
- Taken & profielen.

Voor MVP moet de UI multi-select ondersteunen.

Voor de eerste commerciële MVP-propositie mag er ook een aanbevolen preset worden getoond:

- Stroomuitval;
- Drinkwater;
- Evacuatie.

Maar technisch moet de UI meerdere bestaande add-ons kunnen combineren.

### Stap 4 — Huishouden en duur

Inputvelden:

- volwassenen;
- kinderen;
- huisdieren;
- duur in uren.

MVP-default:

- volwassenen: 2;
- kinderen: 0;
- huisdieren: 0;
- duur: 72 uur.

Validatie:

- volwassenen minimaal 1;
- kinderen minimaal 0;
- huisdieren minimaal 0;
- duur minimaal 24;
- aanbevolen duur: 72.

Geen klantprofiel opslaan. Input blijft request/runtime.

### Stap 5 — Advies genereren

Na submit genereert de UI via de bestaande engine een advies.

De UI mag hiervoor dezelfde server/runtime gebruiken als de interne POC, zolang de presentatie een klantgerichte flow krijgt.

### Stap 6 — Adviesoverzicht

Toon minimaal:

- gekozen pakket;
- tier;
- add-ons;
- huishouden;
- duur;
- aantal core items;
- aantal accessoires;
- aantal supporting items;
- aantal backup items;
- aantal tasks;
- aantal warnings;
- QA-status.

### Stap 7 — Pakketregels per sectie

Gebruik de runtime sections uit Fase 8:

- Core items;
- Accessoires;
- Supporting items;
- Backup items;
- Optional additions;
- Tasks;
- Warnings.

Voor elk item minimaal tonen:

- titel;
- hoeveelheid;
- korte uitleg;
- sectielabel;
- SKU alleen als intern/debug zichtbaar is.

Voor MVP mag SKU zichtbaar zijn in detail/debug, maar de primaire klantkaart moet leesbaar zijn.

### Stap 8 — Waarom zit dit erin?

Per item moet een gebruiker kunnen openen:

- public explanation;
- sources in begrijpelijke vorm;
- coverage in begrijpelijke vorm;
- relevante warnings.

Interne technische termen mogen in een debugpaneel zichtbaar blijven, maar de hoofduitleg moet menselijk zijn.

### Stap 9 — Taken

Tasks moeten zichtbaar zijn naast producten.

Voorbeelden:

- persoonlijke medicatie controleren;
- documenten en contacten controleren;
- kinderen/huisdieren indien van toepassing;
- pakket periodiek herzien.

Tasks mogen niet als productregel worden getoond.

### Stap 10 — Warnings

Warnings moeten prominent maar niet paniekerig worden weergegeven.

Voorbeelden:

- filter maakt niet automatisch elk water veilig;
- gas/open vuur niet binnen gebruiken;
- EHBO vervangt geen arts;
- documenten/medicatie/cash blijven persoonlijke checks;
- hygiëneproducten bieden geen volledige medische bescherming.

### Stap 11 — QA/debug

Voor MVP-POC mag een intern debugpaneel zichtbaar zijn.

Toon:

- QA summary;
- generated lines without sources;
- producttype mismatch;
- blocking total;
- run id;
- active add-ons;
- debug sources/coverage.

In een latere klantversie kan dit worden verborgen.

## 6. Routes

Voorgestelde routes:

```text
/
```

Redirect of link naar de MVP configurator.

```text
/mvp
```

Startpagina/configurator.

```text
/mvp/recommendation
```

Adviesresultaat op basis van queryparameters.

Optioneel als bestaande server eenvoudiger is:

```text
/internal/mvp
/internal/mvp/recommendation
```

Bestaande routes moeten blijven werken:

```text
/internal/recommendation-poc
/internal/backoffice-poc
```

## 7. Queryparameters

Gebruik bestaande inputconventies waar mogelijk.

Minimaal:

```text
package=basispakket
tier=basis|basis_plus
addons=drinkwater,evacuatie,taken_profielen
adults=2
children=0
pets=0
duration_hours=72
```

Backwards compatibility:

- bestaande `addon=` single/comma-separated mag blijven werken;
- nieuwe UI mag intern naar `addon_slugs` mappen.

## 8. Add-on presets

UI mag presets tonen:

### Aanbevolen MVP-start

```text
stroomuitval,drinkwater,evacuatie
```

### Compleet 72u POC

```text
stroomuitval,drinkwater,voedsel_bereiding,hygiene_sanitatie_afval,ehbo_persoonlijke_zorg,warmte_droog_shelter_light,evacuatie,taken_profielen
```

### Per domein

- Stroomuitval;
- Drinkwater;
- Voedsel;
- Hygiëne;
- EHBO;
- Warmte/droog;
- Evacuatie;
- Taken/profielen.

Presets zijn UI-convenience, geen databaseconcept.

## 9. UX-principes

De UI moet:

- nuchter zijn;
- praktisch zijn;
- niet doemdenkend zijn;
- uitlegbaar zijn;
- geen medische of veiligheidsclaims overdrijven;
- duidelijk maken wat product is en wat taak is;
- duidelijk maken wat aannames zijn.

## 10. Outputsecties

### Core items

Essentiële items voor primaire dekking.

### Accessoires

Items die nodig zijn om een gekozen item of oplossing bruikbaar te maken.

Voorbeelden:

- brandstof bij stove;
- batterijen bij hoofdlamp;
- paracord/haringen bij tarp;
- tape/handschoenen bij wondzorg.

### Supporting items

Ondersteunende items die nuttig zijn, maar geen primaire dekking claimen.

Voorbeelden:

- kookoplossing bij voedsel;
- thermometer bij EHBO;
- filterfles bij evacuatie/drinkwater als backup/supporting.

### Backup items

Items die extra zekerheid geven maar geen primaire dekking vervangen.

### Optional additions

Runtime-sectie bestaat al, mag leeg zijn.

### Tasks

Persoonlijke of administratieve acties, geen producten.

### Warnings

Veiligheid, governance, beperkingen en QA-context.

## 11. Public copy-richtlijnen

Gebruik duidelijke, zakelijke maar begrijpelijke taal.

Voorbeelden:

- “Dit item is toegevoegd omdat…”
- “Let op: dit vervangt niet…”
- “Controleer zelf…”
- “Gebruik volgens productinstructie.”
- “Deze taak is geen product, maar wel belangrijk voor je voorbereiding.”

Vermijd:

- “garandeert veiligheid”;
- “beschermt tegen alles”;
- “medisch noodzakelijk”;
- “survival proof”;
- “alles-in-één oplossing”;
- paniektaal.

## 12. Validatiecriteria

De UI MVP is geldig als:

- configurator werkt;
- Basis/Basis+ keuze werkt;
- multi-add-on selectie werkt;
- huishouden en duur werken;
- advies wordt gegenereerd via bestaande engine;
- sections worden getoond;
- tasks worden getoond;
- warnings worden getoond;
- QA summary wordt getoond;
- bestaande interne POC-routes blijven werken;
- backoffice route blijft werken;
- alle regressions groen blijven;
- geen schemawijziging nodig is;
- geen nieuwe enumwaarden nodig zijn.

## 13. Verwachte implementatie-impact

Waarschijnlijk aanpassen:

- `apps/internal-poc/server.js`;
- mogelijk frontend rendering helpers in hetzelfde bestand;
- `backend/regression_ui_mvp_poc.js`;
- `backend/package.json`;
- release note.

Waarschijnlijk niet aanpassen:

- database schema;
- seeddata;
- `backend/calculate.js`, tenzij strikt nodig voor hergebruik van bestaande outputhelpers;
- Directus config;
- supplier_offer;
- contentbatches.

## 14. Regression

Nieuwe regression:

```text
npm run test:ui-mvp-poc
```

Moet minimaal valideren:

1. MVP configuratorroute geeft 200.
2. MVP recommendationroute geeft 200.
3. Basis-run werkt.
4. Basis+-run werkt.
5. Multi-add-on run werkt.
6. Household/duration parameters worden verwerkt.
7. Core items sectie zichtbaar.
8. Accessories sectie zichtbaar.
9. Supporting sectie zichtbaar.
10. Backup sectie zichtbaar.
11. Optional additions sectie zichtbaar, ook als leeg.
12. Tasks sectie zichtbaar.
13. Warnings sectie zichtbaar.
14. QA summary zichtbaar.
15. “Geen checkout/betaling/account” wordt niet gebouwd of gelinkt.
16. Interne recommendation POC blijft werken.
17. Backoffice POC blijft werken.
18. Alle bestaande regressions blijven groen.

## 15. Release note

Beoogde release note:

```text
release_note_v0.11.0_ui_mvp_baseline.md
```

Beoogde tag:

```text
v0.11.0-ui-mvp-baseline
```

## 16. Fase-afrondingscriteria

Fase 10 is afgerond als:

- specificatie en mapping zijn opgenomen;
- mapping-check groen is;
- MVP UI-routes werken;
- configurator werkt;
- adviesresultaat werkt;
- sections/tasks/warnings/QA zichtbaar zijn;
- bestaande POC-routes blijven werken;
- alle regressions groen zijn;
- release note aanwezig is;
- commit en tag zijn gepusht;
- geen checkout/account/betaalflow is toegevoegd;
- geen schemawijziging of nieuwe enum is toegevoegd.

## 17. Agent-opdracht voor volgende stap

Na goedkeuring van deze specificatie en mapping mag de agent Fase 10 end-to-end implementeren conform de bijbehorende implementation mapping.

Stop bij elke harde datamodel- of scopeblokkade.
