# contentbatch_7_evacuatie_documenten_v1.md

**Project:** Ik overleef  
**Fase:** Fase 6 — Contentbatch 7 Evacuatie & documenten  
**Documenttype:** Inhoudelijke specificatie  
**Status:** Specificatie v1 — klaar voor end-to-end agentuitvoering met mapping-check vóór implementatie  
**Datum:** 2026-04-29  
**Vorige baseline:** `v0.6.0-warmte-droog-shelter-light-baseline`  
**Beoogde baseline:** `v0.7.0-evacuatie-baseline`  
**Bijbehorend mappingdocument:** `contentbatch_7_evacuatie_documenten_implementation_mapping.md`

---

## 0. Harde scope- en governance-opmerking

Dit document is de inhoudelijke specificatie voor Contentbatch 7. Implementatie mag alleen plaatsvinden nadat het implementation mapping document is gecontroleerd en de agent een expliciete mapping-check heeft gerapporteerd.

Vaste werkwijze:

1. Eerst inhoudelijke specificatie.
2. Daarna expliciete implementation mapping naar het bestaande schema.
3. Daarna mapping-check tegen database, enumwaarden, seedpatronen, QA-views en engineconcepten.
4. Pas daarna seed/engine/webapp/regression implementeren.
5. Geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen zonder expliciete toestemming.
6. Database-first blijven.
7. Packages en add-ons nooit direct aan items koppelen.
8. Packages en add-ons activeren scenario’s.
9. Scenario’s leiden via needs, capabilities, productregels, quantity policies, productvarianten, item candidates, accessoire requirements, generated package lines, sources, coverage en QA tot output.
10. Bestaande slugs, enumwaarden, QA-views en engineconcepten blijven leidend.

Termen zoals `container`, `packability`, `task_only`, `document_task`, `evacuation_ready`, `supporting`, `required_accessory` of `physical_specs_required` zijn inhoudelijke intenties. Ze mogen later niet automatisch als nieuwe database-enums worden toegevoegd.

---

## 1. Waar we staan in het plan

Afgeronde baselines:

- Fase 0 — Stroomuitval: `v0.1.0-stroomuitval-baseline`
- Fase 1 — Drinkwaterzekerheid: `v0.2.0-drinkwater-baseline`
- Fase 2 — Voedsel & voedselbereiding: `v0.3.0-voedsel-bereiding-baseline`
- Fase 3 — Hygiëne, sanitatie & afval: `v0.4.0-hygiene-sanitatie-baseline`
- Fase 4 — EHBO & persoonlijke zorg: `v0.5.0-ehbo-baseline`
- Fase 5 — Warmte, droog blijven & shelter-light: `v0.6.0-warmte-droog-shelter-light-baseline`

Nu te specificeren en daarna end-to-end te implementeren:

```text
Fase 6 — Contentbatch 7 Evacuatie & documenten
```

Deze fase voegt een smalle, MVP-gerichte evacuatie-add-on toe. De kern is niet “een vluchtpakket als handmatige bundel”, maar aantoonbaar borgen dat het systeem scenario-gedreven een compacte, uitlegbare set kan genereren voor snel vertrekken, documenten beschermen, onderweg zichtbaar/signaliseerbaar zijn, basislicht onderweg en drinkwater meenemen.

Belangrijk uitgangspunt:

> Een evacuatietas is een container en draagoplossing, niet de waarheid van het pakket. De inhoud ontstaat via scenario’s, needs, productregels, quantity policies en item candidates.

En:

> Documenten, contacten, medicatie en persoonlijke zaken worden primair als taken/checks behandeld, niet als generieke producten die voor iedereen automatisch verkocht worden.

---

## 2. Doel van Fase 6

Fase 6 moet bewijzen dat het model een frontstage add-on **Evacuatie** aankan zonder te vervallen in directe itembundels.

Deze batch test specifiek:

- add-on `evacuatie` als commerciële/frontstage add-on;
- scenarioactivatie door add-on;
- evacuatietas als container/draagoplossing, niet als pakketwaarheid;
- documentveiligheid;
- signalering;
- zichtbaarheid onderweg;
- licht onderweg, met hergebruik van bestaande stroomuitval-items waar passend;
- drinkwater onderweg, met hergebruik van bestaande drinkwater-items waar passend;
- tasks voor documenten, contacten en persoonlijke zaken;
- physical/packability-informatie waar het bestaande schema dat ondersteunt;
- cross-batch reuse/deduplicatie;
- Basis versus Basis+ itemkeuzes;
- uitlegbare coverage, sources, warnings en QA.

