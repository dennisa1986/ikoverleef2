# contentbatch_4_hygiene_sanitatie_afval_v1.md

**Project:** Ik overleef  
**Fase:** Fase 3 — Contentbatch 4 Hygiëne, sanitatie & afval  
**Documenttype:** Inhoudelijke specificatie  
**Status:** Specificatie v1 — klaar voor inhoudelijke review, nog niet implementatieklaar  
**Datum:** 2026-04-28  
**Vorige formele baseline:** `v0.3.0-voedsel-bereiding-baseline`  
**Beoogde volgende baseline:** `v0.4.0-hygiene-sanitatie-baseline`  
**Nog vereist vóór implementatie:** `contentbatch_4_hygiene_sanitatie_afval_implementation_mapping.md`

---

## 0. Harde scope- en governance-opmerking

Dit document is de **inhoudelijke specificatie** voor Contentbatch 4. Het is nog geen implementatieopdracht.

De vaste werkwijze voor nieuwe contentbatches is:

1. Eerst inhoudelijke specificatie.
2. Daarna expliciete implementatie-mapping naar het bestaande schema.
3. Pas daarna seed/engine/webapp/regression implementeren.
4. Geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen zonder expliciete toestemming.
5. Altijd database-first blijven.
6. Packages en add-ons nooit direct aan items koppelen.
7. Packages en add-ons activeren scenario’s.
8. Scenario’s leiden via needs, capabilities, productregels, quantity policies, productvarianten, item candidates, accessoire requirements, generated package lines, sources, coverage en QA tot output.
9. Bestaande slugs, enumwaarden, QA-views en engineconcepten blijven leidend.

Termen in dit document zoals `supporting`, `required_accessory`, `consumable`, `poc_assumption`, `sanitation_warning`, `single_use`, `medical_claim_blocker` of vergelijkbare labels zijn **inhoudelijke intenties**. Ze mogen later niet automatisch als nieuwe database-enums worden toegevoegd. Het latere mappingdocument bepaalt hoe deze intenties op bestaande schemawaarden, notes, explanations, governancevelden of usage constraints worden gemapt.

---

## 1. Waar we staan in het plan

### Afgerond

**Fase 0 — Stroomuitval baseline**

- Git tag: `v0.1.0-stroomuitval-baseline`
- Basis en Basis+ werken.
- Regression test: `npm run test:stroomuitval-poc`
- QA blocking = 0.
- Interne webapp toont stroomuitval-output.

**Fase 1 — Drinkwaterzekerheid baseline**

- Git tag: `v0.2.0-drinkwater-baseline`
- Regression test: `npm run test:drinkwater-poc`
- Stroomuitval regression blijft groen.
- QA blocking = 0.
- Filter vervangt opslag niet.
- Tabletten vervangen voorraad niet.
- Waterpack quantity gebruikt per_person_per_day + pack-size rounding.

**Fase 2 — Voedsel & voedselbereiding baseline**

- Git tag: `v0.3.0-voedsel-bereiding-baseline`
- Release-note commit: `c5ab486`
- Add-on slug: `voedsel_bereiding`
- Regression test: `npm run test:voedsel-poc`
- Stroomuitval en drinkwater regressions blijven groen.
- QA blocking = 0.
- Voedselzekerheid blijft core.
- Voedsel is zonder koken bruikbaar.
- Koken/verwarmen is supporting.
- Stove/fuel/ignition/pot geven nooit primary food coverage.

### Nu

**Fase 3 — Contentbatch 4 Hygiëne, sanitatie & afval**

Deze fase voegt een consumable-heavy domein toe. De kern is niet “een paar schoonmaakspullen toevoegen”, maar aantoonbaar borgen dat een huishouden gedurende 72 uur basis hygiëne, noodsanitatie, afvalcontainment en handbescherming kan organiseren zonder medische of infectiepreventieclaims te overdrijven.

Belangrijk uitgangspunt:

> Hygiëneproducten ondersteunen schoon en veilig handelen, maar garanderen geen medische bescherming, sterilisatie of volledige infectiepreventie.

En:

> Sanitatie is pas kloppend als toiletgebruik, absorptie/containment, afvalafvoer en handbescherming in samenhang worden beoordeeld.

---

## 2. Doel van Fase 3

Fase 3 moet bewijzen dat het model consumables, quantity policies, multi-source capabilities en governance rond gevoelige claims aankan.

De fase test specifiek:

- hygiënezekerheid;
- noodsanitatie;
- afvalbeheer;
- beschermende consumables;
- quantity policies per persoon/per dag/per huishouden;
- pack-size rounding voor consumables;
- itemkandidaten die meerdere needs kunnen ondersteunen;
- handschoenen als multi-need item zonder overclaim;
- vuilniszakken en zipbags als multi-purpose containment zonder overclaim;
- sanitatieclaims met usage constraints en warnings;
- Basis versus Basis+ itemkeuzes;
- uitlegbare coverage, sources en QA;
- regressions over Stroomuitval, Drinkwater, Voedsel en Hygiëne/Sanitatie.

---

## 3. Niet-doen-lijst

Deze fase doet expliciet niet:

- geen checkout;
- geen klantaccounts;
- geen auth;
- geen betaalflow;
- geen externe leverancierintegraties;
- geen echte voorraadreservering;
- geen volledige EHBO-batch;
- geen medische claimuitbreiding;
- geen persoonlijke medicatie;
- geen volledige baby-/huisdier-specifieke sanitary module;
- geen volledige shelter/evacuatie-uitbreiding;
- geen nieuwe schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen directe package → item koppeling;
- geen directe add-on → item koppeling;
- geen klantgerichte replacement-flow;
- geen approved replacements;
- geen automatische inkoop- of voorraadlogica.

---

## 4. Add-on

### 4.1 Specificatiecode

Voor dit document gebruiken we de inhoudelijke add-on code:

```text
ADDON-HYGIENE-SANITATION-WASTE
```

Deze code is geen database-slug.

### 4.2 Voorlopige slug-aanbeveling

Voorkeursrichting voor het latere mappingdocument:

```text
hygiene_sanitatie_afval
```

Alternatief, als de bestaande slugstrategie kortere add-on slugs verkiest:

```text
hygiene_sanitatie
```

Advies: kies in het mappingdocument definitief voor `hygiene_sanitatie_afval`, omdat afvalbeheer inhoudelijk een volwaardig onderdeel van deze batch is en niet slechts een accessoireketen.

### 4.3 Architectuurregel

De add-on mag later alleen scenario’s activeren. De add-on mag nooit direct aan items, productvarianten of item candidates gekoppeld worden.

Gewenste flow:

```text
addon=hygiene_sanitatie_afval
→ scenario’s
→ needs
→ capabilities
→ productregels
→ quantity policies
→ productvarianten
→ item candidates
→ accessoire requirements
→ generated package lines
→ sources + coverage + QA
```

---

## 5. Scenario’s

