# contentbatch_4_hygiene_sanitatie_afval_implementation_mapping.md

**Project:** Ik overleef  
**Fase:** Fase 3 — Contentbatch 4 Hygiëne, sanitatie & afval  
**Documenttype:** Implementatie-mapping naar bestaand datamodel  
**Status:** Verplicht vóór seed/engine/webapp/regression implementatie  
**Datum:** 2026-04-28  
**Hoort bij:** `contentbatch_4_hygiene_sanitatie_afval_v1.md`  
**Vorige baseline:** `v0.3.0-voedsel-bereiding-baseline`  
**Beoogde baseline na implementatie:** `v0.4.0-hygiene-sanitatie-baseline`

---

## 0. Doel en harde implementatieregel

Dit document vertaalt de inhoudelijke specificatie voor Contentbatch 4 naar de bestaande database- en engineconventies van Ik overleef.

De specificatie beschrijft **wat inhoudelijk moet kloppen**. Dit mappingdocument bepaalt **hoe dat binnen het bestaande datamodel moet worden geïmplementeerd**.

Vanaf Fase 3 blijft de vaste werkwijze verplicht:

1. Eerst inhoudelijke specificatie.
2. Daarna expliciete implementatie-mapping naar het bestaande schema.
3. Pas daarna seed/engine/webapp/regression implementeren.
4. Geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen zonder expliciete toestemming.
5. Database-first blijven.
6. Packages en add-ons nooit direct aan items koppelen.
7. Packages en add-ons activeren scenario’s.
8. Scenario’s leiden via needs, capabilities, productregels, quantity policies, productvarianten, item candidates, accessoire requirements, generated package lines, sources, coverage en QA tot output.
9. Bestaande slugs, enumwaarden, QA-views en engineconcepten blijven leidend.

Voor Fase 3 betekent dit concreet:

- `contentbatch_4_hygiene_sanitatie_afval_v1.md` is inhoudelijk leidend.
- Dit mappingdocument is technisch leidend voor database-implementatie.
- Bij conflict tussen specificatietaal en bestaande schemawaarden gaat dit mappingdocument voor.
- Als het huidige schema een gewenste semantiek niet als enumwaarde ondersteunt, wordt die semantiek vastgelegd via bestaande velden, notes, explanations, governance rules of gegenereerde broninformatie.
- Er wordt niets aan het schema toegevoegd zonder aparte expliciete goedkeuring.

---

## 1. Definitieve add-on slug

### 1.1 Gekozen slug

Gebruik voor Fase 3 consequent:

```text
addon=hygiene_sanitatie_afval
```

Deze slug is gekozen omdat:

- hygiëne, sanitatie én afvalbeheer alle drie inhoudelijk volwaardige onderdelen van deze batch zijn;
- `afval` niet slechts een accessoireketen is, maar een eigen scenario en eigen needs krijgt;
- de slug aansluit op de bestandsnaam `contentbatch_4_hygiene_sanitatie_afval_*`;
- de slug met underscores aansluit op de reeds toegepaste add-on slug `voedsel_bereiding`.

### 1.2 Inspectieregel vóór implementatie

De agent moet vóór implementatie controleren of er in de bestaande database al een conflicterende of afwijkende conventie bestaat.

Als de database al een andere slug vereist, bijvoorbeeld `hygiene_sanitatie`, dan moet de agent stoppen en rapporteren:

- welke slug al bestaat;
- waarom die gekozen zou moeten worden;
- welke impact dit heeft op seed, engine, webapp en regression;
- of dit een inhoudelijke scopeversmalling betekent.

Zonder expliciet akkoord blijft de mapping leidend:

```text
hygiene_sanitatie_afval
```

### 1.3 Architectuurregel

De add-on mag alleen scenario’s activeren via bestaande add-on-scenario mechaniek.

Niet toegestaan:

- add-on direct koppelen aan item;
- add-on direct koppelen aan productvariant;
- add-on direct koppelen aan item candidate;
- package direct koppelen aan item;
- package direct koppelen aan productvariant.

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

## 2. Code naar database-slug mapping

Alle database-slugs gebruiken lowercase kebab-case, behalve add-on slugs waar de bestaande conventie underscores gebruikt. De SCN-/NEED-/CAP-/PTYPE-/VAR-codes uit de specificatie zijn specificatiecodes en mogen niet blind als database-slug worden gebruikt.

### 2.1 Add-on

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `ADDON-HYGIENE-SANITATION-WASTE` | `hygiene_sanitatie_afval` | Definitieve voorkeurslug voor deze batch. |

### 2.2 Scenario’s

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `SCN-HYGIENE-72H-HOME` | `hygiene-thuis-72u` | Basishygiëne gedurende 72 uur thuis. |
| `SCN-SANITATION-72H-HOME` | `noodsanitatie-thuis-72u` | Noodsanitatie thuis gedurende 72 uur. |
| `SCN-WASTE-MANAGEMENT-72H-HOME` | `afvalbeheer-thuis-72u` | Afval tijdelijk insluiten/scheiden gedurende 72 uur. |

### 2.3 Needs

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `NEED-HYGIENE-HANDS` | `handhygiene` | Handen reinigen/desinfecteren binnen realistische hygiëneclaim. |
| `NEED-HYGIENE-BASIC-CLEANING` | `basishygiene-reiniging` | Eenvoudige reiniging met doekjes/zeep. |
| `NEED-SANITATION-TOILET-72H` | `noodtoilet-72u` | Tijdelijke toilet-/noodsanitatieoplossing. |
| `NEED-SANITATION-ABSORBING-CONTAINMENT` | `sanitatie-absorptie-afsluiting` | Absorptie/afsluiting van sanitaire inhoud. |
| `NEED-WASTE-CONTAINMENT` | `afval-insluiten` | Afval tijdelijk verzamelen en insluiten. |
| `NEED-WASTE-SEPARATION` | `afval-scheiden` | Klein/geurend/verontreinigd afval scheiden. |
| `NEED-HAND-PROTECTION` | `handbescherming` | Wegwerp handbescherming bij sanitatie/afvalhandling. |