---

## 3. Niet-doen-lijst

Deze fase doet expliciet niet:

- geen checkout;
- geen klantaccounts;
- geen auth;
- geen betaalflow;
- geen externe leverancierintegraties;
- geen echte voorraadreservering;
- geen volledige survival-/bug-out-batch;
- geen volledige sheltermodule;
- geen volledige navigatie-/communicatiemodule;
- geen volledige baby-/huisdier-evacuatiemodule;
- geen persoonlijke medicatieproducten;
- geen geld/identiteitsdocumenten als productverkoop;
- geen schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen directe package → item koppeling;
- geen directe add-on → item koppeling;
- geen klantgerichte replacement-flow;
- geen approved replacements.

---

## 4. Add-on

Specificatiecode:

```text
ADDON-EVACUATION-DOCUMENTS
```

Voorgestelde definitieve slug:

```text
evacuatie
```

Motivatie:

- dit is een frontstage/commerciële add-on in de MVP;
- het sluit aan op de roadmapnaam “Evacuatie”;
- documenten, signalering, licht en drinkwater onderweg zijn scenario’s binnen deze add-on;
- een korte slug is klant- en URL-vriendelijker dan `evacuatie_documenten`.

Alternatieve slug indien bestaande databaseconventie dat vereist:

```text
evacuatie_documenten
```

De add-on mag later alleen scenario’s activeren. De add-on mag nooit direct aan items, productvarianten of item candidates gekoppeld worden.

---

## 5. Scenario’s

| Specificatiecode | Voorlopige slugrichting | Doel | Scope |
|---|---|---|---|
| `SCN-EVAC-READY-HOME-72H` | `evacuatiegereed-thuis-72u` | Snel kunnen vertrekken met basisdragers en kernspullen. | Evacuatietas/container, packability, basisgereedheid. |
| `SCN-DOCUMENT-SAFETY-EVAC` | `documentveiligheid-evacuatie` | Belangrijke documenten waterbestendig meenemen. | Documentenmap + documenttasks. |
| `SCN-SIGNALING-EVAC` | `signalering-evacuatie` | Aandacht kunnen trekken en zichtbaar blijven onderweg. | Noodfluit, reflectie. |
| `SCN-LIGHT-ON-THE-MOVE-EVAC` | `licht-onderweg-evacuatie` | Praktisch licht onderweg. | Hoofdlamp/zaklamp, hergebruik stroomuitval. |
| `SCN-WATER-ON-THE-MOVE-EVAC` | `drinkwater-onderweg-evacuatie` | Drinkwater meenemen tijdens verplaatsing. | Drinkfles/filterfles, hergebruik drinkwater. |
| `SCN-PERSONAL-READINESS-EVAC` | `persoonlijke-gereedheid-evacuatie` | Niet-productmatige persoonlijke checks. | Contacten, medicatie, documenten, sleutels, cash als taken/checks. |

### Scenario-nuances

- De evacuatietas is geen pakketwaarheid en mag geen inhoudscoverage claimen.
- Documenten zelf worden niet verkocht; alleen een documentenmap kan productregel zijn.
- Een noodfluit garandeert geen redding of bereik.
- Reflectie verhoogt zichtbaarheid, maar garandeert geen veiligheid.
- Licht onderweg is niet hetzelfde als ruimteverlichting thuis.
- Drinkfles/filterfles vervangt geen thuisvoorraad.
- Persoonlijke medicatie, contacten en sleutels zijn tasks/checks, geen productregels.

---

## 6. Needs

| Specificatiecode | Voorlopige slugrichting | Doel | Kernvraag |
|---|---|---|---|
| `NEED-EVAC-BAG-CARRY` | `evacuatietas-dragen` | Kernspullen kunnen dragen. | Is er een geschikte tas/container? |
| `NEED-DOCUMENT-PROTECTION` | `documenten-beschermen` | Documenten waterbestendig organiseren. | Is er een documentenmap? |
| `NEED-DOCUMENT-TASKS` | `documenten-checklist` | Documenten inhoudelijk voorbereiden. | Zijn documenttaken zichtbaar? |
| `NEED-SIGNALING-AUDIBLE` | `hoorbaar-signaleren` | Aandacht trekken. | Is er een noodfluit? |
| `NEED-VISIBILITY-ON-THE-MOVE` | `zichtbaar-onderweg` | Zichtbaarheid onderweg. | Is reflectie aanwezig? |
| `NEED-LIGHT-ON-THE-MOVE` | `licht-onderweg` | Praktisch licht onderweg. | Is handsfree of draagbaar licht aanwezig? |
| `NEED-WATER-CARRY-EVAC` | `drinkwater-meenemen-evacuatie` | Water meenemen. | Is er een drinkfles/filterfles? |
| `NEED-PERSONAL-READINESS-TASKS` | `persoonlijke-gereedheid-checks` | Niet-productmatige persoonlijke acties. | Zijn checks voor contacten/medicatie/sleutels zichtbaar? |