### 5.1 Overzicht

| Specificatiecode | Voorlopige slugrichting | Doel | Scope |
|---|---|---|---|
| `SCN-HYGIENE-72H-HOME` | `hygiene-thuis-72u` | Basishygiëne gedurende 72 uur thuis. | Handhygiëne, basisreiniging, doekjes/zeep. |
| `SCN-SANITATION-72H-HOME` | `noodsanitatie-thuis-72u` | Noodtoilet/sanitatie organiseren bij verstoring. | Toiletzakken, absorptie, toiletpapier, handbescherming. |
| `SCN-WASTE-MANAGEMENT-72H-HOME` | `afvalbeheer-thuis-72u` | Afval en verontreinigde materialen tijdelijk veilig insluiten. | Vuilniszakken, zipbags, containment, geur/hygiëne waarschuwingen. |

### 5.2 Scenario: `SCN-HYGIENE-72H-HOME`

**Inhoudelijke definitie**  
Een huishouden moet gedurende 72 uur basis handhygiëne en eenvoudige reiniging kunnen uitvoeren wanneer reguliere voorzieningen beperkt zijn of extra voorzichtig handelen nodig is.

**Belangrijke nuance**

- Handgel of doekjes zijn praktische hygiëneondersteuning.
- Ze mogen niet worden uitgelegd als medische desinfectie of sterilisatie.
- Ze vervangen geen regulier handen wassen als schoon water en zeep beschikbaar zijn.

### 5.3 Scenario: `SCN-SANITATION-72H-HOME`

**Inhoudelijke definitie**  
Een huishouden moet gedurende 72 uur een noodsanitatieoplossing kunnen gebruiken als toiletgebruik of waterafvoer beperkt is.

**Belangrijke nuance**

- Een toiletzak is geen volledige sanitaire infrastructuur.
- Correct gebruik, afsluiting, absorptie en afvalbeheer zijn nodig.
- Sanitatieproducten moeten duidelijke warnings krijgen over hygiëne, geur, veilige afvoer en single-use waar relevant.

### 5.4 Scenario: `SCN-WASTE-MANAGEMENT-72H-HOME`

**Inhoudelijke definitie**  
Een huishouden moet gedurende 72 uur afval, verontreinigde materialen en klein afval tijdelijk kunnen insluiten, scheiden en bewaren.

**Belangrijke nuance**

- Afvalzakken zijn containment, geen sanitatieoplossing op zichzelf.
- Zipbags zijn ondersteunend voor klein of geurend afval.
- Multi-purpose items mogen meerdere sources hebben, maar coverage moet eerlijk blijven.

---

## 6. Needs

### 6.1 Overzicht

| Specificatiecode | Voorlopige slugrichting | Doel | Kernvraag |
|---|---|---|---|
| `NEED-HYGIENE-HANDS` | `handhygiene` | Handhygiëne ondersteunen. | Kan de gebruiker handen praktisch reinigen/desinfecteren? |
| `NEED-HYGIENE-BASIC-CLEANING` | `basishygiene-reiniging` | Eenvoudige reiniging ondersteunen. | Zijn doekjes/zeep aanwezig voor basisreiniging? |
| `NEED-SANITATION-TOILET-72H` | `noodtoilet-72u` | Noodtoiletgebruik mogelijk maken. | Is er een oplossing voor toiletgebruik bij verstoring? |
| `NEED-SANITATION-ABSORBING-CONTAINMENT` | `sanitatie-absorptie-afsluiting` | Sanitair afval absorberen/insluiten. | Wordt vocht/geur/inhoud voldoende tijdelijk beheerst? |
| `NEED-WASTE-CONTAINMENT` | `afval-insluiten` | Afval tijdelijk verzamelen en insluiten. | Zijn geschikte zakken/containment aanwezig? |
| `NEED-WASTE-SEPARATION` | `afval-scheiden` | Klein of verontreinigd afval scheiden. | Zijn kleinere afsluitbare zakken beschikbaar? |
| `NEED-HAND-PROTECTION` | `handbescherming` | Handbescherming bij afval/sanitatiehandling. | Zijn wegwerphandschoenen beschikbaar waar nodig? |

### 6.2 Need-prioriteit

| Need | Prioriteit | Coverage-intentie |
|---|---:|---|
| `NEED-HYGIENE-HANDS` | 100 | Core |
| `NEED-HYGIENE-BASIC-CLEANING` | 90 | Core |
| `NEED-SANITATION-TOILET-72H` | 100 | Core als sanitatie-scenario actief is |
| `NEED-SANITATION-ABSORBING-CONTAINMENT` | 90 | Core/supporting afhankelijk van gekozen toiletzaktype |
| `NEED-WASTE-CONTAINMENT` | 95 | Core |
| `NEED-WASTE-SEPARATION` | 70 | Supporting/accessory |
| `NEED-HAND-PROTECTION` | 85 | Accessory/supporting, maar verplicht bij sanitatiehandling |

Let op: de termen `core`, `supporting` en `accessory` zijn hier inhoudelijk. Het mappingdocument moet bepalen hoe dit binnen bestaande databasevelden wordt verwerkt.

---

## 7. Capabilities

### 7.1 Overzicht

| Specificatiecode | Voorlopige slugrichting | Omschrijving | Mag primary sufficient zijn? |
|---|---|---|---|
| `CAP-HAND-SANITIZING` | `handen-desinfecteren` | Handgel/alcoholgel gebruiken volgens productspecificatie. | Ja, voor handhygiëne; niet voor medische sterilisatie. |
| `CAP-HAND-WASHING-SUPPORT` | `handen-reinigen` | Zeep of reinigingsmiddel voor handen. | Ja, voor handhygiëne. |
| `CAP-SURFACE-WIPE-CLEANING` | `oppervlak-reinigen-met-doekjes` | Doekjes voor eenvoudige reiniging. | Ja, voor basishygiëne; niet voor medische desinfectie. |
| `CAP-TOILET-WASTE-CONTAINMENT` | `toiletafval-insluiten` | Toiletzak/noodsanitatie-inhoud tijdelijk insluiten. | Ja, voor noodsanitatie. |
| `CAP-ABSORBENT-SANITATION` | `sanitair-absorberen` | Absorptie/stolling/geurbeperking ondersteunen. | Secondary/supporting, tenzij gekozen product volledig geïntegreerd is. |
| `CAP-WASTE-BAGGING` | `afvalzak-gebruiken` | Afval tijdelijk in zakken verzamelen. | Ja, voor afvalcontainment. |
| `CAP-SEALABLE-SMALL-WASTE` | `klein-afval-afsluitbaar-bewaren` | Klein/geurend/verontreinigd afval afsluitbaar bewaren. | Secondary/supporting. |
| `CAP-DISPOSABLE-HAND-PROTECTION` | `wegwerp-handbescherming` | Wegwerphandschoenen gebruiken. | Ja, voor handbescherming; niet voor medische bescherming. |