### 2.4 Capabilities

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `CAP-HAND-SANITIZING` | `handen-desinfecteren` | Handgel/alcoholgel volgens productspecificatie. Geen medische sterilisatieclaim. |
| `CAP-HAND-WASHING-SUPPORT` | `handen-reinigen` | Zeep/handreiniging; water of correcte toepassing vereist. |
| `CAP-SURFACE-WIPE-CLEANING` | `oppervlak-reinigen-met-doekjes` | Basisreiniging met doekjes. Geen medische desinfectieclaim. |
| `CAP-TOILET-WASTE-CONTAINMENT` | `toiletafval-insluiten` | Toiletzak/noodsanitatie-inhoud tijdelijk insluiten. |
| `CAP-ABSORBENT-SANITATION` | `sanitair-absorberen` | Absorptie/stolling/geurbeperking. Supporting tenzij geïntegreerd en bewezen. |
| `CAP-WASTE-BAGGING` | `afvalzak-gebruiken` | Afval tijdelijk in vuilniszakken verzamelen. |
| `CAP-SEALABLE-SMALL-WASTE` | `klein-afval-afsluitbaar-bewaren` | Klein/geurend afval afsluitbaar bewaren. |
| `CAP-DISPOSABLE-HAND-PROTECTION` | `wegwerp-handbescherming` | Wegwerphandschoenen. Geen medische steriele bescherming. |

### 2.5 Producttypes

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `PTYPE-HAND-SANITIZER` | `handgel` | Consumable voor handhygiëne. |
| `PTYPE-HYGIENE-WIPES` | `hygienedoekjes` | Consumable voor basishygiëne/reiniging. |
| `PTYPE-SOAP-BASIC` | `basiszeep` | Consumable voor handreiniging; kan alternatief/aanvulling zijn. |
| `PTYPE-EMERGENCY-TOILET-BAGS` | `noodtoiletzakken` | Consumable voor noodsanitatie. |
| `PTYPE-SANITATION-ABSORBENT` | `sanitair-absorptiemiddel` | Consumable/accessoire bij toiletzakken indien nodig. |
| `PTYPE-TOILET-PAPER` | `toiletpapier` | Consumable voor sanitatiebasis. |
| `PTYPE-WASTE-BAGS` | `vuilniszakken` | Consumable voor afvalcontainment. |
| `PTYPE-ZIPBAGS` | `zipbags` | Consumable/supporting voor klein afval/scheiding. |
| `PTYPE-NITRILE-GLOVES` | `nitril-handschoenen` | Consumable voor handbescherming bij handling. |

### 2.6 Productvarianten

| Specificatiecode | Database-slug | Tier | Opmerking |
|---|---|---|---|
| `VAR-HAND-SANITIZER-BASIC` | `handgel-basis` | `basis` | Basis handgel. |
| `VAR-HAND-SANITIZER-PLUS` | `handgel-basis-plus` | `basis_plus` | Betere/robuustere handgel. |
| `VAR-HYGIENE-WIPES-BASIC` | `hygienedoekjes-basis` | `basis` | Basis hygiënedoekjes. |
| `VAR-HYGIENE-WIPES-PLUS` | `hygienedoekjes-basis-plus` | `basis_plus` | Betere doekjes/grotere bruikbaarheid. |
| `VAR-SOAP-BASIC` | `basiszeep-basis` | `basis` | Basiszeep. |
| `VAR-SOAP-PLUS` | `basiszeep-basis-plus` | `basis_plus` | Betere zeepoptie. |
| `VAR-TOILET-BAGS-BASIC` | `noodtoiletzakken-basis` | `basis` | Eenvoudige noodtoiletzakken. |
| `VAR-TOILET-BAGS-PLUS` | `noodtoiletzakken-basis-plus` | `basis_plus` | Betere noodtoiletzakken, eventueel met geïntegreerde absorber. |
| `VAR-ABSORBENT-BASIC` | `sanitair-absorptiemiddel-basis` | `basis` | Los absorptiemiddel indien vereist. |
| `VAR-ABSORBENT-PLUS` | `sanitair-absorptiemiddel-basis-plus` | `basis_plus` | Betere absorber indien los vereist. |
| `VAR-TOILET-PAPER-BASIC` | `toiletpapier-basis` | `basis` | Basis toiletpapierdekking. |
| `VAR-TOILET-PAPER-PLUS` | `toiletpapier-basis-plus` | `basis_plus` | Ruimere/betere toiletpapierdekking. |
| `VAR-WASTE-BAGS-BASIC` | `vuilniszakken-basis` | `basis` | Basis vuilniszakken. |
| `VAR-WASTE-BAGS-PLUS` | `vuilniszakken-basis-plus` | `basis_plus` | Robuustere vuilniszakken. |
| `VAR-ZIPBAGS-BASIC` | `zipbags-basis` | `basis` | Basis zipbag-set. |
| `VAR-ZIPBAGS-PLUS` | `zipbags-basis-plus` | `basis_plus` | Robuustere/ruimere zipbag-set. |
| `VAR-GLOVES-NITRILE-BASIC` | `nitril-handschoenen-basis` | `basis` | Basis nitril handschoenen. |
| `VAR-GLOVES-NITRILE-PLUS` | `nitril-handschoenen-basis-plus` | `basis_plus` | Betere kwaliteit/fit. |

### 2.7 Items

Itemcodes blijven uppercase SKU’s. Item-slugs blijven lowercase kebab-case.

| Item code | Aanbevolen item-slug | Opmerking |
|---|---|---|
| `IOE-HANDGEL-BASIC` | `ioe-handgel-basic` | Core handhygiëne Basis. |
| `IOE-HANDGEL-PLUS` | `ioe-handgel-plus` | Core handhygiëne Basis+. |
| `IOE-HYGIENE-WIPES-BASIC` | `ioe-hygiene-wipes-basic` | Core basisreiniging Basis. |
| `IOE-HYGIENE-WIPES-PLUS` | `ioe-hygiene-wipes-plus` | Core basisreiniging Basis+. |
| `IOE-SOAP-BASIC` | `ioe-soap-basic` | Core/supporting handreiniging Basis. |
| `IOE-SOAP-PLUS` | `ioe-soap-plus` | Core/supporting handreiniging Basis+. |
| `IOE-TOILET-BAGS-BASIC` | `ioe-toilet-bags-basic` | Core noodsanitatie Basis. |
| `IOE-TOILET-BAGS-PLUS` | `ioe-toilet-bags-plus` | Core noodsanitatie Basis+. |
| `IOE-ABSORBENT-BASIC` | `ioe-absorbent-basic` | Accessory/supporting Basis. |
| `IOE-ABSORBENT-PLUS` | `ioe-absorbent-plus` | Accessory/supporting Basis+. |
| `IOE-TOILET-PAPER-BASIC` | `ioe-toilet-paper-basic` | Core sanitatieconsumable Basis. |
| `IOE-TOILET-PAPER-PLUS` | `ioe-toilet-paper-plus` | Core sanitatieconsumable Basis+. |
| `IOE-WASTE-BAGS-BASIC` | `ioe-waste-bags-basic` | Core afvalcontainment Basis. |
| `IOE-WASTE-BAGS-PLUS` | `ioe-waste-bags-plus` | Core afvalcontainment Basis+. |
| `IOE-ZIPBAGS-BASIC` | `ioe-zipbags-basic` | Supporting/accessory Basis. |
| `IOE-ZIPBAGS-PLUS` | `ioe-zipbags-plus` | Supporting/accessory Basis+. |
| `IOE-GLOVES-NITRILE-BASIC` | `ioe-gloves-nitrile-basic` | Handbescherming Basis. |
| `IOE-GLOVES-NITRILE-PLUS` | `ioe-gloves-nitrile-plus` | Handbescherming Basis+. |