Task-only needs genereren geen productregels, maar horen zichtbaar te worden via bestaande task/checklistmechaniek of content-only notes.

---

## 7. Capabilities

| Specificatiecode | Voorlopige slugrichting | Omschrijving | Mag primary sufficient zijn? |
|---|---|---|---|
| `CAP-EVAC-BAG-CARRY` | `evacuatietas-gebruiken` | Spullen kunnen dragen/inpakken. | Ja, alleen voor carry/packability. |
| `CAP-DOCUMENT-WATERPROOF-STORAGE` | `documenten-waterdicht-bewaren` | Documenten beschermd bewaren. | Ja, voor documentbescherming. |
| `CAP-DOCUMENT-CHECKLIST` | `documenten-checklist-bijhouden` | Documenten inhoudelijk voorbereiden. | Task-only, geen productcoverage. |
| `CAP-AUDIBLE-SIGNALING` | `hoorbaar-signaleren` | Noodfluit/signaalmiddel. | Ja, voor hoorbare signalering. |
| `CAP-VISIBILITY-REFLECTIVE` | `reflecterend-zichtbaar-zijn` | Reflecterende zichtbaarheid. | Ja/secondary, geen veiligheidsgarantie. |
| `CAP-HANDS-FREE-LIGHT` | `handsfree-licht-onderweg` | Hoofdlamp/handsfree licht. | Ja, voor licht onderweg. |
| `CAP-PORTABLE-LIGHT` | `draagbaar-licht-onderweg` | Zaklamp/draagbaar licht. | Ja/secondary, afhankelijk itemkeuze. |
| `CAP-WATER-CARRY` | `drinkwater-meenemen` | Drinkwater meenemen. | Ja, voor onderweg meenemen. |
| `CAP-WATER-FILTER-CARRY-BACKUP` | `water-filteren-onderweg-backup` | Filterfunctie onderweg volgens productspecificatie. | Backup/secondary. |
| `CAP-PERSONAL-READINESS-CHECKLIST` | `persoonlijke-gereedheid-checklist` | Contacten, medicatie, sleutels, cash als checks. | Task-only, geen productcoverage. |

Governance:

- Evacuatietas mag geen dekking geven voor water, licht, documenten of EHBO-inhoud.
- Documentenmap mag documenttasks niet vervangen.
- Noodfluit garandeert geen bereik of redding.
- Reflectie garandeert geen verkeersveiligheid.
- Drinkfles dekt water meenemen, niet waterzuivering of voorraad.
- Filterfles is supporting/backup, geen universeel veilig water.

---

## 8. Scenario capability policies

| Scenario | Need | Required capabilities | Sterkte | Opmerking |
|---|---|---|---|---|
| `SCN-EVAC-READY-HOME-72H` | `NEED-EVAC-BAG-CARRY` | `CAP-EVAC-BAG-CARRY` | Primary | Tas/container, geen inhoudscoverage. |
| `SCN-DOCUMENT-SAFETY-EVAC` | `NEED-DOCUMENT-PROTECTION` | `CAP-DOCUMENT-WATERPROOF-STORAGE` | Primary | Documentenmap. |
| `SCN-DOCUMENT-SAFETY-EVAC` | `NEED-DOCUMENT-TASKS` | `CAP-DOCUMENT-CHECKLIST` | Task-only | Geen productline. |
| `SCN-SIGNALING-EVAC` | `NEED-SIGNALING-AUDIBLE` | `CAP-AUDIBLE-SIGNALING` | Primary | Noodfluit. |
| `SCN-SIGNALING-EVAC` | `NEED-VISIBILITY-ON-THE-MOVE` | `CAP-VISIBILITY-REFLECTIVE` | Primary/secondary | Reflectie. |
| `SCN-LIGHT-ON-THE-MOVE-EVAC` | `NEED-LIGHT-ON-THE-MOVE` | `CAP-HANDS-FREE-LIGHT` of `CAP-PORTABLE-LIGHT` | Primary | Hoofdlamp heeft voorkeur. |
| `SCN-WATER-ON-THE-MOVE-EVAC` | `NEED-WATER-CARRY-EVAC` | `CAP-WATER-CARRY` | Primary | Drinkfles/filterfles. |
| `SCN-WATER-ON-THE-MOVE-EVAC` | `NEED-WATER-CARRY-EVAC` | `CAP-WATER-FILTER-CARRY-BACKUP` | Secondary/backup | Plus/filterfunctie. |
| `SCN-PERSONAL-READINESS-EVAC` | `NEED-PERSONAL-READINESS-TASKS` | `CAP-PERSONAL-READINESS-CHECKLIST` | Task-only | Contacten, medicatie, sleutels, cash/checks. |