### 7.2 Capability-governance

Capabilities mogen later alleen primary/sufficient tellen voor de need waarvoor ze inhoudelijk bedoeld zijn.

Voorbeelden:

- Handgel mag `handhygiene` dekken, maar niet `basishygiene-reiniging` als enige oplossing.
- Hygiënedoekjes mogen basisreiniging dekken, maar niet medische desinfectie claimen.
- Nitril handschoenen mogen handbescherming dekken, maar voorkomen geen besmetting bij verkeerd gebruik.
- Vuilniszakken mogen afvalcontainment dekken, maar niet noodsanitatie volledig oplossen.
- Zipbags mogen klein afval scheiden/insluiten, maar niet afvalbeheer als geheel vervangen.

---

## 8. Scenario capability policies

### 8.1 `SCN-HYGIENE-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-HYGIENE-HANDS` | `CAP-HAND-SANITIZING` of `CAP-HAND-WASHING-SUPPORT` | Primary | Minimaal één realistische handhygiëne-oplossing. |
| `NEED-HYGIENE-BASIC-CLEANING` | `CAP-SURFACE-WIPE-CLEANING` | Primary | Doekjes of vergelijkbaar basisreinigingsproduct. |

### 8.2 `SCN-SANITATION-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-SANITATION-TOILET-72H` | `CAP-TOILET-WASTE-CONTAINMENT` | Primary | Toiletzak/noodtoiletzak-oplossing. |
| `NEED-SANITATION-ABSORBING-CONTAINMENT` | `CAP-ABSORBENT-SANITATION` | Secondary/primary afhankelijk van producttype | Absorptie kan geïntegreerd of los accessoire zijn. |
| `NEED-HAND-PROTECTION` | `CAP-DISPOSABLE-HAND-PROTECTION` | Primary voor handling | Verplicht wanneer sanitatiehandling in output zit. |

### 8.3 `SCN-WASTE-MANAGEMENT-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-WASTE-CONTAINMENT` | `CAP-WASTE-BAGGING` | Primary | Vuilniszakken of gelijkwaardige containment. |
| `NEED-WASTE-SEPARATION` | `CAP-SEALABLE-SMALL-WASTE` | Secondary/supporting | Zipbags voor klein/geurend/verontreinigd afval. |
| `NEED-HAND-PROTECTION` | `CAP-DISPOSABLE-HAND-PROTECTION` | Primary voor handling | Kan source delen met sanitatie. |

---

## 9. Producttypes

| Specificatiecode | Voorlopige slugrichting | Rol | Consumable? | Opmerking |
|---|---|---|---|---|
| `PTYPE-HAND-SANITIZER` | `handgel` | Core | Ja | Handhygiëne; waarschuwing bij alcohol/ontvlambaar. |
| `PTYPE-HYGIENE-WIPES` | `hygienedoekjes` | Core | Ja | Basisreiniging; geen medische desinfectieclaim. |
| `PTYPE-SOAP-BASIC` | `basiszeep` | Core/supporting | Ja | Alternatief of aanvulling op handgel. |
| `PTYPE-EMERGENCY-TOILET-BAGS` | `noodtoiletzakken` | Core | Ja | Noodsanitatie. |
| `PTYPE-SANITATION-ABSORBENT` | `sanitair-absorptiemiddel` | Accessory/supporting | Ja | Vereist indien toiletzak geen geïntegreerde absorber heeft. |
| `PTYPE-TOILET-PAPER` | `toiletpapier` | Core | Ja | Sanitatiebasis. |
| `PTYPE-WASTE-BAGS` | `vuilniszakken` | Core | Ja | Afvalcontainment. |
| `PTYPE-ZIPBAGS` | `zipbags` | Supporting/accessory | Ja | Klein afval, geur, scheiding. |
| `PTYPE-NITRILE-GLOVES` | `nitril-handschoenen` | Accessory/core voor handling | Ja | Wegwerp handbescherming. |

---

## 10. Productvarianten

Definitieve variant-slugs worden in het implementation mapping document vastgesteld. Inhoudelijk zijn minimaal de volgende varianten nodig.

### 10.1 Basis

| Specificatiecode | Producttype | Inhoudelijke variant |
|---|---|---|
| `VAR-HAND-SANITIZER-BASIC` | `PTYPE-HAND-SANITIZER` | Basis handgel, praktische verpakking. |
| `VAR-HYGIENE-WIPES-BASIC` | `PTYPE-HYGIENE-WIPES` | Basis hygiënedoekjes, beperkte maar kloppende hoeveelheid. |
| `VAR-SOAP-BASIC` | `PTYPE-SOAP-BASIC` | Basiszeep of compacte zeepoptie. |
| `VAR-TOILET-BAGS-BASIC` | `PTYPE-EMERGENCY-TOILET-BAGS` | Eenvoudige noodtoiletzakken. |
| `VAR-ABSORBENT-BASIC` | `PTYPE-SANITATION-ABSORBENT` | Basis absorptie/stolling indien vereist. |
| `VAR-TOILET-PAPER-BASIC` | `PTYPE-TOILET-PAPER` | Compacte toiletpapierdekking. |
| `VAR-WASTE-BAGS-BASIC` | `PTYPE-WASTE-BAGS` | Basis vuilniszakken. |
| `VAR-ZIPBAGS-BASIC` | `PTYPE-ZIPBAGS` | Basis zipbag-set. |
| `VAR-GLOVES-NITRILE-BASIC` | `PTYPE-NITRILE-GLOVES` | Basis nitril handschoenen. |

### 10.2 Basis+

| Specificatiecode | Producttype | Inhoudelijke variant |
|---|---|---|
| `VAR-HAND-SANITIZER-PLUS` | `PTYPE-HAND-SANITIZER` | Robuustere of beter doseerbare handgel. |
| `VAR-HYGIENE-WIPES-PLUS` | `PTYPE-HYGIENE-WIPES` | Betere doekjes, hogere bruikbaarheid, grotere verpakking. |
| `VAR-SOAP-PLUS` | `PTYPE-SOAP-BASIC` | Betere zeepoptie of extra robuuste handreiniging. |
| `VAR-TOILET-BAGS-PLUS` | `PTYPE-EMERGENCY-TOILET-BAGS` | Betere noodtoiletzakken, mogelijk geïntegreerde absorber. |
| `VAR-ABSORBENT-PLUS` | `PTYPE-SANITATION-ABSORBENT` | Betere absorber/geurbeperking indien los nodig. |
| `VAR-TOILET-PAPER-PLUS` | `PTYPE-TOILET-PAPER` | Betere/ruimere toiletpapierdekking. |
| `VAR-WASTE-BAGS-PLUS` | `PTYPE-WASTE-BAGS` | Robuustere zakken, betere lek-/scheurbestendigheid. |
| `VAR-ZIPBAGS-PLUS` | `PTYPE-ZIPBAGS` | Ruimere of robuustere zipbag-set. |
| `VAR-GLOVES-NITRILE-PLUS` | `PTYPE-NITRILE-GLOVES` | Betere kwaliteit of ruimere maatvoering. |