---

## 3. Geen nieuwe enumwaarden

Fase 3 mag geen nieuwe enumwaarden toevoegen zonder expliciete toestemming.

De volgende termen uit de inhoudelijke specificatie zijn **semantische intenties of UI-labels**, geen vrij te seeden database-enums:

| Term uit specificatie | Niet doen | Wel doen |
|---|---|---|
| `supporting` | Niet als nieuwe `coverage_strength` enum toevoegen. | Mappen naar bestaande `coverage_strength = secondary` of `backup`, plus role afleiden uit productregel/producttype/generated source. |
| `required_accessory` | Niet als coverage enum toevoegen. | Gebruik bestaande accessoiremechaniek, `is_accessory = true` en `generated_line_source.source_type = accessory_requirement` als deze waarde al bestaat. |
| `consumable` | Niet als nieuwe enum toevoegen als het schema dit niet heeft. | Vastleggen via bestaand producttype, quantity policy, item notes, product role of bestaande velden. |
| `poc_assumption` | Niet als enum toevoegen. | Vastleggen in internal explanation/notes/governance. |
| `sanitation_warning` | Niet als enum toevoegen. | Mappen naar bestaande usage constraints, public warnings of governance notes. |
| `single_use` | Niet blind als constraint enum toevoegen. | Mappen naar bestaande constrainttype als aanwezig; anders in public/internal warning. |
| `medical_claim_blocker` | Niet als coverage/claim enum toevoegen. | Mappen naar claim_governance_rule, item_usage_constraint of notes. |
| `not_for_medical_sterilization` | Niet als nieuwe enum toevoegen. | Mappen naar bestaande governance/constraint/notes, of rapporteren als blokkade als geen passend bestaand veld bestaat. |
| `flammable_if_alcohol_based` | Niet als nieuwe enum toevoegen. | Mappen naar bestaande fire/safety/storage constraint of public warning. |

Implementatieregel:

```text
Als een gewenste waarde niet in het bestaande enum bestaat:
  gebruik een bestaande enumwaarde;
  leg de specifieke nuance vast in notes/internal explanation/governance;
  voeg geen enum toe zonder expliciete toestemming.
```

---

## 4. Coverage mapping

### 4.1 Bestaande coverage enumwaarden

Gebruik uitsluitend bestaande coverage enumwaarden. Op basis van de vorige baseline zijn in ieder geval deze waarden bekend als gebruikt:

```text
primary
secondary
backup
```

Als de database daarnaast `comfort` of `none` ondersteunt, mag de agent die alleen gebruiken als het bestaande schema en eerdere seedpatronen dat aantoonbaar ondersteunen. Anders niet gebruiken.

### 4.2 Coverage- en roltermen

| Specificatieterm | Database-mapping | Uitleg |
|---|---|---|
| `primary` | Bestaande `coverage_strength = primary` | Alleen voor de need waarvoor de capability inhoudelijk bedoeld is. |
| `supporting` | Bestaande `coverage_strength = secondary` of `backup` | Gebruik geen nieuwe enum. UI/engine mag supporting afleiden uit productregel/source/producttype. |
| `required_accessory` | `is_accessory = true` + `generated_line_source.source_type = accessory_requirement` indien bestaand | Geen coverage enum. |
| `consumable` | Quantity policy + producttype/item notes | Geen coverage enum. |
| `sanitation_warning` | Usage constraint/governance/public warning | Geen coverage enum. |
| `medical_claim_blocker` | Claim governance / item_usage_constraint / explanation | Geen coverage enum. |

### 4.3 Toegestane sufficient coverage

| Need-slug | Capability-slug | Toegestane sufficient coverage |
|---|---|---|
| `handhygiene` | `handen-desinfecteren` | `primary`, mits claim type niet alleen manufacturer claim is en uitleg geen medische claim maakt. |
| `handhygiene` | `handen-reinigen` | `primary` of `secondary`, afhankelijk gekozen productregel. |
| `basishygiene-reiniging` | `oppervlak-reinigen-met-doekjes` | `primary`, maar niet voor medische desinfectie. |
| `noodtoilet-72u` | `toiletafval-insluiten` | `primary`, mits usage constraints aanwezig zijn. |
| `sanitatie-absorptie-afsluiting` | `sanitair-absorberen` | `primary` als geïntegreerd en voldoende, anders `secondary`/accessory. |
| `afval-insluiten` | `afvalzak-gebruiken` | `primary`, maar niet voor noodsanitatie als geheel. |
| `afval-scheiden` | `klein-afval-afsluitbaar-bewaren` | `secondary` of `primary` alleen voor klein-afvalscheiding; niet voor totaal afvalbeheer. |
| `handbescherming` | `wegwerp-handbescherming` | `primary` voor handling; geen medische bescherming. |

### 4.4 Overclaim-verboden

De volgende coverage mag niet worden gegenereerd:

| Item/capability | Verboden coverage |
|---|---|
| Handgel | Geen dekking voor medische sterilisatie, volledige infectiepreventie of oppervlakte-reiniging als enige oplossing. |
| Hygiënedoekjes | Geen dekking voor medische desinfectie of sterilisatie. |
| Nitril handschoenen | Geen dekking voor medische steriele bescherming of besmettingsgarantie. |
| Vuilniszakken | Geen primary coverage voor `noodtoilet-72u` of volledige sanitatie. |
| Zipbags | Geen primary coverage voor `afval-insluiten` als totaaloplossing, tenzij productregel dit expliciet en beperkt toestaat. |
| Absorptiemiddel | Geen zelfstandige primary dekking voor `noodtoilet-72u` zonder toiletzak/containment. |
| Toiletpapier | Geen zelfstandige dekking voor noodsanitatie. |