---

## 9. Producttypes

| Specificatiecode | Voorlopige slugrichting | Rol | Opmerking |
|---|---|---|---|
| `PTYPE-EVAC-BAG` | `evacuatietas` | Core/container | Draagoplossing, niet inhoudswaarheid. |
| `PTYPE-WATERPROOF-DOC-FOLDER` | `waterdichte-documentenmap` | Core | Documentbescherming. |
| `PTYPE-WHISTLE` | `noodfluit` | Core | Hoorbare signalering. |
| `PTYPE-REFLECTIVE-VISIBILITY` | `reflectievest` | Core/supporting | Zichtbaarheid onderweg. |
| `PTYPE-HEADLAMP` | `hoofdlamp` | Core/reuse | Hergebruik uit stroomuitval indien bestaand. |
| `PTYPE-FLASHLIGHT` | `zaklamp` | Alternative/supporting | Alleen als bestaande patronen dit verkiezen. |
| `PTYPE-WATER-BOTTLE` | `drinkfles` | Core/reuse | Hergebruik uit drinkwater. |
| `PTYPE-FILTER-BOTTLE` | `filterfles` | Plus/supporting | Hergebruik uit drinkwater, filterfunctie backup. |

Niet toevoegen als producttype: documenten zelf, identiteitsbewijs, verzekeringspapieren, persoonlijke medicatie, cash, sleutels of contactpersonen.

---

## 10. Productvarianten en conceptitems

### Basis

| Producttype | Variant-intentie | Conceptitem |
|---|---|---|
| `evacuatietas` | eenvoudige evacuatietas/rugzak | `IOE-EVAC-BAG-BASIC` |
| `waterdichte-documentenmap` | basis documentenmap | `IOE-DOC-FOLDER-BASIC` |
| `noodfluit` | basis noodfluit | `IOE-WHISTLE-BASIC` |
| `reflectievest` | basis reflectie | `IOE-REFLECTIVE-VEST-BASIC` |
| `hoofdlamp` | hergebruik basis hoofdlamp | `IOE-HEADLAMP-AAA-BASIC` of bestaande mapping |
| `drinkfles` | hergebruik basis drinkfles | `IOE-BOTTLE-1L-BASIC` of bestaande mapping |

### Basis+

| Producttype | Variant-intentie | Conceptitem |
|---|---|---|
| `evacuatietas` | robuustere tas/betere draagbaarheid | `IOE-EVAC-BAG-PLUS` |
| `waterdichte-documentenmap` | robuustere documentenmap | `IOE-DOC-FOLDER-PLUS` |
| `noodfluit` | robuuster signaalmiddel | `IOE-WHISTLE-PLUS` |
| `reflectievest` | betere zichtbaarheid | `IOE-REFLECTIVE-VEST-PLUS` |
| `hoofdlamp` | hergebruik Basis+ hoofdlamp | `IOE-HEADLAMP-AAA-PLUS` of bestaande mapping |
| `drinkfles` | hergebruik Basis+ drinkfles | `IOE-BOTTLE-1L-PLUS` of bestaande mapping |
| `filterfles` | supporting/backup filterfunctie | `IOE-FILTERBOTTLE-PLUS` indien bestaand |

Basis+ betekent betere scenariofit, robuustere uitvoering en minder zwakke schakels, niet simpelweg meer spullen.

---

## 11. Productregels