---

## 11. Items Basis/Basis+

De onderstaande itemcodes zijn conceptueel en bedoeld voor POC-seeddata. Definitieve itemcodes worden in het mappingdocument bevestigd.

### 11.1 Basis — conceptitems

| Conceptitem | Producttype | Verwachte rol | Verwachte quantity-intentie |
|---|---|---|---|
| `IOE-HANDGEL-BASIC` | `PTYPE-HAND-SANITIZER` | Core | Fixed of per household baseline. |
| `IOE-HYGIENE-WIPES-BASIC` | `PTYPE-HYGIENE-WIPES` | Core | Per person/per day met pack-size rounding. |
| `IOE-SOAP-BASIC` | `PTYPE-SOAP-BASIC` | Core/supporting | Fixed 1 of alternatief voor handgel. |
| `IOE-TOILET-BAGS-BASIC` | `PTYPE-EMERGENCY-TOILET-BAGS` | Core | Per person/per day of POC toiletmomenten. |
| `IOE-ABSORBENT-BASIC` | `PTYPE-SANITATION-ABSORBENT` | Accessory/supporting | Fixed of gekoppeld aan toiletzakken. |
| `IOE-TOILET-PAPER-BASIC` | `PTYPE-TOILET-PAPER` | Core | Per person/per day of fixed pack. |
| `IOE-WASTE-BAGS-BASIC` | `PTYPE-WASTE-BAGS` | Core | Per household/per day of fixed pack. |
| `IOE-ZIPBAGS-BASIC` | `PTYPE-ZIPBAGS` | Supporting/accessory | Fixed pack. |
| `IOE-GLOVES-NITRILE-BASIC` | `PTYPE-NITRILE-GLOVES` | Accessory/core voor handling | Fixed pack of per handling moment POC. |

### 11.2 Basis+ — conceptitems

| Conceptitem | Producttype | Verwachte rol | Verwachte quantity-intentie |
|---|---|---|---|
| `IOE-HANDGEL-PLUS` | `PTYPE-HAND-SANITIZER` | Core | Fixed of per household baseline. |
| `IOE-HYGIENE-WIPES-PLUS` | `PTYPE-HYGIENE-WIPES` | Core | Per person/per day met pack-size rounding. |
| `IOE-SOAP-PLUS` | `PTYPE-SOAP-BASIC` | Core/supporting | Fixed 1 of betere aanvulling. |
| `IOE-TOILET-BAGS-PLUS` | `PTYPE-EMERGENCY-TOILET-BAGS` | Core | Per person/per day of POC toiletmomenten. |
| `IOE-ABSORBENT-PLUS` | `PTYPE-SANITATION-ABSORBENT` | Accessory/supporting | Mogelijk niet nodig als geïntegreerd in toiletzakken. |
| `IOE-TOILET-PAPER-PLUS` | `PTYPE-TOILET-PAPER` | Core | Ruimere/betere dekking. |
| `IOE-WASTE-BAGS-PLUS` | `PTYPE-WASTE-BAGS` | Core | Robuustere/ruimere dekking. |
| `IOE-ZIPBAGS-PLUS` | `PTYPE-ZIPBAGS` | Supporting/accessory | Ruimere set. |
| `IOE-GLOVES-NITRILE-PLUS` | `PTYPE-NITRILE-GLOVES` | Accessory/core voor handling | Betere kwaliteit/maatvoering. |

### 11.3 Basis+ principe

Basis+ betekent hier:

- betere scenariofit;
- hogere praktische bruikbaarheid;
- robuustere verpakking of verwerking;
- minder zwakke schakels;
- betere uitleg/governance;
- mogelijk meer hoeveelheid waar dit inhoudelijk nodig is;
- niet automatisch “meer spullen”.

---

## 12. Item capabilities

### 12.1 Basisitems

| Item | Capabilities | Coverage-intentie | Claimtype-intentie |
|---|---|---|---|
| `IOE-HANDGEL-BASIC` | `CAP-HAND-SANITIZING` | Primary voor handhygiëne | Productspecificatie/assumed POC, geen medische claim. |
| `IOE-HYGIENE-WIPES-BASIC` | `CAP-SURFACE-WIPE-CLEANING` | Primary voor basisreiniging | Productspecificatie/assumed POC, geen sterilisatieclaim. |
| `IOE-SOAP-BASIC` | `CAP-HAND-WASHING-SUPPORT` | Primary of secondary voor handhygiëne | Productspecificatie/assumed POC. |
| `IOE-TOILET-BAGS-BASIC` | `CAP-TOILET-WASTE-CONTAINMENT` | Primary voor noodsanitatie | Productspecificatie/assumed POC. |
| `IOE-ABSORBENT-BASIC` | `CAP-ABSORBENT-SANITATION` | Secondary/accessory | Productspecificatie/assumed POC. |
| `IOE-TOILET-PAPER-BASIC` | Sanitair comfort/gebruiksondersteuning | Core/supporting | Productspecificatie/assumed POC. |
| `IOE-WASTE-BAGS-BASIC` | `CAP-WASTE-BAGGING` | Primary voor afvalcontainment | Productspecificatie/assumed POC. |
| `IOE-ZIPBAGS-BASIC` | `CAP-SEALABLE-SMALL-WASTE` | Secondary/supporting | Productspecificatie/assumed POC. |
| `IOE-GLOVES-NITRILE-BASIC` | `CAP-DISPOSABLE-HAND-PROTECTION` | Primary voor handbescherming | Productspecificatie/assumed POC, geen medische bescherming. |

### 12.2 Basis+ items

Basis+ items hebben dezelfde inhoudelijke capabilities, maar hogere fit/reliability/real-world-fit waar het bestaande datamodel dit ondersteunt.

Belangrijk:

- `IOE-GLOVES-NITRILE-PLUS` mag handbescherming primary dekken, maar niet medische steriliteit claimen.
- `IOE-TOILET-BAGS-PLUS` mag betere sanitatiecoverage geven, maar vereist nog steeds usage warnings.
- `IOE-WASTE-BAGS-PLUS` mag betere afvalcontainment geven, maar vervangt geen toiletzakoplossing.
- `IOE-ZIPBAGS-PLUS` mag meerdere sources hebben, maar blijft supporting voor klein afval/scheiding.

---

## 13. Productregels

### 13.1 Scenario `SCN-HYGIENE-72H-HOME`

| Need | Producttype | Rol-intentie | Tiergedrag |
|---|---|---|---|
| `NEED-HYGIENE-HANDS` | `PTYPE-HAND-SANITIZER` | Core | Basis en Basis+ eigen variant. |
| `NEED-HYGIENE-HANDS` | `PTYPE-SOAP-BASIC` | Core/supporting | Kan naast handgel of als alternatief, afhankelijk mapping. |
| `NEED-HYGIENE-BASIC-CLEANING` | `PTYPE-HYGIENE-WIPES` | Core | Basis en Basis+ eigen variant. |