### 4.5 Generated output rollen

Omdat het bekende issue rond `is_core_line=true` voor backup/supporting regels nog niet structureel wordt opgelost, geldt voorlopig:

| Gewenst intern label | Afleiding zonder schemawijziging |
|---|---|
| `core` | Productregel/producttype voor primaire hygiëne, noodsanitatie, toiletpapier en afvalcontainment. |
| `accessory` | `is_accessory = true` of generated source/accessory requirement. |
| `supporting` | Productregel/producttype/scenario en `coverage_strength = secondary` of source-context. |
| `backup` | Alleen als bestaande coverage/source dit ondersteunt. |
| `warning` | Usage constraints/governance/public/internal explanation, niet als line-role enum. |

De webapp mag deze labels voorlopig afleiden uit bestaande product rule, product role, generated source, capability, scenario of internal explanation. Dit is een presentatie-/engine-afleiding, geen nieuwe database enum.

---

## 5. Claim type mapping

### 5.1 Bestaande claim type waarden

Gebruik alleen bestaande `claim_type` waarden. Op basis van Fase 2 zijn in ieder geval deze waarden beschikbaar:

```text
verified_spec
assumed
```

Als `tested` ook aantoonbaar bestaat, mag die worden gebruikt voor daadwerkelijk geteste claims. Gebruik `tested` niet als POC-aanname.

### 5.2 Mapping

| Specificatieterm | Database-mapping | Opmerking |
|---|---|---|
| `validated` | `verified_spec` of `tested` indien bestaand en inhoudelijk terecht | Gebruik `verified_spec` voor productspecificatieclaims. |
| `source_supported_or_poc` | `assumed` of `verified_spec` met internal note | POC-data duidelijk markeren in notes/uitleg. |
| `poc_assumption` | `assumed` + internal explanation | Geen nieuwe enum. |
| `manufacturer_claim` | Alleen gebruiken als deze waarde al bestaat | Manufacturer claim mag niet automatisch sufficient coverage geven. |
| `medical_claim_blocker` | Niet als claim type | Governance/usage warning/notes. |

### 5.3 Aanbevolen claimtypes per capability

| Capability | Aanbevolen claim type | Opmerking |
|---|---|---|
| `handen-desinfecteren` | `verified_spec` of `assumed` | Geen medische claim; gebruik volgens etiket. |
| `handen-reinigen` | `verified_spec` of `assumed` | Zeep/handreiniging als productspecificatie. |
| `oppervlak-reinigen-met-doekjes` | `verified_spec` of `assumed` | Geen medische desinfectieclaim. |
| `toiletafval-insluiten` | `verified_spec` of `assumed` | Beperk tot tijdelijke containment. |
| `sanitair-absorberen` | `verified_spec` of `assumed` | Alleen als absorber-capability productmatig plausibel is. |
| `afvalzak-gebruiken` | `verified_spec` of `assumed` | Afvalcontainment, geen sanitatieclaim. |
| `klein-afval-afsluitbaar-bewaren` | `verified_spec` of `assumed` | Supporting voor klein afval. |
| `wegwerp-handbescherming` | `verified_spec` of `assumed` | Geen medische steriele bescherming tenzij bewezen, buiten POC-scope. |

### 5.4 Stopconditie

Stop en rapporteer vóór implementatie als:

- `verified_spec` of `assumed` niet bestaan;
- sufficient coverage alleen mogelijk lijkt met een nieuwe claimtypewaarde;
- medische/infectiepreventieclaims alleen met nieuwe governance-enums te modelleren lijken.

---

## 6. Usage constraint mapping

### 6.1 Uitgangspunt

Gebruik alleen bestaande `item_usage_constraint` types. Voeg geen nieuwe constraint-enums toe.

De Fase 2-baseline gebruikte onder meer:

```text
indoor_use
ventilation
fire_risk
fuel_compatibility
child_safety
storage_safety
expiry_sensitive
```

Voor Fase 3 moet de agent eerst inspecteren welke bestaande constraint types beschikbaar zijn. Gebruik de beste bestaande fit. Als een gewenste nuance niet als bestaande enum bestaat, leg die vast in `public_warning`, `internal_notes`, item notes, claim governance of explanation.

### 6.2 Conceptterm naar bestaande mapping

| Conceptterm uit specificatie | Voorkeursmapping naar bestaand concept | Fallback zonder nieuwe enum |
|---|---|---|
| `wash_or_sanitize_hands` | Bestaande hygiene/safety constraint indien aanwezig | Public/internal warning bij toiletzakken, afvalzakken, handschoenen. |
| `avoid_eye_contact` | Bestaande safety/child_safety/storage_safety indien passend | Public warning bij handgel/doekjes. |
| `not_for_medical_sterilization` | Claim governance rule indien bestaand | Public/internal explanation: geen medische sterilisatie/desinfectieclaim. |
| `single_use` | Bestaande usage/disposal constraint indien aanwezig | Public warning: eenmalig gebruiken en veilig weggooien. |
| `dispose_safely` | Bestaande storage_safety/child_safety of disposal constraint indien aanwezig | Public warning: tijdelijk veilig bewaren en volgens regels afvoeren. |
| `keep_away_from_children` | `child_safety` | Vooral handgel, absorber, zakken. |
| `store_cool_dry` | `storage_safety` | Doekjes, handschoenen, toiletpapier, absorber, handgel. |
| `flammable_if_alcohol_based` | `fire_risk` | Handgel op alcoholbasis. |
| `check_expiry_periodically` | `expiry_sensitive` | Handgel en doekjes. |
| `odor_hygiene_warning` | Bestaande hygiene/storage constraint indien aanwezig | Public/internal warning bij toiletzakken/afvalcontainment. |
| `not_for_medical_protection` | Claim governance rule indien bestaand | Public/internal explanation bij handschoenen/doekjes/handgel. |

### 6.3 Minimale usage warnings per itemgroep