| Scenario | Need | Producttype | Rol-intentie | Tiergedrag |
|---|---|---|---|---|
| Evacuatiegereedheid | `evacuatietas-dragen` | `evacuatietas` | Core/container | Basis/Basis+ eigen variant. |
| Documentveiligheid | `documenten-beschermen` | `waterdichte-documentenmap` | Core | Basis/Basis+ eigen variant. |
| Documentveiligheid | `documenten-checklist` | task/checklist | Task-only | Geen productregel. |
| Signalering | `hoorbaar-signaleren` | `noodfluit` | Core | Basis/Basis+ eigen variant. |
| Signalering | `zichtbaar-onderweg` | `reflectievest` | Core/supporting | Basis/Basis+ eigen variant. |
| Licht onderweg | `licht-onderweg` | `hoofdlamp` | Core/reuse | Hergebruik bestaande candidates. |
| Drinkwater onderweg | `drinkwater-meenemen-evacuatie` | `drinkfles` | Core/reuse | Hergebruik bestaande candidates. |
| Drinkwater onderweg | `drinkwater-meenemen-evacuatie` | `filterfles` | Supporting/backup Plus | Plus only indien bestaand. |
| Persoonlijke gereedheid | `persoonlijke-gereedheid-checks` | task/checklist | Task-only | Geen productregel. |

---

## 12. Quantity policies

Conceptuele policies die later naar bestaande schemawaarden worden gemapt:

| Conceptterm | Betekenis | Mapping-intentie later |
|---|---|---|
| `one_per_household` | Eén item per huishouden. | Bestaande fixed policy met `base_amount = 1`. |
| `per_person` | Eén item per persoon. | Bestaande `per_person` indien aanwezig; anders schema-veilig alternatief. |
| `reuse_existing_quantity` | Hergebruik bestaand patroon. | Bestaande quantity policy van stroomuitval/drinkwater waar passend. |
| `basis_plus_supporting_only` | Alleen Basis+ supporting line. | Tier/productvariant/candidate mapping. |
| `task_only` | Geen productquantity. | preparedness_task/content_only/notes. |

POC-aannames bij 2 volwassenen / 72 uur:

| Producttype | Quantity-intentie | POC-richting |
|---|---|---|
| Evacuatietas | `one_per_household` | 1 |
| Documentenmap | `one_per_household` | 1 |
| Noodfluit | `per_person` of fixed POC | 2 bij per_person, of 1 als huidig beleid dat beperkt |
| Reflectie | `per_person` of fixed POC | 2 bij per_person, of 1 set |
| Hoofdlamp | `per_person` of hergebruik stroomuitval | 2 of bestaande policy |
| Drinkfles | `per_person` of hergebruik drinkwater | 2 of bestaande policy |
| Filterfles Plus | Basis+ supporting | 1 of bestaand patroon |
| Document/persoonlijke checks | task_only | 0 productregels |

Voeg geen nieuwe quantity formula enum toe.

---

## 13. Accessoire requirements

Deze batch probeert accessoireketens bewust beperkt te houden.

| Parent/context | Required producttype | Reden | Opmerking |
|---|---|---|---|
| Evacuatietas | geen standaard item-inhoud | Tas is geen pakketwaarheid. | Geen bag → all contents accessoireketen. |
| Documentenmap | geen documentitems | Documenten zijn tasks. | Geen documenten als product. |
| Hoofdlamp | batterijen indien bestaande accessoireketen dit al doet | Hergebruik stroomuitval. | Niet dupliceren. |
| Drinkfles/filterfles | geen thuisvoorraad | Drinkwater onderweg. | Thuisopslag blijft drinkwaterbatch. |

Niet toegestaan:

```text
evacuatietas -> documentenmap
evacuatietas -> fluit
evacuatietas -> licht
evacuatietas -> waterfles
evacuatietas -> alle inhoud
```

---

## 14. Preparedness tasks

Minimaal gewenste tasks/checks:

| Task slug | Doel | Product? |
|---|---|---|
| `documenten-kopieren-en-bundelen` | Kopieën/scan van ID, verzekering, noodnummers voorbereiden. | Nee |
| `noodcontacten-noteren` | Contactgegevens offline beschikbaar maken. | Nee |
| `persoonlijke-medicatie-inpakken-check` | Eigen medicatie/voorschriften controleren en zelf toevoegen. | Nee |
| `sleutels-cash-en-laders-check` | Sleutels, kleine cash, laders/persoonlijke items checken. | Nee |
| `evacuatietas-periodiek-controleren` | Inhoud, gewicht en houdbaarheid periodiek controleren. | Nee |

Gebruik bestaande task/checklistmechaniek indien aanwezig. Als task-output nog beperkt is, gebruik bestaande `preparedness_task` of content_only/notes zonder schemawijziging.

---

## 15. Claim governance

Algemene norm:

> Evacuatieproducten ondersteunen voorbereiding en praktisch handelen, maar garanderen geen veilige evacuatie, redding of bescherming tegen alle omstandigheden.

Governance per domein:

| Domein | Governance-regel |
|---|---|
| Evacuatietas | Container/draagoplossing; garandeert niet dat alle benodigde inhoud aanwezig is. |
| Documentenmap | Beschermt documenten praktisch; documenten moeten zelf voorbereid worden. |
| Noodfluit | Ondersteunt hoorbare signalering; garandeert geen redding of bereik. |
| Reflectie | Verhoogt zichtbaarheid; garandeert geen verkeersveiligheid. |
| Hoofdlamp | Ondersteunt licht onderweg; batterijstatus controleren. |
| Drinkfles | Ondersteunt meenemen van drinkwater; vervangt geen voorraad. |
| Filterfles | Filterfunctie volgens productinstructie; geen universele waterveiligheidsclaim. |
| Tasks | Persoonlijke zaken blijven verantwoordelijkheid van gebruiker en worden niet als product verkocht. |

Verboden public explanation claims:

- garandeert veilige evacuatie;
- alles wat je nodig hebt zit in de tas;
- waterdicht onder alle omstandigheden zonder productspecificatie;
- garandeert redding;
- maakt je altijd zichtbaar;
- filtert elk water veilig;
- vervangt officiële instructies;
- persoonlijke medicatie is automatisch geregeld;
- documenten zijn automatisch compleet.

---

## 16. Usage constraints

Conceptuele constraints die later naar bestaande constraints/notes worden gemapt:

| Conceptterm | Betekenis | Voorbeelden |
|---|---|---|
| `check_batteries` | Batterijen/accu controleren. | Hoofdlamp. |
| `not_full_evacuation_guarantee` | Geen evacuatiegarantie. | Tas/add-on uitleg. |
| `document_privacy` | Gevoelige documenten beschermen. | Documentenmap/tasks. |
| `follow_authorities` | Officiële instructies volgen. | Algemene evacuatiecontext. |
| `visibility_not_guaranteed` | Reflectie garandeert veiligheid niet. | Reflectievest. |
| `filter_limitations` | Filter volgens productspecificatie. | Filterfles. |
| `pack_weight_warning` | Gewicht praktisch houden. | Evacuatietas. |
| `keep_documents_updated` | Documenten periodiek actualiseren. | Task/check. |

Geen nieuwe constraint-enums toevoegen. Gebruik bestaande constraints, notes of public/internal warnings.

---

## 17. Public explanation templates

**Evacuatietas**  
Deze evacuatietas is toegevoegd als praktische draagoplossing voor vertrek. De tas is een container: de inhoud wordt apart bepaald door scenario’s zoals documenten, licht, water en signalering.

**Documentenmap**  
Deze documentenmap is toegevoegd om belangrijke papieren praktisch beschermd en gebundeld mee te kunnen nemen. De documenten zelf moet je actueel houden en zelf toevoegen.

**Noodfluit**  
Deze noodfluit is toegevoegd als eenvoudig signaalmiddel. Hij kan helpen aandacht te trekken, maar garandeert geen bereik, reactie of redding.

**Reflectie**  
Deze reflectie-oplossing is toegevoegd om je zichtbaarheid onderweg te ondersteunen. Reflectie vergroot zichtbaarheid, maar garandeert geen verkeersveiligheid.

**Licht onderweg**  
Deze lichtoplossing is toegevoegd voor praktisch licht onderweg. Controleer batterijen of laadstatus periodiek.

**Drinkwater onderweg**  
Deze drinkfles is toegevoegd zodat je drinkwater praktisch kunt meenemen. Dit vervangt geen thuisvoorraad.

**Filterfles**  
Deze filterfles ondersteunt water meenemen en filteren volgens productspecificatie. De filterfunctie is ondersteunend en maakt niet elk water automatisch veilig.

**Taken/checks**  
Deze checklistpunten zijn toegevoegd omdat sommige evacuatiezaken persoonlijk zijn. Ze worden niet als generiek product verkocht, maar moeten wel bewust voorbereid worden.

---

## 18. Expected output Basis

Voor:

```text
addon=evacuatie
tier=basis
```

moet Basis minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie | Reden |
|---|---|---|---|
| Evacuatietas | `IOE-EVAC-BAG-BASIC` | Core/container | Spullen kunnen dragen/inpakken. |
| Documentenmap | `IOE-DOC-FOLDER-BASIC` | Core | Documenten beschermd meenemen. |
| Noodfluit | `IOE-WHISTLE-BASIC` | Core | Hoorbaar signaleren. |
| Reflectie | `IOE-REFLECTIVE-VEST-BASIC` | Core/supporting | Zichtbaar onderweg. |
| Licht onderweg | `IOE-HEADLAMP-AAA-BASIC` of bestaande mapping | Core/reuse | Handsfree licht onderweg. |
| Drinkwater meenemen | `IOE-BOTTLE-1L-BASIC` of bestaande mapping | Core/reuse | Water meenemen. |
| Document/persoonlijke checks | tasks | Task-only | Documenten/contacten/medicatiechecks. |