### 13.2 Scenario `SCN-SANITATION-72H-HOME`

| Need | Producttype | Rol-intentie | Tiergedrag |
|---|---|---|---|
| `NEED-SANITATION-TOILET-72H` | `PTYPE-EMERGENCY-TOILET-BAGS` | Core | Basis en Basis+ eigen variant. |
| `NEED-SANITATION-ABSORBING-CONTAINMENT` | `PTYPE-SANITATION-ABSORBENT` | Accessory/supporting | Verplicht als toiletzak geen geïntegreerde absorber heeft. |
| `NEED-SANITATION-TOILET-72H` | `PTYPE-TOILET-PAPER` | Core | Basis en Basis+ eigen variant. |
| `NEED-HAND-PROTECTION` | `PTYPE-NITRILE-GLOVES` | Accessory/core voor handling | Verplicht bij sanitatiehandling. |

### 13.3 Scenario `SCN-WASTE-MANAGEMENT-72H-HOME`

| Need | Producttype | Rol-intentie | Tiergedrag |
|---|---|---|---|
| `NEED-WASTE-CONTAINMENT` | `PTYPE-WASTE-BAGS` | Core | Basis en Basis+ eigen variant. |
| `NEED-WASTE-SEPARATION` | `PTYPE-ZIPBAGS` | Supporting/accessory | Basis en Basis+ eigen variant. |
| `NEED-HAND-PROTECTION` | `PTYPE-NITRILE-GLOVES` | Accessory/core voor handling | Dedupliceren met sanitatiehandschoenen. |

---

## 14. Quantity policies

### 14.1 Algemeen

Dit document gebruikt conceptuele quantity policy-termen. Het latere implementation mapping document moet deze naar bestaande `quantity_policy`-mechaniek vertalen. Er mogen geen nieuwe quantity policy enumwaarden worden toegevoegd zonder expliciete toestemming.

### 14.2 Conceptuele policies

| Conceptterm | Betekenis | Mapping-intentie later |
|---|---|---|
| `per_person_per_day` | Hoeveelheid schaalt met personen en dagen. | Bestaande per_person_per_day als beschikbaar. |
| `per_household_fixed` | Vaste huishoudenbaseline. | Bestaande fixed/per_household policy. |
| `per_person_pack_rounding` | Personen → benodigde eenheden → afronden op verpakking. | Bestaande pack_size rounding. |
| `per_day_pack_rounding` | Dagen → benodigde eenheden → afronden op verpakking. | Bestaande pack_size rounding. |
| `one_per_household` | Eén verpakking/item per huishouden. | Bestaande fixed policy met base_amount = 1. |
| `one_pack_per_household` | Eén pack als baseline. | Bestaande fixed/per_household policy. |
| `when_sanitation_required` | Alleen wanneer sanitatiecomponent is geselecteerd. | Accessoire requirement of productregelcontext. |
| `when_waste_handling_required` | Alleen wanneer afval/sanitatiehandling is geselecteerd. | Accessoire requirement of productregelcontext. |

### 14.3 POC-aannames voor aantallen

De onderstaande aantallen zijn inhoudelijke POC-aannames. Ze moeten later in mapping/seed concreet gemaakt worden op basis van bestaande schemafunctionaliteit.

| Producttype | Quantity-intentie | POC-richting |
|---|---|---|
| Handgel | `per_household_fixed` of `one_pack_per_household` | 1 per huishouden voor 72 uur. |
| Hygiënedoekjes | `per_person_per_day` + pack-size rounding | Aantal doekjes schaalt met personen/dagen. |
| Basiszeep | `one_per_household` | 1 verpakking/stuk als aanvulling of alternatief. |
| Noodtoiletzakken | `per_person_per_day` of POC toiletmomenten | Voor POC: persoondagen of vaste factor per persoon/dag. |
| Absorptiemiddel | `when_sanitation_required` + fixed/pack rounding | Alleen als gekozen toiletzak dit vereist. |
| Toiletpapier | `per_person_per_day` of `one_pack_per_household` | POC: pack-size rounding op personen/dagen. |
| Vuilniszakken | `per_household_fixed` of `per_day_pack_rounding` | POC: vaste baseline of per dag. |
| Zipbags | `one_pack_per_household` | 1 set per huishouden. |
| Nitril handschoenen | `when_sanitation_required` en/of `when_waste_handling_required` | POC: 1 pack, deduped bij meerdere sources. |

### 14.4 Verwachte testbare quantity-principes

De latere regression moet aantonen dat:

- consumables quantity policies hebben;
- aantallen niet hardcoded willekeurig zijn;
- duur van 72 uur wordt meegenomen waar relevant;
- huishouden/personen worden meegenomen waar relevant;
- pack-size rounding werkt;
- handschoenen dedupliceren als sanitatie én afvalbeheer ze vereisen;
- zipbags of vuilniszakken multi-source kunnen zijn zonder dubbele overbodige output;
- Basis+ betere fit kan hebben zonder noodzakelijk hogere quantity.

---

## 15. Accessoire requirements

### 15.1 Mogelijke accessoireketens

| Parent | Vereist accessoire | Reden | Opmerking |
|---|---|---|---|
| Noodtoiletzakken zonder geïntegreerde absorber | Sanitair absorptiemiddel | Vocht/geur/inhoud beter beheersen. | Alleen indien productvariant dit vereist. |
| Noodtoiletzakken | Nitril handschoenen | Hygiënisch omgaan met sanitaire inhoud. | Verplicht bij sanitatiehandling. |
| Sanitair absorptiemiddel | Nitril handschoenen | Contact met absorptiemiddel/sanitair afval beperken. | Kan dedupliceren. |
| Afvalzakken | Nitril handschoenen | Afvalhandling. | Alleen als afval/sanitatiecontext actief is. |
| Afvalbeheer | Zipbags | Klein/geurend/verontreinigd afval scheiden. | Supporting/accessory. |
| Toiletzakken | Vuilniszakken of containment | Tijdelijke opslag/afvoer. | Niet altijd parent-child; kan ook eigen productregel zijn. |

### 15.2 Architectuurregel

Accessoires ontstaan later via bestaande accessoiremechaniek, productregels of scenario needs. Ze mogen niet ontstaan via directe add-on → item koppeling.

### 15.3 Deduplicatie

Als `IOE-GLOVES-NITRILE-*` vereist is door zowel noodsanitatie als afvalbeheer, moet de output één regel tonen met meerdere sources, tenzij quantity policies bewust optellen via bestaand beleid.

---

## 16. Supplier offers en source-informatie

### 16.1 Geen schema-uitbreiding

Deze fase mag later geen nieuwe velden toevoegen aan `supplier_offer`, zoals:

- `source_status`;
- `source_url`;
- `source_checked_at`;
- `claim_coverage`;
- `price_status`.

### 16.2 POC-sourceinformatie

POC-sourceinformatie kan later worden vastgelegd in bestaande velden zoals:

- item notes;
- internal explanations;
- public explanations;
- claim governance notes;
- usage constraint notes;
- supplier_offer bestaande velden, voor zover aanwezig.

### 16.3 Minimum sourcecriteria

Elke generated package line moet later herleidbaar zijn naar minimaal één source:

- scenario_need/product_rule voor core lines;
- accessory_requirement en parent item voor required accessories;
- meerdere sources voor deduped multi-purpose items;
- duidelijke internal explanation voor POC-aannames.

---

## 17. Claim governance

### 17.1 Algemene governance

Deze batch bevat claimgevoelige producten. De systeemnorm is:

> Hygiëne en sanitatie ondersteunen verstandig handelen, maar vervangen geen medische zorg, professionele desinfectie of officiële afvalverwerking.

### 17.2 Governance per domein

| Domein | Governance-regel |
|---|---|
| Handgel | Geen garantie tegen alle ziekteverwekkers; gebruik volgens etiket; brandbaar bij alcoholbasis. |
| Zeep | Ondersteunt handen wassen; vereist water of geschikte toepassing. |
| Hygiënedoekjes | Basisreiniging; geen medische sterilisatie of volledige desinfectieclaim. |
| Noodtoiletzakken | Alleen correct gebruiken; afsluiten; veilig tijdelijk bewaren; volgens lokale regels afvoeren. |
| Absorptiemiddel | Ondersteunend; correct doseren/gebruiken; niet innemen; buiten bereik van kinderen. |
| Toiletpapier | Comfort/gebruiksproduct; dekt geen sanitatie op zichzelf. |
| Vuilniszakken | Afvalcontainment; geen sanitatieoplossing op zichzelf. |
| Zipbags | Klein/geurend afval ondersteunen; geen primaire afvaloplossing. |
| Nitril handschoenen | Handbescherming bij handling; verkeerd gebruik kan besmetting verspreiden; geen medische steriele bescherming tenzij expliciet bewezen. |

### 17.3 Overclaim-blokkades

De latere implementatie mag geen public explanation genereren die suggereert:

- “beschermt tegen alle virussen/bacteriën”;
- “steriliseert”;
- “medische bescherming”;
- “volledige infectiepreventie”;
- “veilig omgaan met alle soorten afval”;
- “sanitatie volledig opgelost”;
- “geschikt voor gevaarlijk/chemisch/medisch afval”, tenzij het product en governance expliciet bewezen zijn, wat buiten deze POC-scope valt.

---

## 18. Usage constraints

### 18.1 Conceptuele constraints

Onderstaande termen zijn inhoudelijke constraints en mogen niet automatisch als database-enums worden toegevoegd.

| Conceptterm | Betekenis | Voorbeelden |
|---|---|---|
| `wash_or_sanitize_hands` | Handen reinigen vóór/na handling. | Toiletzakken, afvalzakken, handschoenen. |
| `avoid_eye_contact` | Contact met ogen vermijden. | Handgel, doekjes. |
| `not_for_medical_sterilization` | Geen medische sterilisatieclaim. | Handgel, doekjes, handschoenen. |
| `single_use` | Wegwerp/eenmalig gebruik. | Handschoenen, toiletzakken, doekjes. |
| `dispose_safely` | Veilig tijdelijk bewaren/afvoeren. | Toiletzakken, afvalzakken, zipbags. |
| `keep_away_from_children` | Buiten bereik van kinderen. | Handgel, absorber, zakken. |
| `store_cool_dry` | Koel/droog bewaren. | Doekjes, handschoenen, toiletpapier, absorber. |
| `flammable_if_alcohol_based` | Brandbaar bij alcoholbasis. | Handgel. |
| `check_expiry_periodically` | Houdbaarheid controleren. | Handgel, doekjes. |
| `odor_hygiene_warning` | Geur/hygiëne aandachtspunt. | Toiletzakken, afvalcontainment. |

### 18.2 Mapping-opmerking

Het implementation mapping document moet deze conceptterms mappen naar bestaande `item_usage_constraint` types. Als een gewenste constraint niet bestaat, mag er niet automatisch een nieuwe enum worden toegevoegd. Gebruik dan bestaande constraints, notes of public/internal warnings, of rapporteer de blokkade.

---

## 19. Public explanation templates

### 19.1 Handhygiëne

**Template**

> Deze handhygiëne-oplossing is toegevoegd zodat je handen praktisch kunt reinigen of desinfecteren wanneer normale voorzieningen beperkt zijn. Gebruik altijd volgens de productinstructie. Dit is geen garantie tegen alle ziekteverwekkers en vervangt geen medische hygiëneprotocollen.

### 19.2 Hygiënedoekjes

**Template**

> Deze doekjes zijn toegevoegd voor eenvoudige reiniging van handen of oppervlakken in een noodsituatie. Ze ondersteunen basishygiëne, maar zijn geen volledige schoonmaak- of medische desinfectieoplossing.

### 19.3 Zeep

**Template**

> Deze zeep ondersteunt handreiniging wanneer water beschikbaar is. Ze is toegevoegd als praktische basismaatregel voor hygiëne gedurende de gekozen periode.

### 19.4 Noodtoiletzakken

**Template**

> Deze noodtoiletzakken zijn toegevoegd als tijdelijke sanitaire oplossing wanneer normaal toiletgebruik of waterafvoer beperkt is. Gebruik, afsluiting en tijdelijke opslag moeten zorgvuldig gebeuren volgens de instructies.

### 19.5 Absorptiemiddel

**Template**

> Dit absorptiemiddel is toegevoegd om de noodsanitatieoplossing praktisch bruikbaar te maken. Het ondersteunt absorptie en containment, maar werkt alleen bij correct gebruik en dosering.

### 19.6 Toiletpapier

**Template**

> Toiletpapier is toegevoegd als basisverbruiksproduct voor noodsanitatie gedurende de gekozen periode.

### 19.7 Vuilniszakken

**Template**

> Deze vuilniszakken zijn toegevoegd om afval tijdelijk te verzamelen en in te sluiten. Ze ondersteunen afvalbeheer, maar vervangen geen correcte hygiëne- of afvalverwerkingsmaatregelen.

### 19.8 Zipbags

**Template**

> Deze afsluitbare zakjes zijn toegevoegd voor klein, geurend of verontreinigd afval dat apart bewaard moet worden. Ze zijn ondersteunend en vervangen geen volwaardige afvaloplossing.

### 19.9 Nitril handschoenen

**Template**

> Deze nitril handschoenen zijn toegevoegd voor handbescherming bij sanitatie- en afvalhandling. Verkeerd gebruik kan besmetting juist verspreiden; gebruik ze eenmalig en gooi ze veilig weg.