| Itemgroep | Minimaal vastleggen via bestaande constraints/warnings |
|---|---|
| Handgel | `fire_risk` indien alcoholbasis, `child_safety`, `storage_safety`, `expiry_sensitive`, geen medische garantie. |
| Hygiënedoekjes | `storage_safety`, `expiry_sensitive`, geen medische desinfectieclaim, afval/disposal warning indien mogelijk. |
| Zeep | `storage_safety`, gebruik volgens instructie. |
| Noodtoiletzakken | Safe disposal/public warning, geur/hygiëne warning, single-use warning, child safety waar relevant. |
| Absorptiemiddel | `child_safety`, `storage_safety`, niet innemen, correct doseren/gebruiken. |
| Toiletpapier | `storage_safety`, droog bewaren. |
| Vuilniszakken | Safe disposal/internal warning, geen sanitatieclaim. |
| Zipbags | Safe disposal/internal warning, supporting only. |
| Nitril handschoenen | Single-use warning, geen medische steriele bescherming, veilig weggooien. |

### 6.4 Stopconditie

Stop en rapporteer als de gewenste warnings alleen als nieuwe enumwaarden kunnen worden gemodelleerd en er geen bestaand notes/public_warning/internal_notes mechanisme beschikbaar is.

---

## 7. Quantity policy mapping

### 7.1 Geen nieuwe policy enumwaarden

Gebruik geen nieuwe `quantity_policy.formula_type` of rounding enums. Hergebruik bestaande mechaniek.

Bekende bestaande mechaniek uit eerdere batches:

```text
fixed
per_person_per_day
pack_size rounding
```

Daarnaast kunnen bestaande types zoals `per_household`, `per_person`, `per_adult_per_day` of vergelijkbaar alleen worden gebruikt als ze aantoonbaar al bestaan.

### 7.2 Conceptterm mapping

| Conceptterm uit specificatie | Database-mapping | Opmerking |
|---|---|---|
| `per_person_per_day` | Bestaande `formula_type = per_person_per_day` | Gebruik adult/child factors en duration_day_factor conform bestaande engine. |
| `per_household_fixed` | Bestaande `fixed` of `per_household` | Bij twijfel `fixed` met `base_amount`. |
| `per_person_pack_rounding` | `per_person_per_day` + `rounding_rule = pack_size` + `pack_size` | Zelfde patroon als water/voedsel. |
| `per_day_pack_rounding` | Bestaande policy met duration factor + `pack_size` indien mogelijk | Anders fixed POC met internal note; geen nieuwe enum. |
| `one_per_household` | `fixed`, `base_amount = 1` | Geen nieuwe enum. |
| `one_pack_per_household` | `fixed`, `base_amount = 1` | Eén verpakking als POC-baseline. |
| `when_sanitation_required` | Accessoire requirement of scenario_need product rule + fixed quantity | Geen nieuwe formula_type. |
| `when_waste_handling_required` | Accessoire requirement of scenario_need product rule + fixed quantity | Deduplicatie via bestaande item dedupe/source mechaniek. |

### 7.3 Aanbevolen POC quantities

Deze aantallen zijn POC-voorstel. De agent mag ze alleen aanpassen als bestaande seedpatronen of testbaarheid dit noodzakelijk maken en moet dat rapporteren.

#### Basis

| Producttype | Policy mapping | POC-aantal bij 2 volwassenen / 72 uur | Opmerking |
|---|---|---:|---|
| `handgel` | `fixed`, `base_amount = 1` | 1 | Eén handgelverpakking per huishouden. |
| `hygienedoekjes` | `per_person_per_day` + `pack_size` | 1 pack | Bijvoorbeeld pack bevat 20/30 doekjes; quantity engine moet afronden. |
| `basiszeep` | `fixed`, `base_amount = 1` | 1 | Kan core of supporting zijn afhankelijk productregel. |
| `noodtoiletzakken` | `per_person_per_day` + `pack_size` | afhankelijk pack | POC: toiletmomenten abstraheren naar persoonsdagen. |
| `sanitair-absorptiemiddel` | accessoire requirement + `fixed` of `pack_size` | 1 | Alleen als gekozen toiletzak absorber niet geïntegreerd heeft. |
| `toiletpapier` | `fixed` of `per_person_per_day` + `pack_size` | 1 pack | Testbaar maken zonder overcomplexe toiletmomentlogica. |
| `vuilniszakken` | `fixed`, `base_amount = 1` of duration factor | 1 pack | Afvalcontainment baseline. |
| `zipbags` | `fixed`, `base_amount = 1` | 1 set | Supporting klein-afval containment. |
| `nitril-handschoenen` | accessoire requirement + `fixed`, `base_amount = 1` | 1 pack | Deduped bij meerdere sources. |

#### Basis+

| Producttype | Policy mapping | POC-aantal bij 2 volwassenen / 72 uur | Opmerking |
|---|---|---:|---|
| `handgel` | `fixed`, `base_amount = 1` | 1 | Betere variant, niet per definitie meer. |
| `hygienedoekjes` | `per_person_per_day` + `pack_size` | 1 pack of meer indien pack-size vereist | Betere/ruimere variant. |
| `basiszeep` | `fixed`, `base_amount = 1` | 1 | Betere aanvulling. |
| `noodtoiletzakken` | `per_person_per_day` + `pack_size` | afhankelijk pack | Plus kan geïntegreerde absorber hebben. |
| `sanitair-absorptiemiddel` | conditioneel | 0 of 1 | Vervalt als Plus-toiletzak absorber geïntegreerd afdekt. |
| `toiletpapier` | `fixed` of `per_person_per_day` + `pack_size` | 1 pack | Betere/ruimere variant. |
| `vuilniszakken` | `fixed`, `base_amount = 1` | 1 pack | Robuustere variant. |
| `zipbags` | `fixed`, `base_amount = 1` | 1 set | Ruimere/robuustere set. |
| `nitril-handschoenen` | accessoire requirement + `fixed`, `base_amount = 1` | 1 pack | Betere variant/maatvoering. |

### 7.4 Testbare quantity-principes

De latere regression moet niet alleen SKU’s testen, maar ook:

- consumable core lines hebben quantity policy;
- nooddomeinen gebruiken duration/person waar relevant;
- fixed items blijven fixed waar bedoeld;
- pack-size rounding werkt voor minimaal één consumable;
- handschoenen dedupliceren met meerdere sources;
- Basis+ kiest betere variant, niet alleen meer quantity;
- geen item quantity ontstaat via hardcoded add-on → item mapping.

---

## 8. Accessoire requirement mapping

### 8.1 Uitgangspunt

Gebruik bestaande `item_accessory_requirement` mechaniek waar mogelijk. Voeg geen nieuwe source_type enum toe.

Gebruik `generated_line_source.source_type = accessory_requirement` alleen als deze waarde al bestaat. Fase 2 gebruikte deze waarde; inspecteer dit vóór implementatie.