---

## 19. Expected output Basis+

Voor:

```text
addon=evacuatie
tier=basis_plus
```

moet Basis+ minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie | Reden |
|---|---|---|---|
| Evacuatietas | `IOE-EVAC-BAG-PLUS` | Core/container | Betere draagbaarheid/fit. |
| Documentenmap | `IOE-DOC-FOLDER-PLUS` | Core | Robuustere documentbescherming. |
| Noodfluit | `IOE-WHISTLE-PLUS` | Core | Robuuster signaalmiddel. |
| Reflectie | `IOE-REFLECTIVE-VEST-PLUS` | Core/supporting | Betere zichtbaarheid. |
| Licht onderweg | `IOE-HEADLAMP-AAA-PLUS` of bestaande mapping | Core/reuse | Betere handsfree lichtoplossing. |
| Drinkwater meenemen | `IOE-BOTTLE-1L-PLUS` of bestaande mapping | Core/reuse | Water meenemen. |
| Filterfles | `IOE-FILTERBOTTLE-PLUS` | Supporting/backup | Extra onderweg-waterbehandeling volgens specificatie. |
| Document/persoonlijke checks | tasks | Task-only | Persoonlijke voorbereiding. |

---

## 20. Coveragecriteria

Een output is voldoende als:

1. Evacuatietas/draagoplossing is afgedekt.
2. Documentbescherming is afgedekt.
3. Documenttasks zijn zichtbaar als tasks/checks.
4. Hoorbare signalering is afgedekt.
5. Zichtbaarheid onderweg is afgedekt.
6. Licht onderweg is afgedekt.
7. Drinkwater meenemen is afgedekt.
8. Filterfunctie is alleen supporting/backup indien aanwezig.
9. Tas claimt geen inhoudsdekking.
10. Geen persoonlijke documenten/medicatie/cash/sleutels als productregels worden gegenereerd.
11. Elke generated line heeft source.
12. Cross-batch reuse/deduplicatie werkt waar items al bestaan.
13. QA blocking blijft 0.

---

## 21. Sourcecriteria

- Elke generated line heeft minimaal één source.
- Core lines zijn herleidbaar naar scenario_need en product_rule.
- Reuse items behouden hun eigen sources.
- Multi-source items kunnen meerdere sources tonen bij combinatie-add-ons.
- Tasks zijn herleidbaar naar scenario_need/need waar bestaande taskmechaniek dit ondersteunt.
- POC-aannames worden vastgelegd in internal explanation of notes.
- Supplier-offer informatie blijft binnen bestaande velden.
- Geen supplier_offer schema-uitbreiding.
- Geen direct package/add-on → item source.

---

## 22. QA-criteria

De implementatie moet minimaal voldoen aan:

- QA blocking = 0.
- Geen active scenario zonder needs.
- Geen active needs zonder capabilities.
- Geen scenario needs zonder product rules, behalve expliciet content_only/task-only needs als bestaande QA dit toestaat.
- Geen active items zonder capabilities.
- Geen required accessories zonder candidate item.
- Geen producttype mismatch.
- Geen generated lines zonder sources.
- Geen generated line producttype mismatch.
- Geen directe add-on/package → item koppeling.
- Geen tas die alle inhoud als accessoire genereert.
- Geen document/medicatie/cash productitems.
- Geen overclaims rond redding, veiligheid, filteren of evacuatiegarantie.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer schema-uitbreiding.

---

## 23. Engine-aanpassingen — inhoudelijke verwachting

De engine moet later minimaal ondersteunen of aantoonbaar hergebruiken:

- add-on `evacuatie`;
- scenarioactivatie via add-on;
- fixed household quantities;
- per-person quantities of schema-veilig alternatief;
- reuse/deduplicatie van bestaande headlamp/drinkfles/filterfles;
- task-output naast producten;
- physical/packability notes/specs waar bestaand;
- supporting/backup role-afleiding;
- public explanations per itemtype;
- QA-controle op generated sources en overclaims.

Niet doen:

- geen hardcoded add-on → item mapping;
- tas mag geen directe parent van alle inhoud worden;
- taken genereren geen productregels;
- bestaande regressions blijven groen.

---

