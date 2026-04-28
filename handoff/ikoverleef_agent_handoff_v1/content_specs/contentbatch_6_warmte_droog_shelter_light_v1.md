# contentbatch_6_warmte_droog_shelter_light_v1.md

**Project:** Ik overleef  
**Fase:** Fase 5 — Contentbatch 6 Warmte, droog blijven & shelter-light  
**Documenttype:** Inhoudelijke specificatie  
**Status:** Specificatie v1 — klaar voor inhoudelijke review, nog niet zelfstandig implementatieklaar  
**Datum:** 2026-04-28  
**Vorige formele baseline:** `v0.5.0-ehbo-baseline`  
**Beoogde volgende baseline:** `v0.6.0-warmte-droog-shelter-light-baseline`  
**Nog vereist vóór implementatie:** `contentbatch_6_warmte_droog_shelter_light_implementation_mapping.md`

---

## 0. Harde scope- en governance-opmerking

Dit document is de inhoudelijke specificatie voor Contentbatch 6. Het is geen losse implementatieopdracht.

De vaste werkwijze blijft:

1. Eerst inhoudelijke specificatie.
2. Daarna expliciete implementatie-mapping naar het bestaande schema.
3. Pas daarna seed/engine/webapp/regression implementeren.
4. Geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen zonder expliciete toestemming.
5. Database-first blijven.
6. Packages en add-ons nooit direct aan items koppelen.
7. Packages en add-ons activeren scenario's.
8. Scenario's leiden via needs, capabilities, productregels, quantity policies, productvarianten, item candidates, accessoire requirements, generated package lines, sources, coverage en QA tot output.
9. Bestaande slugs, enumwaarden, QA-views en engineconcepten blijven leidend.

Termen in dit document zoals `backup warmth`, `supporting shelter`, `environmental_warning`, `suffocation_warning`, `weather_exposure_limit`, `required_accessory` of `shelter_light` zijn inhoudelijke intenties. Ze mogen later niet automatisch als nieuwe database-enums worden toegevoegd. Het latere mappingdocument bepaalt hoe deze intenties op bestaande schemawaarden, notes, explanations, governancevelden of usage constraints worden gemapt.

---

## 1. Waar we staan in het plan

Afgerond:

- Fase 0 — Stroomuitval baseline: `v0.1.0-stroomuitval-baseline`
- Fase 1 — Drinkwaterzekerheid baseline: `v0.2.0-drinkwater-baseline`
- Fase 2 — Voedsel & voedselbereiding baseline: `v0.3.0-voedsel-bereiding-baseline`
- Fase 3 — Hygiëne, sanitatie & afval baseline: `v0.4.0-hygiene-sanitatie-baseline`
- Fase 4 — EHBO & persoonlijke zorg baseline: `v0.5.0-ehbo-baseline`

Nu:

**Fase 5 — Contentbatch 6 Warmte, droog blijven & shelter-light**

Deze fase voorkomt dat warmte, regenbescherming, nooddekens, poncho's, tarps en slaap-/shelterclaims door elkaar gaan lopen.

Belangrijk uitgangspunt:

> Warm blijven, droog blijven en tijdelijk beschut blijven zijn verwante maar verschillende behoeften. Een nooddeken is geen slaapcomfort, een poncho is geen onderkomen, en een tarp is geen warmtebron.

---

## 2. Doel van Fase 5

Fase 5 moet bewijzen dat het model om kan gaan met omgevings- en gebruikscontext zonder overclaims.

De fase test specifiek:

- warmtebehoud;
- backup-warmte via nooddeken/noodfolie;
- droog blijven bij regen;
- shelter-light / tijdelijke beschutting;
- accessoireketens voor tarp/bevestiging;
- per-persoon quantities voor draagbare persoonlijke bescherming;
- one-per-household quantities voor shelter-light;
- environmental/governance warnings;
- Basis versus Basis+ itemkeuzes;
- regressions over alle eerdere batches plus warmte/droog/shelter-light.

---

## 3. Niet-doen-lijst

Deze fase doet expliciet niet:

- geen checkout;
- geen klantaccounts;
- geen auth;
- geen betaalflow;
- geen externe leverancierintegraties;
- geen echte voorraadreservering;
- geen volledige evacuatiebatch;
- geen volledige shelter/slaapmodule;
- geen tent-/slaapzak-/matrassenbatch;
- geen hypothermiebehandeling of medisch advies;
- geen baby-/huisdier-specifieke warmte-aanpassing;
- geen kledingmaat-/maatvoeringpersonaliseringsmodule;
- geen nieuwe schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen directe package → item koppeling;
- geen directe add-on → item koppeling;
- geen approved replacements;
- geen automatische inkoop- of voorraadlogica.

---

## 4. Add-on

### 4.1 Specificatiecode

```text
ADDON-WARMTH-DRY-SHELTER-LIGHT
```

Deze code is geen database-slug.

### 4.2 Voorlopige slug-aanbeveling

Voorkeurslug voor het latere mappingdocument:

```text
warmte_droog_shelter_light
```

Alternatief, als kortere slugs verplicht blijken:

```text
warmte_droog
```

Advies: kies `warmte_droog_shelter_light`, omdat shelter-light expliciet onderdeel is van deze batch, maar nog geen volledige shelter/evacuatiebatch is.

### 4.3 Architectuurregel

De add-on mag alleen scenario's activeren. De add-on mag nooit direct aan items, productvarianten of item candidates gekoppeld worden.

Gewenste flow:

```text
addon=warmte_droog_shelter_light
→ scenario's
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

## 5. Scenario's

| Specificatiecode | Voorlopige slugrichting | Doel | Scope |
|---|---|---|---|
| `SCN-WARMTH-72H-HOME` | `warmtebehoud-thuis-72u` | Warmte behouden bij verstoring thuis. | Warme deken, nooddeken als backup. |
| `SCN-DRY-STAY-72H-HOME` | `droog-blijven-thuis-72u` | Persoonlijke regen-/vochtbescherming. | Poncho/regenbescherming. |
| `SCN-SHELTER-LIGHT-72H-HOME` | `beschutting-light-thuis-72u` | Tijdelijke lichte beschutting/afscherming. | Tarp-light, bevestiging, grond-/vochtbarrière optioneel. |

### 5.1 Scenario: warmtebehoud

Een huishouden moet bij kou of verwarmingsuitval basale warmte kunnen behouden. Dit is geen medische behandeling bij onderkoeling.

### 5.2 Scenario: droog blijven

Een gebruiker moet zich bij regen of natte omstandigheden eenvoudig droog kunnen houden. Een poncho is persoonlijke regenbescherming, geen volwaardige shelter.

### 5.3 Scenario: shelter-light

Een huishouden moet lichte tijdelijke afscherming of beschutting kunnen creëren, bijvoorbeeld als praktische noodvoorziening. Dit is geen volledige slaap-/bivak-/evacuatieoplossing.

---

## 6. Needs

| Specificatiecode | Voorlopige slugrichting | Doel | Kernvraag |
|---|---|---|---|
| `NEED-WARMTH-RETENTION` | `warmte-behouden` | Basale warmte behouden. | Is er een realistische warmtebehoudoplossing? |
| `NEED-WARMTH-BACKUP-EMERGENCY` | `noodwarmte-backup` | Noodwarmte/reflectie als backup. | Is er een compacte backup voor warmtebehoud? |
| `NEED-DRY-PERSONAL-RAIN` | `persoonlijk-droog-blijven` | Persoonlijke regenbescherming. | Kan de gebruiker zichzelf droog houden? |
| `NEED-SHELTER-LIGHT-COVER` | `lichte-beschutting` | Tijdelijke afscherming/beschutting. | Is er een lichte shelteroplossing? |
| `NEED-SHELTER-ANCHORING` | `beschutting-bevestigen` | Shelter-light praktisch kunnen bevestigen. | Zijn koord/haringen/bevestiging aanwezig? |
| `NEED-GROUND-MOISTURE-BARRIER` | `grondvocht-barriere` | Vochtbarrière tegen ondergrond. | Is er supporting bescherming tegen natte ondergrond? |

### 6.1 Need-prioriteit

| Need | Prioriteit | Coverage-intentie |
|---|---:|---|
| `NEED-WARMTH-RETENTION` | 100 | Core |
| `NEED-WARMTH-BACKUP-EMERGENCY` | 80 | Backup/supporting |
| `NEED-DRY-PERSONAL-RAIN` | 90 | Core |
| `NEED-SHELTER-LIGHT-COVER` | 75 | Supporting/core afhankelijk van add-on-scope |
| `NEED-SHELTER-ANCHORING` | 70 | Required accessory |
| `NEED-GROUND-MOISTURE-BARRIER` | 55 | Supporting, vooral Basis+ |

---

## 7. Capabilities

| Specificatiecode | Voorlopige slugrichting | Omschrijving | Mag primary sufficient zijn? |
|---|---|---|---|
| `CAP-THERMAL-BLANKET-WARMTH` | `warmtedeken-gebruiken` | Warme deken of vergelijkbare warmtebehoudoplossing. | Ja, voor warmtebehoud. |
| `CAP-EMERGENCY-BLANKET-REFLECTIVE` | `nooddeken-reflecterend` | Compacte reflecterende nooddeken/noodfolie. | Backup/secondary, niet slaapcomfort. |
| `CAP-RAIN-PONCHO-PERSONAL` | `regenponcho-gebruiken` | Persoonlijke regenbescherming. | Ja, voor persoonlijk droog blijven. |
| `CAP-TARP-LIGHT-COVER` | `tarp-light-beschutting` | Lichte tarp/afscherming maken. | Secondary/supporting, tenzij scenario specifiek shelter-light vraagt. |
| `CAP-SHELTER-ANCHORING` | `beschutting-bevestigen` | Koord/haringen/bevestiging gebruiken. | Accessory/supporting. |
| `CAP-GROUND-MOISTURE-BARRIER` | `grondvocht-afschermen` | Eenvoudige vochtbarrière. | Supporting. |

### 7.1 Capability-governance

Capabilities mogen alleen meetellen voor de need waarvoor ze inhoudelijk bedoeld zijn.

Voorbeelden:

- Nooddeken mag backup-warmte dekken, maar geen slaapcomfort of langdurige verwarming.
- Poncho mag regenbescherming dekken, maar geen shelter.
- Tarp mag beschutting dekken, maar geen warmtebehoud.
- Koord/haringen zijn accessoires en geen shelter op zichzelf.
- Grondsheet/vochtbarrière is supporting en geen onderkomen.

---

## 8. Scenario capability policies

### 8.1 `SCN-WARMTH-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-WARMTH-RETENTION` | `CAP-THERMAL-BLANKET-WARMTH` | Primary | Basale warmtebehoudoplossing. |
| `NEED-WARMTH-BACKUP-EMERGENCY` | `CAP-EMERGENCY-BLANKET-REFLECTIVE` | Backup/secondary | Nooddeken als backup, niet als slaapcomfort. |

### 8.2 `SCN-DRY-STAY-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-DRY-PERSONAL-RAIN` | `CAP-RAIN-PONCHO-PERSONAL` | Primary | Persoonlijke regenbescherming. |

### 8.3 `SCN-SHELTER-LIGHT-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-SHELTER-LIGHT-COVER` | `CAP-TARP-LIGHT-COVER` | Secondary/primary voor shelter-light | Geen volledige shelter/slaapoplossing. |
| `NEED-SHELTER-ANCHORING` | `CAP-SHELTER-ANCHORING` | Accessory/supporting | Vereist bij tarp. |
| `NEED-GROUND-MOISTURE-BARRIER` | `CAP-GROUND-MOISTURE-BARRIER` | Supporting | Vooral Basis+. |

---

## 9. Producttypes

| Specificatiecode | Voorlopige slugrichting | Rol | Consumable/durable? | Opmerking |
|---|---|---|---|---|
| `PTYPE-THERMAL-BLANKET` | `warmtedeken` | Core | Durable | Warmtebehoud thuis. |
| `PTYPE-EMERGENCY-BLANKET` | `nooddeken` | Backup/supporting | Durable/compact | Reflecterende nooddeken, geen slaapcomfort. |
| `PTYPE-RAIN-PONCHO` | `regenponcho` | Core | Durable/consumable afhankelijk item | Persoonlijke droog-blijven-oplossing. |
| `PTYPE-TARP-LIGHT` | `tarp-light` | Supporting/core shelter-light | Durable | Lichte beschutting. |
| `PTYPE-PARACORD` | `paracord` | Accessory | Durable | Bevestiging voor tarp. |
| `PTYPE-TARP-PEGS` | `tarp-haringen` | Accessory | Durable | Verankering/bevestiging. |
| `PTYPE-GROUNDSHEET` | `grondzeil` | Supporting | Durable | Vochtbarrière, vooral Basis+. |

---

## 10. Productvarianten

### Basis

| Specificatiecode | Producttype | Inhoudelijke variant |
|---|---|---|
| `VAR-THERMAL-BLANKET-BASIC` | `PTYPE-THERMAL-BLANKET` | Basis warmtedeken/fleecedeken. |
| `VAR-EMERGENCY-BLANKET-BASIC` | `PTYPE-EMERGENCY-BLANKET` | Basis reflecterende nooddeken. |
| `VAR-RAIN-PONCHO-BASIC` | `PTYPE-RAIN-PONCHO` | Basis regenponcho. |
| `VAR-TARP-LIGHT-BASIC` | `PTYPE-TARP-LIGHT` | Eenvoudige tarp-light. |
| `VAR-PARACORD-BASIC` | `PTYPE-PARACORD` | Basis koord/paracord. |
| `VAR-TARP-PEGS-BASIC` | `PTYPE-TARP-PEGS` | Basis haringen/bevestiging. |

### Basis+

| Specificatiecode | Producttype | Inhoudelijke variant |
|---|---|---|
| `VAR-THERMAL-BLANKET-PLUS` | `PTYPE-THERMAL-BLANKET` | Betere warmtedeken, robuustere isolatie. |
| `VAR-EMERGENCY-BIVVY-PLUS` | `PTYPE-EMERGENCY-BLANKET` | Robuustere nooddeken/noodbivvy, nog steeds backup. |
| `VAR-RAIN-PONCHO-PLUS` | `PTYPE-RAIN-PONCHO` | Stevigere herbruikbare poncho. |
| `VAR-TARP-LIGHT-PLUS` | `PTYPE-TARP-LIGHT` | Robuustere tarp-light. |
| `VAR-PARACORD-PLUS` | `PTYPE-PARACORD` | Betere koordset. |
| `VAR-TARP-PEGS-PLUS` | `PTYPE-TARP-PEGS` | Betere bevestigingsset. |
| `VAR-GROUNDSHEET-PLUS` | `PTYPE-GROUNDSHEET` | Extra vochtbarrière. |

---

## 11. Items Basis/Basis+

### Basis — conceptitems

| Conceptitem | Producttype | Verwachte rol | Verwachte quantity-intentie |
|---|---|---|---|
| `IOE-THERMAL-BLANKET-BASIC` | `PTYPE-THERMAL-BLANKET` | Core | Per persoon of fixed POC. |
| `IOE-EMERGENCY-BLANKET-BASIC` | `PTYPE-EMERGENCY-BLANKET` | Backup/supporting | Per persoon. |
| `IOE-PONCHO-BASIC` | `PTYPE-RAIN-PONCHO` | Core | Per persoon. |
| `IOE-TARP-LIGHT-BASIC` | `PTYPE-TARP-LIGHT` | Supporting/core shelter-light | Fixed 1 per huishouden. |
| `IOE-PARACORD-BASIC` | `PTYPE-PARACORD` | Accessory | Fixed 1. |
| `IOE-TARP-PEGS-BASIC` | `PTYPE-TARP-PEGS` | Accessory | Fixed 1. |

### Basis+ — conceptitems

| Conceptitem | Producttype | Verwachte rol | Verwachte quantity-intentie |
|---|---|---|---|
| `IOE-THERMAL-BLANKET-PLUS` | `PTYPE-THERMAL-BLANKET` | Core | Per persoon of fixed POC. |
| `IOE-EMERGENCY-BIVVY-PLUS` | `PTYPE-EMERGENCY-BLANKET` | Backup/supporting | Per persoon. |
| `IOE-PONCHO-PLUS` | `PTYPE-RAIN-PONCHO` | Core | Per persoon. |
| `IOE-TARP-LIGHT-PLUS` | `PTYPE-TARP-LIGHT` | Supporting/core shelter-light | Fixed 1 per huishouden. |
| `IOE-PARACORD-PLUS` | `PTYPE-PARACORD` | Accessory | Fixed 1. |
| `IOE-TARP-PEGS-PLUS` | `PTYPE-TARP-PEGS` | Accessory | Fixed 1. |
| `IOE-GROUNDSHEET-PLUS` | `PTYPE-GROUNDSHEET` | Supporting | Fixed 1. |

### Basis+ principe

Basis+ betekent:

- betere scenariofit;
- robuustere materialen;
- minder zwakke schakels;
- betere praktische bruikbaarheid;
- niet simpelweg meer producten.

---

## 12. Item capabilities

| Itemgroep | Capabilities | Coverage-intentie | Claimtype-intentie |
|---|---|---|---|
| Warmtedeken | `CAP-THERMAL-BLANKET-WARMTH` | Primary voor warmtebehoud | Productspecificatie/assumed POC. |
| Nooddeken/noodbivvy | `CAP-EMERGENCY-BLANKET-REFLECTIVE` | Backup/secondary | Geen slaapcomfortclaim. |
| Regenponcho | `CAP-RAIN-PONCHO-PERSONAL` | Primary voor persoonlijk droog blijven | Productspecificatie/assumed POC. |
| Tarp-light | `CAP-TARP-LIGHT-COVER` | Secondary of primary voor shelter-light | Geen volledige shelterclaim. |
| Paracord/haringen | `CAP-SHELTER-ANCHORING` | Accessory/supporting | Alleen als bevestiging. |
| Grondzeil | `CAP-GROUND-MOISTURE-BARRIER` | Supporting | Geen onderkomen. |

---

## 13. Productregels

| Scenario | Need | Producttype | Rol-intentie | Tiergedrag |
|---|---|---|---|---|
| Warmte | `NEED-WARMTH-RETENTION` | `PTYPE-THERMAL-BLANKET` | Core | Basis/Basis+ eigen variant. |
| Warmte | `NEED-WARMTH-BACKUP-EMERGENCY` | `PTYPE-EMERGENCY-BLANKET` | Backup/supporting | Basis nooddeken, Plus robuuster. |
| Droog | `NEED-DRY-PERSONAL-RAIN` | `PTYPE-RAIN-PONCHO` | Core | Per persoon. |
| Shelter-light | `NEED-SHELTER-LIGHT-COVER` | `PTYPE-TARP-LIGHT` | Supporting/core shelter-light | Fixed 1. |
| Shelter-light | `NEED-SHELTER-ANCHORING` | `PTYPE-PARACORD` | Accessory | Bij tarp. |
| Shelter-light | `NEED-SHELTER-ANCHORING` | `PTYPE-TARP-PEGS` | Accessory | Bij tarp. |
| Shelter-light | `NEED-GROUND-MOISTURE-BARRIER` | `PTYPE-GROUNDSHEET` | Supporting | Vooral Basis+. |

---

## 14. Quantity policies

Conceptuele quantity policies die later naar bestaande schemawaarden moeten worden gemapt:

| Conceptterm | Betekenis | Mapping-intentie later |
|---|---|---|
| `per_person` | Hoeveelheid schaalt met volwassenen/kinderen. | Bestaande `per_person` indien aanwezig; anders `per_person_per_day` met duration factor 0/1 of fixed POC na mapping. |
| `one_per_household` | Eén item/set per huishouden. | Bestaande `fixed`, `base_amount = 1`. |
| `accessory_fixed_one` | Eén accessoire bij parent item. | Accessoire requirement + fixed 1. |
| `basis_plus_supporting_only` | Alleen in Basis+ als supporting. | Tier/productvariant/candidate mapping. |

POC-richting:

| Producttype | Quantity-intentie | POC-richting |
|---|---|---|
| Warmtedeken | Per persoon of fixed 2 bij POC-huishouden | Testbaar voor 2 volwassenen. |
| Nooddeken/noodbivvy | Per persoon | 2 bij 2 volwassenen. |
| Poncho | Per persoon | 2 bij 2 volwassenen. |
| Tarp-light | One per household | 1. |
| Paracord | Accessory fixed one | 1. |
| Tarp-haringen | Accessory fixed one | 1. |
| Grondzeil | Basis+ fixed one | 1, supporting. |

---

## 15. Accessoire requirements

Mogelijke accessoireketens:

| Parent | Vereist accessoire | Reden | Opmerking |
|---|---|---|---|
| Tarp-light | Paracord | Tarp kunnen bevestigen. | Required accessory. |
| Tarp-light | Tarp-haringen | Tarp kunnen verankeren. | Required accessory. |
| Tarp-light Plus | Grondzeil | Vochtbarrière of praktischer shelter-light. | Supporting, kan productregel of accessoire zijn. |

Accessoires ontstaan later via bestaande accessoiremechaniek, productregels of scenario needs. Ze mogen niet ontstaan via directe add-on → item koppeling.

---

## 16. Claim governance

Algemene governance:

> Warmte-, regen- en shelter-lightproducten ondersteunen comfort en bescherming tegen blootstelling, maar vervangen geen medische hulp, professionele shelter of weersbestendige woning/uitrusting.

Overclaim-verboden:

- nooddeken is geen slaapcomfort;
- nooddeken behandelt geen onderkoeling;
- warmtedeken garandeert geen veilige temperatuur;
- poncho is geen shelter;
- tarp is geen warmtebron;
- tarp-light is geen volledige tent of evacuatieshelter;
- grondzeil is geen slaapmat;
- koord/haringen zijn geen beschutting op zichzelf;
- geen garantie tegen extreem weer.

---

## 17. Usage constraints

Conceptuele constraints, niet automatisch als database-enums toevoegen:

| Conceptterm | Betekenis |
|---|---|
| `fire_risk_near_heat_source` | Deken/tarp/poncho uit de buurt van open vuur of hittebron houden. |
| `suffocation_or_entanglement_warning` | Nooddeken/folie/koord niet onveilig gebruiken. |
| `not_for_extreme_weather` | Niet bedoeld als garantie tegen extreem weer. |
| `not_medical_hypothermia_treatment` | Geen behandeling van onderkoeling. |
| `dry_before_storage` | Nat materiaal drogen vóór opslag. |
| `check_damage_periodically` | Scheuren/slijtage controleren. |
| `anchor_safely` | Tarp veilig bevestigen, struikel-/losrakenrisico beperken. |
| `child_safety` | Buiten bereik van kleine kinderen gebruiken/bewaren waar relevant. |
| `storage_safety` | Droog/geschikt bewaren. |

Het implementation mapping document moet deze conceptterms mappen naar bestaande `item_usage_constraint` types, notes of public/internal warnings.

---

## 18. Public explanation templates

### Warmtedeken

> Deze warmtedeken is toegevoegd om lichaamswarmte beter vast te houden bij kou of verwarmingsuitval. Dit is praktische warmteondersteuning en geen medische behandeling.

### Nooddeken/noodbivvy

> Deze nooddeken is toegevoegd als compacte backup voor warmtebehoud. Hij helpt warmteverlies beperken, maar vervangt geen warme slaapoplossing of medische hulp bij onderkoeling.

### Poncho

> Deze poncho is toegevoegd om jezelf droog te houden bij regen of natte omstandigheden. Een poncho is persoonlijke regenbescherming en geen volwaardige beschutting.

### Tarp-light

> Deze tarp-light is toegevoegd als eenvoudige tijdelijke afscherming of beschutting. Hij vervangt geen tent, woning of volledige shelteroplossing.

### Paracord/bevestiging

> Deze bevestiging is toegevoegd om de tarp-light praktisch bruikbaar te maken. Gebruik veilig en voorkom losraken of struikelgevaar.

### Grondzeil

> Dit grondzeil is toegevoegd als ondersteunende vochtbarrière. Het is geen slaapmat of volledige beschuttingsoplossing.

### Basis+

> De Basis+ keuze gebruikt robuustere of praktischer toepasbare varianten. Basis+ betekent betere fit en minder zwakke schakels, niet simpelweg meer spullen.

---

## 19. Expected output Basis

Voor de latere run:

```text
addon=warmte_droog_shelter_light
tier=basis
```

moet de Basis-output inhoudelijk minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie | Reden |
|---|---|---|---|
| Warmtebehoud | `IOE-THERMAL-BLANKET-BASIC` | Core | Basale warmtebehoudoplossing. |
| Backup-warmte | `IOE-EMERGENCY-BLANKET-BASIC` | Backup/supporting | Compacte noodwarmte. |
| Droog blijven | `IOE-PONCHO-BASIC` | Core | Persoonlijke regenbescherming. |
| Shelter-light | `IOE-TARP-LIGHT-BASIC` | Supporting/core shelter-light | Tijdelijke afscherming. |
| Bevestiging | `IOE-PARACORD-BASIC` | Accessory | Tarp kunnen bevestigen. |
| Verankering | `IOE-TARP-PEGS-BASIC` | Accessory | Tarp kunnen verankeren. |

---

## 20. Expected output Basis+

Voor de latere run:

```text
addon=warmte_droog_shelter_light
tier=basis_plus
```

moet de Basis+-output inhoudelijk minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie | Reden |
|---|---|---|---|
| Warmtebehoud | `IOE-THERMAL-BLANKET-PLUS` | Core | Betere warmtebehoudoplossing. |
| Backup-warmte | `IOE-EMERGENCY-BIVVY-PLUS` | Backup/supporting | Robuustere noodwarmte-backup. |
| Droog blijven | `IOE-PONCHO-PLUS` | Core | Betere regenbescherming. |
| Shelter-light | `IOE-TARP-LIGHT-PLUS` | Supporting/core shelter-light | Robuustere afscherming. |
| Bevestiging | `IOE-PARACORD-PLUS` | Accessory | Betere bevestiging. |
| Verankering | `IOE-TARP-PEGS-PLUS` | Accessory | Betere verankering. |
| Vochtbarrière | `IOE-GROUNDSHEET-PLUS` | Supporting | Extra bescherming tegen grondvocht. |

---

## 21. Coveragecriteria

Een latere output is inhoudelijk voldoende als:

1. `NEED-WARMTH-RETENTION` voldoende is afgedekt door warmtedeken.
2. `NEED-WARMTH-BACKUP-EMERGENCY` backup/supporting is afgedekt door nooddeken/noodbivvy.
3. `NEED-DRY-PERSONAL-RAIN` voldoende is afgedekt door poncho.
4. `NEED-SHELTER-LIGHT-COVER` is afgedekt door tarp-light zonder volledige shelterclaim.
5. `NEED-SHELTER-ANCHORING` is afgedekt als tarp wordt gekozen.
6. `NEED-GROUND-MOISTURE-BARRIER` supporting is afgedekt in Basis+ of expliciet niet verplicht in Basis.
7. Nooddeken telt niet als primary warmtecomfort.
8. Poncho telt niet als shelter.
9. Tarp telt niet als warmte.
10. Usage warnings zijn zichtbaar.
11. QA blocking 0 blijft.

---

## 22. Sourcecriteria

- Elke generated line heeft minimaal één source.
- Core lines zijn herleidbaar naar scenario_need/product_rule.
- Accessory lines zijn herleidbaar naar parent item/accessory requirement.
- Supporting lines tonen hun beperkte rol.
- POC-aannames worden vastgelegd in internal explanation of notes.
- Supplier-offer informatie blijft binnen bestaande velden.
- Geen supplier_offer schema-uitbreiding.
- Geen directe package/add-on → item source.

---

## 23. QA-criteria

De latere implementatie moet minimaal voldoen aan:

- QA blocking = 0.
- Geen active scenario zonder needs.
- Geen active needs zonder capabilities.
- Geen scenario needs zonder product rules.
- Geen active items zonder capabilities.
- Geen required accessories zonder candidate item.
- Geen producttype mismatch.
- Geen generated lines zonder sources.
- Geen generated line producttype mismatch.
- Geen overclaims rond onderkoeling, extreme weersomstandigheden, slaapcomfort of volledige shelter.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer schema-uitbreiding.
- Geen Directus composite-PK aanpassing.
- Geen directe add-on/package → item koppeling.

---

## 24. Engine-aanpassingen — inhoudelijke verwachting

Nog niet implementeren. De engine moet later waarschijnlijk minimaal ondersteunen of hergebruiken:

- per-person quantities voor dekens/nooddekens/poncho's;
- fixed household quantities voor tarp;
- accessoire requirements bij tarp;
- supporting/backup role-afleiding;
- environmental/governance warnings in output;
- regressions per tier;
- QA-controle op lines zonder sources en overclaims.

Niet doen:

- geen nieuwe quantity formula enum;
- geen hardcoded add-on → item mapping;
- geen schemawijziging voor environmental specs;
- geen medische hypothermie- of shelterclaims;
- geen volledige evacuatie- of slaapmodule.

---

## 25. Interne webapp-aanpassing — inhoudelijke verwachting

Nog niet implementeren. De interne webapp moet later minimaal ondersteunen:

```text
addon=warmte_droog_shelter_light
tier=basis
tier=basis_plus
```

De webapp moet later tonen:

- core warmte/droog-regels;
- supporting shelter-light-regels;
- accessories;
- quantities;
- sources;
- coverage;
- usage warnings;
- governance notes;
- verschil tussen Basis en Basis+;
- QA-resultaat.

---

## 26. Regression test — inhoudelijke specificatie

Nog niet implementeren. De latere regression krijgt vermoedelijk:

```text
regression_warmte_droog_shelter_poc.js
npm run test:warmte-droog-shelter-poc
```

De regression moet minimaal valideren:

1. `addon=warmte_droog_shelter_light` werkt voor `tier=basis`.
2. `addon=warmte_droog_shelter_light` werkt voor `tier=basis_plus`.
3. Basis-output bevat warmtebehoud.
4. Basis+-output bevat warmtebehoud.
5. Basis-output bevat noodwarmte-backup.
6. Basis+-output bevat noodwarmte-backup.
7. Basis-output bevat poncho/persoonlijk droog blijven.
8. Basis+-output bevat poncho/persoonlijk droog blijven.
9. Tarp-light is supporting/core shelter-light, niet warmte.
10. Paracord/haringen worden generated als required accessories bij tarp.
11. Basis+ bevat grondzeil of verklaart via mapping waarom niet.
12. Nooddeken telt niet als primary slaapcomfort of langdurige verwarming.
13. Poncho telt niet als shelter.
14. Tarp telt niet als warmtebehoud.
15. Usage constraints/governance zijn aanwezig.
16. QA generated lines without sources = 0.
17. QA generated line producttype mismatch = 0.
18. QA blocking = 0.
19. Alle eerdere regressions blijven groen.

---

## 27. Release note — toekomstige baseline

Nog niet maken/taggen. Later moet bij afronding een release note worden toegevoegd voor:

```text
v0.6.0-warmte-droog-shelter-light-baseline
```

---

## 28. Fase-afrondingscriteria

Fase 5 is later technisch pas afgerond als:

- deze inhoudelijke specificatie is goedgekeurd;
- implementation mapping is goedgekeurd;
- mapping-check vóór implementatie is uitgevoerd;
- seed draait zonder schemawijzigingen;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen supplier_offer schema-uitbreiding is gedaan;
- geen Directus composite-PK wijziging is gedaan;
- add-on activeert scenario's;
- geen directe add-on → item koppeling bestaat;
- geen directe package → item koppeling bestaat;
- Basis-output klopt;
- Basis+-output klopt;
- quantities kloppen;
- tarp-accessoires correct werken;
- governance klopt;
- usage constraints zichtbaar zijn;
- QA blocking = 0;
- regressions groen zijn:
  - `npm run test:stroomuitval-poc`;
  - `npm run test:drinkwater-poc`;
  - `npm run test:voedsel-poc`;
  - `npm run test:hygiene-sanitatie-poc`;
  - `npm run test:ehbo-poc`;
  - `npm run test:warmte-droog-shelter-poc`;
- interne webapp toont output correct;
- release note aanwezig is;
- commit en tag pas na volledige validatie zijn gezet.

---

## 29. Samenvatting voor review

Deze specificatie definieert Contentbatch 6 als baseline voor:

- warmtebehoud;
- backup-noodwarmte;
- persoonlijk droog blijven;
- shelter-light;
- tarp-accessoires;
- grondvochtbarrière als supporting;
- governance tegen slaapcomfort-, hypothermie-, extreme-weather- en full-shelter-overclaims.

Aanbevolen add-on slug:

```text
warmte_droog_shelter_light
```

Beoogde baseline:

```text
v0.6.0-warmte-droog-shelter-light-baseline
```