### 8.2 Accessoireketens

| Parent/context | Required producttype | Required capability | Quantity mapping | Opmerking |
|---|---|---|---|---|
| `noodtoiletzakken` zonder geïntegreerde absorber | `sanitair-absorptiemiddel` | `sanitair-absorberen` | fixed 1 of pack-size | Alleen voor varianten die losse absorber vereisen. |
| `noodtoiletzakken` | `nitril-handschoenen` | `wegwerp-handbescherming` | fixed 1 pack | Required bij sanitatiehandling. |
| `sanitair-absorptiemiddel` | `nitril-handschoenen` | `wegwerp-handbescherming` | fixed 1 pack | Dedupen met bestaande handschoenenregel. |
| `vuilniszakken` of afvalhandlingcontext | `nitril-handschoenen` | `wegwerp-handbescherming` | fixed 1 pack | Alleen als afvalhandling warning/need actief is. |
| `afvalbeheer-thuis-72u` | `zipbags` | `klein-afval-afsluitbaar-bewaren` | fixed 1 set | Kan productregel of accessoire zijn; mapping-check moet beste patroon kiezen. |

### 8.3 Geïntegreerde absorber in Basis+

Als `IOE-TOILET-BAGS-PLUS` inhoudelijk geïntegreerde absorber bevat:

- leg `sanitair-absorberen` capability vast op het toiletzakitem;
- zet coverage voor `sanitatie-absorptie-afsluiting` alleen sufficient als claimtype en coverage strength dit toelaten;
- genereer geen losse `IOE-ABSORBENT-PLUS` als accessoire, tenzij de productvariant alsnog losse absorber vereist;
- regression moet expliciet toestaan dat Plus absorber geïntegreerd is óf als losse accessory verschijnt, mits coverage en sources kloppen.

### 8.4 Deduplicatie

Handschoenen kunnen sources krijgen vanuit:

- noodsanitatie;
- absorptiemiddel;
- afvalbeheer;
- eventueel zipbags/afvalscheiding.

Deduperegel:

```text
Eén generated line voor nitril handschoenen per tier, met meerdere generated_line_source regels, tenzij een bestaande quantity policy bewust optelling vereist.
```

---

## 9. Supplier/source-regels

### 9.1 Geen supplier_offer schema-uitbreiding

Voeg in Fase 3 geen nieuwe velden toe aan `supplier_offer`.

Niet toevoegen:

```text
source_status
source_url
source_checked_at
claim_coverage
price_status
sanitation_claim_status
expiry_status
medical_claim_status
```

### 9.2 POC-sourceinformatie

POC-sourceinformatie kan worden vastgelegd in bestaande velden, bijvoorbeeld:

- item notes;
- internal explanations;
- public explanations;
- claim governance notes;
- usage constraint notes;
- bestaande supplier_offer velden voor beschikbaarheid/prijs, indien al aanwezig.

### 9.3 Generated sourcecriteria

Elke generated package line moet minimaal één `generated_line_source` hebben.

| Lijntype | Verwachte source |
|---|---|
| Core hygiëne/sanitatie/afval line | `scenario_need` of bestaand equivalent via product rule. |
| Required accessory | `accessory_requirement` met parent_generated_package_line_id indien bestaande waarde aanwezig. |
| Deduped handschoenen | Meerdere sources, bijvoorbeeld sanitatie + afvalbeheer. |
| Zipbags supporting | Scenario_need/product rule of accessory source, afhankelijk implementatiekeuze. |
| Geïntegreerde absorber | Coverage/source op toiletzakitem, geen losse accessory vereist. |

Geen generated line mag ontstaan uit directe add-on/package itemkoppeling.

---

## 10. Supporting/core/accessory output mapping

### 10.1 Voorlopige role-afleiding

Zonder schemawijziging gelden deze afleidregels:

| Producttype | Verwacht intern label | Mapping |
|---|---|---|
| `handgel` | core | Productregel voor `handhygiene`. |
| `hygienedoekjes` | core | Productregel voor `basishygiene-reiniging`. |
| `basiszeep` | core of supporting | Afhankelijk of handgel ook core is; voorkom dubbele primary-overclaim. |
| `noodtoiletzakken` | core | Productregel voor `noodtoilet-72u`. |
| `sanitair-absorptiemiddel` | accessory/supporting | Accessoire bij toiletzak of supporting coverage. |
| `toiletpapier` | core | Sanitatieverbruiksproduct, maar geen zelfstandige noodsanitatiecoverage. |
| `vuilniszakken` | core | Productregel voor `afval-insluiten`. |
| `zipbags` | supporting/accessory | Klein-afvalscheiding, geen totaaloplossing. |
| `nitril-handschoenen` | accessory/core for handling | Required bij sanitatie/afvalhandling; line kan accessory zijn met meerdere sources. |

### 10.2 Webapp-labels

De interne webapp mag later tonen:

```text
core
accessory
supporting
backup
warning
```

Maar deze labels mogen niet als nieuwe database-enums worden toegevoegd. Ze worden afgeleid uit bestaande velden/source/coverage/producttype/internal explanation.

### 10.3 Warnings

Warnings moeten zichtbaar zijn via bestaande usage constraints, public explanation of governance notes. Voeg geen aparte outputsectie in het datamodel toe zonder expliciete toestemming. Als de webapp al warnings kan afleiden of tonen, hergebruik dat.

---

## 11. Seed-implementatieregels

### 11.1 Seedbestand

Pas ná goedkeuring van dit mappingdocument mag de agent een seedbestand maken, vermoedelijk:

```text
contentbatch_4_hygiene_sanitatie_afval_seed.sql
```

Plaatsing volgt bestaande conventie in de repo.

### 11.2 Seed moet bevatten

Minimaal:

- add-on `hygiene_sanitatie_afval`;
- scenarioactivatie via add-on → scenario’s;
- scenario’s:
  - `hygiene-thuis-72u`;
  - `noodsanitatie-thuis-72u`;
  - `afvalbeheer-thuis-72u`;
- needs volgens mapping;
- capabilities volgens mapping;
- need_capability/scenario capability policies volgens bestaande tabellen;
- producttypes volgens mapping;
- productvarianten voor Basis en Basis+;
- item candidates voor Basis en Basis+;
- item capabilities;
- productregels;
- quantity policies;
- accessoire requirements;
- supplier offers binnen bestaande velden;
- claim governance / usage constraints binnen bestaande velden;
- explanation templates of item explanations binnen bestaande patronen;
- QA-relevante dekking.