## 24. Interne webapp-aanpassing — inhoudelijke verwachting

De interne webapp moet later minimaal ondersteunen:

```text
addon=evacuatie
tier=basis
tier=basis_plus
```

De webapp moet tonen:

- core evacuatie/document/signaling/water/light regels;
- reused items;
- supporting/backup filterfles;
- tasks;
- quantities;
- sources;
- coverage;
- usage warnings;
- governance notes;
- QA-resultaat;
- verschil tussen Basis en Basis+.

Geen klantgerichte checkout, account of betaalflow bouwen.

---

## 25. Regression test — inhoudelijke specificatie

De latere regression krijgt vermoedelijk:

```text
regression_evacuatie_poc.js
npm run test:evacuatie-poc
```

De regression moet minimaal valideren:

1. `addon=evacuatie` werkt voor `tier=basis`.
2. `addon=evacuatie` werkt voor `tier=basis_plus`.
3. Basis-output bevat evacuatietas.
4. Basis+-output bevat evacuatietas.
5. Evacuatietas claimt alleen draag/packability, geen inhoudscoverage.
6. Basis-output bevat documentenmap.
7. Basis+-output bevat documentenmap.
8. Documenttasks zijn zichtbaar en genereren geen documentproducten.
9. Basis-output bevat noodfluit.
10. Basis+-output bevat noodfluit.
11. Zichtbaarheid/reflectie is afgedekt.
12. Licht onderweg is afgedekt.
13. Drinkwater meenemen is afgedekt.
14. Basis+ bevat filterfles of mapping legt expliciet uit waarom niet.
15. Filterfles is supporting/backup en vervangt geen waterbasis.
16. Geen persoonlijke medicatie/documenten/cash/sleutels als productitems.
17. Geen overclaims rond veilige evacuatie, redding, zichtbaarheid of universele waterfiltering.
18. Usage constraints/governance zijn aanwezig.
19. QA generated lines without sources = 0.
20. QA generated line producttype mismatch = 0.
21. QA blocking = 0.
22. Alle eerdere regressions blijven groen.
23. `npm run test:evacuatie-poc` is groen.

Optioneel maar gewenst:

- combo-run `addon_slugs=['evacuatie','drinkwater']` toont dedupe of correcte multiple sources voor drinkfles/filterfles;
- combo-run `addon_slugs=['evacuatie','stroomuitval']` toont dedupe of correcte multiple sources voor headlamp.

---

## 26. Release note — toekomstige baseline

Later moet bij afronding een release note worden toegevoegd voor:

```text
v0.7.0-evacuatie-baseline
```

Voorkeursbestandsnaam:

```text
release_note_v0.7.0_evacuatie_baseline.md
```

---

## 27. Fase-afrondingscriteria

Fase 6 is technisch pas afgerond als:

- deze specificatie is opgenomen;
- implementation mapping is opgenomen;
- mapping-check vóór implementatie is uitgevoerd;
- seed draait zonder schemawijzigingen;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen supplier_offer schema-uitbreiding is gedaan;
- geen Directus composite-PK wijziging is gedaan;
- add-on activeert scenario’s;
- geen directe add-on/package → item koppeling bestaat;
- tas blijft container, niet pakketwaarheid;
- documenttasks bestaan naast producten;
- licht en water reuse klopt;
- filterfles blijft supporting/backup;
- usage constraints zichtbaar zijn;
- QA blocking = 0;
- regressions groen zijn:
  - `npm run test:stroomuitval-poc`;
  - `npm run test:drinkwater-poc`;
  - `npm run test:voedsel-poc`;
  - `npm run test:hygiene-sanitatie-poc`;
  - `npm run test:ehbo-poc`;
  - `npm run test:warmte-droog-shelter-poc`;
  - `npm run test:evacuatie-poc`;
- interne webapp toont evacuatieoutput correct;
- release note aanwezig is;
- commit en tag pas na volledige validatie zijn gezet.

---

## 28. Samenvatting voor review

Deze specificatie definieert Contentbatch 7 als MVP-gerichte evacuatiebaseline voor:

- evacuatietas/draagbaarheid;
- documentbescherming;
- document- en persoonlijke readiness-tasks;
- signalering;
- zichtbaarheid;
- licht onderweg;
- drinkwater meenemen;
- filterfles als Plus-supporting/backup;
- cross-batch reuse;
- governance tegen evacuatie-, veiligheid- en filteroverclaims.

De aanbevolen add-on slug is:

```text
evacuatie
```

De beoogde baseline na implementatie is:

```text
v0.7.0-evacuatie-baseline
```