### 19.10 Basis+

**Template**

> De Basis+ keuze gebruikt een beter passende variant met hogere praktische bruikbaarheid of robuustere uitvoering. Basis+ betekent betere dekking en minder zwakke schakels, niet simpelweg meer spullen.

---

## 20. Expected output Basis

Voor de latere run:

```text
addon=hygiene_sanitatie_afval
tier=basis
```

of de definitieve add-on slug uit het mappingdocument, moet de Basis-output inhoudelijk minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie | Reden |
|---|---|---|---|
| Handhygiëne | `IOE-HANDGEL-BASIC` en/of `IOE-SOAP-BASIC` | Core | Handhygiëne voor 72 uur. |
| Basisreiniging | `IOE-HYGIENE-WIPES-BASIC` | Core | Eenvoudige reiniging. |
| Noodtoilet | `IOE-TOILET-BAGS-BASIC` | Core | Tijdelijke sanitaire oplossing. |
| Absorptie/containment | `IOE-ABSORBENT-BASIC` | Accessory/supporting | Als toiletzakken dit vereisen. |
| Toiletpapier | `IOE-TOILET-PAPER-BASIC` | Core | Sanitair verbruiksproduct. |
| Afvalcontainment | `IOE-WASTE-BAGS-BASIC` | Core | Afval tijdelijk insluiten. |
| Klein afval/scheiding | `IOE-ZIPBAGS-BASIC` | Supporting/accessory | Klein/geurend afval apart bewaren. |
| Handbescherming | `IOE-GLOVES-NITRILE-BASIC` | Accessory/core voor handling | Vereist bij sanitatie/afvalhandling. |

### Basis-output principes

- Alle core consumables hebben quantity policy.
- Handschoenen mogen meerdere sources hebben.
- Absorptiemiddel is alleen los nodig als de gekozen toiletzakoplossing het vereist.
- Vuilniszakken zijn afvalcontainment, geen volledige sanitatieoplossing.
- Zipbags zijn supporting, niet primary voor afvalbeheer als geheel.
- Usage warnings zijn zichtbaar voor sanitatie, handgel en handschoenen.

---

## 21. Expected output Basis+

Voor de latere run:

```text
addon=hygiene_sanitatie_afval
tier=basis_plus
```

of de definitieve add-on slug uit het mappingdocument, moet de Basis+-output inhoudelijk minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie | Reden |
|---|---|---|---|
| Handhygiëne | `IOE-HANDGEL-PLUS` en/of `IOE-SOAP-PLUS` | Core | Betere/robuustere handhygiëne. |
| Basisreiniging | `IOE-HYGIENE-WIPES-PLUS` | Core | Betere doekjes of grotere bruikbaarheid. |
| Noodtoilet | `IOE-TOILET-BAGS-PLUS` | Core | Betere noodtoiletzakoplossing. |
| Absorptie/containment | `IOE-ABSORBENT-PLUS` of geïntegreerd | Accessory/supporting | Afhankelijk van Plus-toiletzak. |
| Toiletpapier | `IOE-TOILET-PAPER-PLUS` | Core | Betere/ruimere dekking. |
| Afvalcontainment | `IOE-WASTE-BAGS-PLUS` | Core | Robuustere zakken. |
| Klein afval/scheiding | `IOE-ZIPBAGS-PLUS` | Supporting/accessory | Betere/ruimere afsluitbare set. |
| Handbescherming | `IOE-GLOVES-NITRILE-PLUS` | Accessory/core voor handling | Betere kwaliteit/fit. |

### Basis+ outputprincipes

- Basis+ kiest beter passende items dan Basis.
- Basis+ mag niet alleen meer aantallen toevoegen zonder inhoudelijke reden.
- Als Plus-toiletzakken absorber geïntegreerd hebben, mag los absorptiemiddel vervallen, mits coverage en uitleg kloppen.
- Handschoenen blijven geen medische bescherming claimen.
- Governance/warnings blijven aanwezig, ook bij betere producten.

---

## 22. Coveragecriteria

Een latere output is inhoudelijk voldoende als:

1. `NEED-HYGIENE-HANDS` voldoende is afgedekt door handgel en/of zeep.
2. `NEED-HYGIENE-BASIC-CLEANING` voldoende is afgedekt door doekjes of een vergelijkbare basisreinigingsoplossing.
3. `NEED-SANITATION-TOILET-72H` voldoende is afgedekt door noodtoiletzakken of gelijkwaardige oplossing.
4. `NEED-SANITATION-ABSORBING-CONTAINMENT` is afgedekt indien de gekozen toiletzakoplossing dit vereist.
5. `NEED-WASTE-CONTAINMENT` voldoende is afgedekt door vuilniszakken of gelijkwaardige containment.
6. `NEED-WASTE-SEPARATION` supporting is afgedekt door zipbags of vergelijkbare afsluitbare kleine containment.
7. `NEED-HAND-PROTECTION` is afgedekt als sanitatie of afvalhandling in de output zit.
8. Multi-purpose items meerdere sources kunnen hebben zonder dubbele onnodige regels.
9. Geen item meer coverage claimt dan realistisch is.
10. Sanitatie- en hygiëneclaims warnings hebben.
11. Consumables quantity policies hebben.
12. QA blocking 0 blijft.

---

## 23. Sourcecriteria

De latere gegenereerde output moet voldoen aan deze sourcecriteria:

- Elke generated line heeft minimaal één source.
- Core lines zijn herleidbaar naar scenario_need en product_rule.
- Accessory lines zijn herleidbaar naar parent item/accessory requirement of scenario context.
- Multi-source items tonen meerdere sources, bijvoorbeeld handschoenen voor sanitatie én afvalhandling.
- Uitleg moet zichtbaar maken waarom een item gekozen is.
- POC-aannames worden vastgelegd in internal explanation of notes.
- Supplier-offer informatie blijft binnen bestaande velden.
- Geen supplier_offer schema-uitbreiding.
- Geen direct package/add-on → item source.

---

## 24. QA-criteria

De latere implementatie moet minimaal voldoen aan:

- QA blocking = 0.
- Geen active scenario zonder needs.
- Geen active needs zonder capabilities.
- Geen scenario needs zonder product rules.
- Geen active items zonder capabilities.
- Geen active consumables zonder quantity policy.
- Geen required accessories zonder candidate item.
- Geen producttype mismatch.
- Geen generated lines zonder sources.
- Geen generated line producttype mismatch.
- Geen medische overclaims.
- Geen infectiepreventie-overclaims.
- Geen sanitatie-overclaims.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer schema-uitbreiding.
- Geen Directus composite-PK aanpassing.
- Geen directe add-on/package → item koppeling.

---

## 25. Engine-aanpassingen — inhoudelijke verwachting

Nog niet implementeren. De engine moet later waarschijnlijk minimaal ondersteunen of aantoonbaar hergebruiken:

- consumable quantity policies;
- per persoon/per dag berekeningen;
- fixed household quantities;
- pack-size rounding;
- accessoire requirements bij sanitatie;
- conditional accessories bij toiletzakken;
- multi-source items;
- deduplicatie van handschoenen en/of afvalcontainment;
- supporting/accessory role-afleiding;
- warnings/governance zichtbaar in output;
- uitlegtemplates per itemtype;
- regression per tier;
- QA-controle op consumables zonder quantity policy.

Belangrijk:

- De engine mag geen hygiëne- of sanitatieclaims harder maken dan de capability/governance toelaat.
- Handschoenen mogen niet als universele bescherming tellen.
- Zipbags mogen niet als primaire afvaloplossing voor alle afval tellen.
- Afvalzakken mogen geen noodtoiletclaim krijgen, tenzij via expliciete scenario/productregel/accessoirelogica inhoudelijk correct gemaakt.

---

## 26. Interne webapp-aanpassing — inhoudelijke verwachting

Nog niet implementeren. De interne webapp moet later minimaal ondersteunen:

```text
addon=hygiene_sanitatie_afval
tier=basis
tier=basis_plus
```

Of de definitieve add-on slug uit het mappingdocument.

De interne webapp moet later tonen:

- core hygiëne-, sanitatie- en afvalregels;
- accessories;
- multi-source items;
- quantities;
- sources;
- coverage;
- usage warnings;
- governance notes;
- QA-resultaat;
- verschil tussen Basis en Basis+.

Geen klantgerichte checkout, account of betaalflow bouwen.

---

## 27. Regression test — inhoudelijke specificatie

Nog niet implementeren. De latere regression krijgt vermoedelijk:

```text
regression_hygiene_sanitatie_poc.js
npm run test:hygiene-sanitatie-poc
```

De regression moet minimaal valideren:

1. `addon=hygiene_sanitatie_afval` werkt voor `tier=basis`, tenzij mapping definitief andere slug kiest.
2. `addon=hygiene_sanitatie_afval` werkt voor `tier=basis_plus`, tenzij mapping definitief andere slug kiest.
3. Basis-output bevat handhygiëne.
4. Basis+-output bevat handhygiëne.
5. Basis-output bevat basisreiniging.
6. Basis+-output bevat basisreiniging.
7. Basis-output bevat noodsanitatie.
8. Basis+-output bevat noodsanitatie.
9. Afvalcontainment is afgedekt.
10. Zipbags of klein-afvalcontainment zijn aanwezig waar vereist.
11. Handschoenen worden gegenereerd waar sanitatie/afvalhandling dit vereist.
12. Handschoenen dedupliceren of krijgen correcte quantity/sources als meerdere needs ze vereisen.
13. Consumable quantities gebruiken duration/person/pack-size waar relevant.
14. Basis+ gebruikt betere/hoger passende items dan Basis.
15. Multi-source items behouden sources.
16. Geen item maakt medische claim.
17. Geen item maakt volledige infectiepreventieclaim.
18. Usage constraints zijn aanwezig bij handgel, toiletzakken, absorber, afvalhandling en handschoenen waar relevant.
19. QA generated lines without sources = 0.
20. QA generated line producttype mismatch = 0.
21. QA blocking = 0.
22. `npm run test:stroomuitval-poc` blijft groen.
23. `npm run test:drinkwater-poc` blijft groen.
24. `npm run test:voedsel-poc` blijft groen.
25. `npm run test:hygiene-sanitatie-poc` is groen.

---

## 28. Release note — toekomstige baseline

Nog niet maken/taggen. Later moet bij afronding een release note worden toegevoegd voor:

```text
v0.4.0-hygiene-sanitatie-baseline
```

Inhoud toekomstige release note:

- fase en contentbatch;
- commit en tag;
- gekozen add-on slug;
- scenario’s;
- needs;
- capabilities;
- belangrijkste itemlogica;
- quantity policy mapping;
- governance en usage constraints;
- testresultaten;
- QA blocking;
- interne webapp-route;
- bekende open punten;
- conclusie.

---

## 29. Agent-opdracht voor de volgende stap

Na goedkeuring van deze inhoudelijke specificatie moet de agent **nog niet implementeren**, maar eerst het mappingdocument maken:

```text
contentbatch_4_hygiene_sanitatie_afval_implementation_mapping.md
```

Het mappingdocument moet deze specificatie vertalen naar het bestaande Ik overleef-datamodel en minimaal bevatten:

- definitieve add-on slug;
- code naar database-slug mapping;
- bestaande coverage enumwaarden;
- bestaande claim_type waarden;
- bestaande usage_constraint types;
- quantity policy mapping naar bestaande policytypes;
- accessoire requirement mapping;
- supplier/source mapping zonder supplier_offer schema-uitbreiding;
- supporting/core/accessory output mapping;
- expliciete bevestiging dat geen schemawijziging of nieuwe enum nodig is;
- expliciete blokkade als iets niet binnen het huidige schema past.

---

## 30. Fase-afrondingscriteria

Fase 3 is later technisch pas afgerond als:

- deze inhoudelijke specificatie is goedgekeurd;
- `contentbatch_4_hygiene_sanitatie_afval_implementation_mapping.md` is goedgekeurd;
- mapping-check vóór implementatie is uitgevoerd;
- seed draait zonder schemawijzigingen;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen supplier_offer schema-uitbreiding is gedaan;
- geen Directus composite-PK wijziging is gedaan;
- add-on activeert scenario’s;
- geen directe add-on → item koppeling bestaat;
- geen directe package → item koppeling bestaat;
- Basis-output klopt;
- Basis+-output klopt;
- consumable quantities kloppen;
- pack-size rounding werkt waar relevant;
- handschoenen/multi-source items correct werken;
- sanitatie-governance klopt;
- usage constraints zichtbaar zijn;
- QA blocking = 0;
- regressions groen zijn:
  - `npm run test:stroomuitval-poc`;
  - `npm run test:drinkwater-poc`;
  - `npm run test:voedsel-poc`;
  - `npm run test:hygiene-sanitatie-poc`;
- interne webapp toont hygiëne/sanitatie/afvaloutput correct;
- release note aanwezig is;
- commit en tag pas na volledige validatie zijn gezet.

---

## 31. Samenvatting voor review

Deze specificatie definieert Contentbatch 4 als consumable-heavy baseline voor:

- handhygiëne;
- basisreiniging;
- noodsanitatie;
- afvalcontainment;
- klein-afvalscheiding;
- nitril handbescherming;
- quantity policies en pack-size rounding;
- multi-source items;
- governance tegen medische/sanitatie-overclaims.

De aanbevolen add-on slug voor latere mapping is:

```text
hygiene_sanitatie_afval
```

De beoogde baseline na implementatie is:

```text
v0.4.0-hygiene-sanitatie-baseline
```

Er is in deze stap niets geïmplementeerd.