### 11.3 Seed mag niet bevatten

- nieuwe enumwaarden;
- schemawijzigingen;
- supplier_offer uitbreiding;
- Directus composite-PK wijziging;
- checkout/auth/account-tabellen;
- directe add-on → item koppeling;
- directe package → item koppeling;
- medische claimtabellen buiten bestaand governancepatroon;
- externe leverancierintegraties.

---

## 12. Engine mapping

### 12.1 Gewenste engine-aanpassing

Pas de engine alleen minimaal en gericht aan.

De engine moet later:

- `addon=hygiene_sanitatie_afval` ondersteunen;
- scenario’s activeren via add-on;
- consumable quantities berekenen met bestaande quantity policies;
- 72 uur omzetten naar dagen;
- household/person factors gebruiken waar relevant;
- pack-size rounding toepassen;
- accessoire requirements verwerken;
- conditionele absorberlogica ondersteunen via bestaande accessoire/capability mapping;
- handschoenen dedupliceren met meerdere sources;
- zipbags/vuilniszakken multi-source kunnen tonen waar relevant;
- usage constraints/governance zichtbaar houden in output;
- QA blocking correct laten werken.

### 12.2 Niet doen in engine

- geen nieuwe quantity formula enum toevoegen;
- geen hardcoded add-on → item mapping;
- geen medische claimlogica buiten bestaande governance/constraintmechaniek;
- geen overclaim: handschoenen/handgel/doekjes mogen geen volledige infectiepreventie worden;
- geen directe outputsectie-wijziging als dat schemawijziging vereist.

### 12.3 Public explanations

Gebruik bestaande public explanation mechaniek. Als de engine SKU-specifieke public explanations gebruikt, voeg alleen verklaringen toe voor de nieuwe SKU’s. Als een template-systeem bestaat, gebruik dat.

Belangrijkste expliciete uitleg:

- handhygiëne ondersteunt reinigen/desinfecteren, geen garantie tegen alle ziekteverwekkers;
- doekjes zijn basisreiniging, geen medische desinfectie;
- toiletzakken zijn tijdelijke noodsanitatie, correct gebruik vereist;
- absorber is ondersteunend en werkt alleen bij correct gebruik;
- vuilniszakken zijn afvalcontainment, geen sanitatieoplossing;
- zipbags zijn supporting voor klein/geurend afval;
- nitril handschoenen beschermen bij handling, maar verkeerd gebruik kan besmetting verspreiden.

---

## 13. Interne webapp mapping

### 13.1 Add-on en tiers

De interne webapp moet later minimaal ondersteunen:

```text
addon=hygiene_sanitatie_afval
tier=basis
tier=basis_plus
```

### 13.2 Te tonen onderdelen

De webapp moet tonen:

- core hygiëne-, sanitatie- en afvalregels;
- accessories;
- supporting lines;
- multi-source items;
- quantities;
- sources;
- coverage;
- usage constraints;
- governance/public warnings;
- QA-resultaat;
- verschil tussen Basis en Basis+.

### 13.3 Niet bouwen

Geen klantgerichte checkout, account, betaalflow, voorraadreservering of leverancierintegratie.

---

## 14. Regression mapping

### 14.1 Testbestand en npm-script

Maak later:

```text
regression_hygiene_sanitatie_poc.js
npm run test:hygiene-sanitatie-poc
```

Gebruik `addon=hygiene_sanitatie_afval`, tenzij de mapping-check vóór implementatie expliciet een andere bestaande slug heeft goedgekeurd.

### 14.2 Expected output Basis

Voor:

```text
addon=hygiene_sanitatie_afval
tier=basis
```

moet de output minimaal bevatten:

- `IOE-HANDGEL-BASIC` of expliciet gemapte handhygiëneoplossing;
- `IOE-HYGIENE-WIPES-BASIC`;
- `IOE-TOILET-BAGS-BASIC`;
- `IOE-TOILET-PAPER-BASIC`;
- `IOE-WASTE-BAGS-BASIC`;
- `IOE-ZIPBAGS-BASIC` indien als supporting/accessory gekozen;
- `IOE-GLOVES-NITRILE-BASIC` waar sanitatie/afvalhandling dit vereist;
- `IOE-ABSORBENT-BASIC` als toiletzakken losse absorber vereisen.

### 14.3 Expected output Basis+

Voor:

```text
addon=hygiene_sanitatie_afval
tier=basis_plus
```

moet de output minimaal bevatten:

- `IOE-HANDGEL-PLUS` of expliciet gemapte handhygiëneoplossing;
- `IOE-HYGIENE-WIPES-PLUS`;
- `IOE-TOILET-BAGS-PLUS`;
- `IOE-TOILET-PAPER-PLUS`;
- `IOE-WASTE-BAGS-PLUS`;
- `IOE-ZIPBAGS-PLUS` indien als supporting/accessory gekozen;
- `IOE-GLOVES-NITRILE-PLUS` waar sanitatie/afvalhandling dit vereist;
- `IOE-ABSORBENT-PLUS` alleen als Plus-toiletzakken geen geïntegreerde absorber hebben.

### 14.4 Minimale regression asserts

De regression moet minimaal valideren:

1. `addon=hygiene_sanitatie_afval` werkt voor `tier=basis`.
2. `addon=hygiene_sanitatie_afval` werkt voor `tier=basis_plus`.
3. Basis-output bevat handhygiëne.
4. Basis+-output bevat handhygiëne.
5. Basis-output bevat basisreiniging.
6. Basis+-output bevat basisreiniging.
7. Basis-output bevat noodsanitatie.
8. Basis+-output bevat noodsanitatie.
9. Afvalcontainment is afgedekt.
10. Zipbags of klein-afvalcontainment zijn aanwezig waar vereist.
11. Handschoenen worden gegenereerd waar sanitatie/afvalhandling dit vereist.
12. Handschoenen dedupliceren of krijgen correcte sources als meerdere needs ze vereisen.
13. Consumable quantities gebruiken duration/person/pack-size waar relevant.
14. Basis+ gebruikt betere/hoger passende items dan Basis.
15. Multi-source items behouden sources.
16. Geen item maakt medische claim.
17. Geen item maakt volledige infectiepreventieclaim.
18. Usage constraints of public/internal warnings zijn aanwezig bij handgel, toiletzakken, absorber, afvalhandling en handschoenen waar relevant.
19. QA generated lines without sources = 0.
20. QA generated line producttype mismatch = 0.
21. QA blocking = 0.
22. `npm run test:stroomuitval-poc` blijft groen.
23. `npm run test:drinkwater-poc` blijft groen.
24. `npm run test:voedsel-poc` blijft groen.
25. `npm run test:hygiene-sanitatie-poc` is groen.

---

## 15. Mapping-check vóór implementatie

Voor de agent seed/engine/webapp/regression aanpast, moet eerst een korte mapping-check rapportage worden gemaakt.

Rapporteer minimaal:

1. gekozen add-on slug;
2. gebruikte bestaande coverage enumwaarden;
3. gebruikte bestaande `claim_type` waarden;
4. gebruikte bestaande `item_usage_constraint` types;
5. gebruikte bestaande `generated_line_source.source_type` waarden;
6. quantity policy mapping;
7. accessoire requirement mapping;
8. bevestiging dat geen schemawijziging nodig is;
9. bevestiging dat geen nieuwe enumwaarde nodig is;
10. bevestiging dat geen supplier_offer uitbreiding nodig is;
11. bevestiging dat geen package/add-on direct aan items wordt gekoppeld;
12. eventuele blokkades.

Gebruik dit format:

```md
# Mapping-check Fase 3 — Hygiëne, sanitatie & afval

## Add-on slug
Gekozen slug: `hygiene_sanitatie_afval`

Onderbouwing:
- Slug volgt de batchscope hygiëne + sanitatie + afval.
- Slug sluit aan op `voedsel_bereiding` underscore-conventie.
- Add-on activeert scenario’s, geen directe itemkoppeling.

## Coverage enumwaarden
Gebruikte bestaande waarden:
- primary
- secondary
- backup

Geen nieuwe coverage enumwaarden toegevoegd.

## Claim type waarden
Gebruikte bestaande waarden:
- verified_spec
- assumed

Geen nieuwe claim_type enumwaarden toegevoegd.

## Usage constraint types
Gebruikte bestaande waarden:
- ...

Geen nieuwe usage_constraint types toegevoegd.

## Generated source types
Gebruikte bestaande waarden:
- scenario_need
- accessory_requirement

Geen nieuwe source_type enumwaarden toegevoegd.

## Quantity policy mapping
- `per_person_per_day` → bestaande `per_person_per_day`
- `per_household_fixed` → bestaande `fixed` of bestaand `per_household`
- `per_person_pack_rounding` → `per_person_per_day` + `pack_size`
- `one_per_household` → `fixed`, `base_amount = 1`
- `one_pack_per_household` → `fixed`, `base_amount = 1`
- `when_sanitation_required` → accessoire requirement + fixed/pack quantity
- `when_waste_handling_required` → accessoire requirement of scenario productregel + fixed/pack quantity

Geen nieuwe quantity policy enumwaarden toegevoegd.

## Schema-impact
- Geen schemawijziging nodig.
- Geen supplier_offer uitbreiding nodig.
- Geen Directus composite-PK wijziging nodig.
- Geen package/add-on → item koppeling toegevoegd.
- Geen package → item koppeling toegevoegd.

## Go / no-go
Conclusie:
- Implementatie kan doorgaan binnen bestaand datamodel.
```

Als een van deze punten niet binnen het bestaande datamodel past, stop dan en rapporteer de blokkade.

---

## 16. Geen schema-uitbreiding buiten scope

Niet doen in Fase 3:

- geen nieuwe enumwaarden;
- geen schemawijzigingen;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen checkout;
- geen auth;
- geen klantaccount;
- geen betaalflow;
- geen echte voorraadreservering;
- geen externe leverancierintegraties;
- geen directe add-on → item koppeling;
- geen package → item koppeling;
- geen volledige EHBO-batch;
- geen medische claimuitbreiding;
- geen baby-/huisdier-specifieke sanitatiemodule;
- geen volledige evacuatie/shelter-uitbreiding.

---

## 17. Implementatievolgorde na goedkeuring

Pas na goedkeuring van dit mappingdocument en na mapping-check mag de agent implementeren:

1. `contentbatch_4_hygiene_sanitatie_afval_seed.sql`
2. engine-aanpassingen voor hygiëne/sanitatie/afval
3. interne webapp-uitbreiding
4. `regression_hygiene_sanitatie_poc.js`
5. npm-script voor `npm run test:hygiene-sanitatie-poc`, indien nog niet aanwezig
6. regressions draaien:
   - `npm run test:stroomuitval-poc`
   - `npm run test:drinkwater-poc`
   - `npm run test:voedsel-poc`
   - `npm run test:hygiene-sanitatie-poc`

---

## 18. Release note en tag na implementatie

Na volledige implementatie en groene validatie moet een release note worden toegevoegd voor:

```text
v0.4.0-hygiene-sanitatie-baseline
```

Let op: de bestandsnaam bevat `afval`, maar de release tag mag korter blijven als projectconventie:

```text
v0.4.0-hygiene-sanitatie-baseline
```

Als de agent een langere tag wil gebruiken, bijvoorbeeld:

```text
v0.4.0-hygiene-sanitatie-afval-baseline
```

moet dit eerst expliciet worden gerapporteerd en goedgekeurd. Voor consistentie met roadmap is de voorkeurswaarde:

```text
v0.4.0-hygiene-sanitatie-baseline
```

---

## 19. Samenvatting voor implementatie

Definitieve mappingkeuzes voor Fase 3:

- Add-on slug: `hygiene_sanitatie_afval`
- Scenario’s:
  - `hygiene-thuis-72u`
  - `noodsanitatie-thuis-72u`
  - `afvalbeheer-thuis-72u`
- Kernneeds:
  - `handhygiene`
  - `basishygiene-reiniging`
  - `noodtoilet-72u`
  - `sanitatie-absorptie-afsluiting`
  - `afval-insluiten`
  - `afval-scheiden`
  - `handbescherming`
- Kerncapabilities:
  - `handen-desinfecteren`
  - `handen-reinigen`
  - `oppervlak-reinigen-met-doekjes`
  - `toiletafval-insluiten`
  - `sanitair-absorberen`
  - `afvalzak-gebruiken`
  - `klein-afval-afsluitbaar-bewaren`
  - `wegwerp-handbescherming`
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer uitbreiding.
- Geen directe package/add-on → item koppeling.
- Consumable quantities via bestaande fixed/per_person_per_day/pack_size mapping.
- Sanitatie- en medische overclaims via bestaande governance/constraints/explanations blokkeren.
- Implementatie pas na mapping-check.
