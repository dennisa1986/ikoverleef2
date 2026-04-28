# contentbatch_5_ehbo_persoonlijke_zorg_v1.md

**Project:** Ik overleef  
**Fase:** Fase 4 — Contentbatch 5 EHBO & persoonlijke zorg  
**Documenttype:** Inhoudelijke specificatie  
**Status:** Specificatie v1 — klaar voor review, nog niet zelfstandig implementatieklaar  
**Datum:** 2026-04-28  
**Vorige formele baseline:** `v0.4.0-hygiene-sanitatie-baseline`  
**Beoogde volgende baseline:** `v0.5.0-ehbo-baseline`  
**Nog vereist vóór implementatie:** `contentbatch_5_ehbo_persoonlijke_zorg_implementation_mapping.md`

---

## 0. Harde scope- en governance-opmerking

Dit document is de inhoudelijke specificatie voor Contentbatch 5. De fase mag end-to-end worden uitgevoerd, maar alleen volgens de vaste gated werkwijze:

1. specificatie opnemen;
2. implementation mapping opnemen;
3. mapping-check uitvoeren;
4. pas daarna seed/engine/webapp/regression implementeren;
5. release note, commit, tag en push pas na groene validatie.

Geen nieuwe enumwaarden, schemawijzigingen, supplier_offer-uitbreiding of conceptuele modelwijzigingen zonder expliciete toestemming. Packages en add-ons hangen nooit direct aan items; ze activeren scenario’s. Scenario’s leiden via needs, capabilities, productregels, quantity policies, productvarianten, item candidates, accessoire requirements, generated package lines, sources, coverage en QA tot output.

Termen zoals `medical_governance`, `task`, `checklist`, `supporting`, `required_accessory`, `care_warning`, `not_medical_advice` en `poc_assumption` zijn inhoudelijke intenties. Ze mogen later niet automatisch als database-enums worden toegevoegd.

---

## 1. Waar we staan in het plan

Afgerond:

- Fase 0 — Stroomuitval baseline: `v0.1.0-stroomuitval-baseline`
- Fase 1 — Drinkwaterzekerheid baseline: `v0.2.0-drinkwater-baseline`
- Fase 2 — Voedsel & voedselbereiding baseline: `v0.3.0-voedsel-bereiding-baseline`
- Fase 3 — Hygiëne, sanitatie & afval baseline: `v0.4.0-hygiene-sanitatie-baseline`

Nu:

**Fase 4 — Contentbatch 5 EHBO & persoonlijke zorg**

Deze fase voegt een medisch claimgevoelig domein toe. De kern is niet medisch advies verkopen, maar praktisch borgen dat een huishouden basisproducten heeft voor kleine wondverzorging en persoonlijke zorg, terwijl medische claims strak worden begrensd.

Belangrijk uitgangspunt:

> EHBO-producten ondersteunen eerste hulp bij kleine incidenten, maar vervangen geen professionele medische hulp, diagnose, behandeling of noodhulp.

En:

> Persoonlijke medicatie is geen generiek productadvies. Het systeem mag hoogstens een taak/checklist of waarschuwing tonen, tenzij het bestaande datamodel al veilige task-output ondersteunt.

---

## 2. Doel van Fase 4

Fase 4 moet bewijzen dat het model medische claimbeperking, persoonlijke zorg, ondersteunende items en cross-batch reuse aankan.

Deze fase test:

- basiswondverzorging;
- kleine wondafdekking;
- wondreiniging/desinfectie als beperkte ondersteunende claim;
- fixatie/verbandondersteuning;
- handbescherming bij wondverzorging;
- Basis versus Basis+ EHBO-keuzes;
- thermometer als supporting Basis+ item;
- persoonlijke medicatie als taak/checklist/content-only, niet als generiek item;
- pijnstilling uitsluitend als toekomstige governance- of checklistvraag, niet als standaard productregel;
- usage constraints rond medische claims, houdbaarheid, kindveiligheid en correct gebruik;
- regressions over Stroomuitval, Drinkwater, Voedsel, Hygiëne/Sanitatie en EHBO.

---

## 3. Niet-doen-lijst

Deze fase doet expliciet niet:

- geen checkout, auth, klantaccount of betaalflow;
- geen externe leverancierintegraties of echte voorraadreservering;
- geen medische diagnose;
- geen behandelingsadvies;
- geen generiek persoonlijk medicatieadvies;
- geen standaard verkoop van pijnstillers of geneesmiddelen zonder aparte governance-beslissing;
- geen claim dat een EHBO-set professionele hulp vervangt;
- geen claim dat wondreiniging infecties voorkomt of behandelt;
- geen volledige zorgmodule;
- geen baby-/huisdier-specifieke medische module;
- geen evacuatie/shelter-uitbreiding;
- geen schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen directe package → item koppeling;
- geen directe add-on → item koppeling.

---

## 4. Add-on

Specificatiecode:

```text
ADDON-FIRST-AID-PERSONAL-CARE
```

Aanbevolen database-slug voor het mappingdocument:

```text
ehbo_persoonlijke_zorg
```

Alternatief alleen bij bestaande databaseconventie:

```text
ehbo
```

Advies: kies `ehbo_persoonlijke_zorg`, omdat deze batch naast klassieke EHBO ook persoonlijke zorg en persoonlijke medicatie-taken raakt.

Gewenste flow:

```text
addon=ehbo_persoonlijke_zorg
→ scenario’s
→ needs
→ capabilities
→ productregels
→ quantity policies
→ productvarianten
→ item candidates
→ accessoire requirements / content-only tasks waar bestaand ondersteund
→ generated package lines / task-output waar bestaand ondersteund
→ sources + coverage + QA
```

---

## 5. Scenario’s

| Specificatiecode | Voorlopige slugrichting | Doel | Scope |
|---|---|---|---|
| `SCN-FIRST-AID-WOUND-72H-HOME` | `ehbo-wondzorg-thuis-72u` | Kleine wondzorg thuis gedurende 72 uur ondersteunen. | EHBO-set, pleisters, gaas, wondreiniging, tape, handschoenen. |
| `SCN-PERSONAL-CARE-72H-HOME` | `persoonlijke-zorg-thuis-72u` | Basis persoonlijke zorg en eenvoudige monitoring ondersteunen. | Thermometer optioneel/supporting, houdbaarheid, persoonlijke zorgwaarschuwingen. |
| `SCN-MEDICATION-CHECK-72H-HOME` | `persoonlijke-medicatie-check-thuis-72u` | Persoonlijke medicatie als taak/checklist borgen. | Geen generiek productadvies; task of content-only need. |

### Scenario-notities

`SCN-FIRST-AID-WOUND-72H-HOME` gaat over kleine incidenten en tijdelijke eerste hulp. Bij ernstige, diepe, hevig bloedende, vuile, geïnfecteerde of twijfelachtige verwondingen moet professionele hulp worden gezocht.

`SCN-PERSONAL-CARE-72H-HOME` gaat over eenvoudige observatie en basiszorg. Een thermometer geeft informatie, geen diagnose.

`SCN-MEDICATION-CHECK-72H-HOME` mag geen generiek medicijnadvies genereren. Als tasks/checklists nog niet in het datamodel zitten, blijft dit scenario content-only of wordt het als governance/public note vastgelegd.

---

## 6. Needs

| Specificatiecode | Voorlopige slugrichting | Doel | Kernvraag |
|---|---|---|---|
| `NEED-FIRST-AID-BASE` | `basis-ehbo` | Basis EHBO-voorziening. | Is er een basisset voor kleine incidenten? |
| `NEED-WOUND-COVERAGE` | `wonden-afdekken` | Kleine wonden afdekken. | Zijn pleisters/gaas beschikbaar? |
| `NEED-WOUND-CLEANING` | `wondreiniging-ondersteunen` | Wondreiniging ondersteunen. | Is er een product voor eenvoudige reiniging volgens instructie? |
| `NEED-BANDAGE-FIXATION` | `verband-fixeren` | Gaas/verband fixeren. | Is er tape/verbandfixatie? |
| `NEED-CARE-HAND-PROTECTION` | `zorg-handbescherming` | Handbescherming bij wondzorg. | Zijn wegwerphandschoenen beschikbaar? |
| `NEED-TEMPERATURE-CHECK` | `temperatuur-controleren` | Temperatuur kunnen meten. | Is er optioneel/supporting meetmiddel? |
| `NEED-PERSONAL-MEDICATION-CHECK` | `persoonlijke-medicatie-check` | Eigen medicatie controleren. | Wordt dit als taak/checklist geborgd? |
| `NEED-PAIN-RELIEF-GOVERNANCE` | `pijnstilling-governance-check` | Pijnstilling niet blind adviseren. | Wordt voorkomen dat generieke medicatie als standaard item verschijnt? |

### Need-prioriteit

| Need | Prioriteit | Coverage-intentie |
|---|---:|---|
| `NEED-FIRST-AID-BASE` | 100 | Core |
| `NEED-WOUND-COVERAGE` | 95 | Core |
| `NEED-WOUND-CLEANING` | 90 | Core/supporting met medische claimbeperking |
| `NEED-BANDAGE-FIXATION` | 80 | Supporting/accessory |
| `NEED-CARE-HAND-PROTECTION` | 85 | Accessory/core for handling |
| `NEED-TEMPERATURE-CHECK` | 60 | Supporting, vooral Basis+ |
| `NEED-PERSONAL-MEDICATION-CHECK` | 100 | Task/content-only, geen item |
| `NEED-PAIN-RELIEF-GOVERNANCE` | 70 | Governance/task, geen standaard item |

---

## 7. Capabilities

| Specificatiecode | Voorlopige slugrichting | Omschrijving | Mag primary sufficient zijn? |
|---|---|---|---|
| `CAP-FIRST-AID-KIT-BASE` | `basis-ehbo-set-gebruiken` | Basis EHBO-set gebruiken. | Ja, voor basis-EHBO; niet voor volledige medische dekking. |
| `CAP-WOUND-COVER-PLASTER` | `pleisters-gebruiken` | Kleine wonden afdekken met pleisters. | Ja, voor kleine wondafdekking. |
| `CAP-WOUND-COVER-GAUZE` | `steriel-gaas-gebruiken` | Wonden afdekken met steriel gaas. | Ja, mits claim beperkt blijft. |
| `CAP-WOUND-CLEANING-SUPPORT` | `wondreiniging-ondersteunen` | Eenvoudige wondreiniging volgens productinstructie. | Primary/secondary; geen infectiepreventieclaim. |
| `CAP-BANDAGE-FIXATION` | `verband-fixeren` | Verband/gaas praktisch vastzetten. | Secondary/supporting. |
| `CAP-DISPOSABLE-CARE-GLOVES` | `wegwerp-handschoenen-zorg` | Handschoenen bij wondzorg/handling. | Ja, voor handbescherming; geen steriele medische bescherming. |
| `CAP-TEMPERATURE-MEASUREMENT` | `temperatuur-meten` | Temperatuur meten. | Secondary/supporting; geen diagnose. |
| `CAP-PERSONAL-MEDICATION-REMINDER` | `persoonlijke-medicatie-herinneren` | Gebruiker herinneren eigen medicatie te controleren. | Alleen task/content-only. |
| `CAP-PAIN-RELIEF-CHECKLIST` | `pijnstilling-checklist` | Pijnstilling als governance/checklistvraag. | Geen productcoverage. |

---

## 8. Scenario capability policies

### `SCN-FIRST-AID-WOUND-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-FIRST-AID-BASE` | `CAP-FIRST-AID-KIT-BASE` | Primary | Basis EHBO-set. |
| `NEED-WOUND-COVERAGE` | `CAP-WOUND-COVER-PLASTER` en/of `CAP-WOUND-COVER-GAUZE` | Primary | Pleisters en/of gaas. |
| `NEED-WOUND-CLEANING` | `CAP-WOUND-CLEANING-SUPPORT` | Primary/secondary | Geen infectiepreventieclaim. |
| `NEED-BANDAGE-FIXATION` | `CAP-BANDAGE-FIXATION` | Secondary/supporting | Tape/fixatie. |
| `NEED-CARE-HAND-PROTECTION` | `CAP-DISPOSABLE-CARE-GLOVES` | Primary for handling | Reuse nitril handschoenen waar mogelijk. |

### `SCN-PERSONAL-CARE-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-TEMPERATURE-CHECK` | `CAP-TEMPERATURE-MEASUREMENT` | Secondary/supporting | Vooral Basis+, geen diagnoseclaim. |

### `SCN-MEDICATION-CHECK-72H-HOME`

| Need | Required capabilities | Inhoudelijke sterkte | Opmerking |
|---|---|---|---|
| `NEED-PERSONAL-MEDICATION-CHECK` | `CAP-PERSONAL-MEDICATION-REMINDER` | Task/content-only | Geen item. |
| `NEED-PAIN-RELIEF-GOVERNANCE` | `CAP-PAIN-RELIEF-CHECKLIST` | Task/content-only | Geen generiek pijnstilleritem. |

---

## 9. Producttypes

| Specificatiecode | Voorlopige slugrichting | Rol | Consumable? | Opmerking |
|---|---|---|---|---|
| `PTYPE-FIRST-AID-KIT` | `ehbo-set` | Core | Gemengd | Basis EHBO-set. |
| `PTYPE-PLASTERS` | `pleisters` | Core | Ja | Kleine wondafdekking. |
| `PTYPE-STERILE-GAUZE` | `steriel-gaas` | Core | Ja | Wondafdekking. |
| `PTYPE-WOUND-CLEANING` | `wondreiniging` | Core/supporting | Ja | Geen infectiepreventieclaim. |
| `PTYPE-MEDICAL-TAPE` | `verbandtape` | Accessory/supporting | Ja | Fixatie. |
| `PTYPE-NITRILE-GLOVES` | `nitril-handschoenen` | Accessory/core for handling | Ja | Reuse uit Contentbatch 4 als bestaand. |
| `PTYPE-THERMOMETER` | `thermometer` | Supporting/optional | Nee | Vooral Basis+, geen diagnoseclaim. |

Niet als producttype in deze fase:

- persoonlijke medicatie;
- pijnstillers;
- antibiotica;
- receptmedicatie;
- medische diagnose.

---

## 10. Productvarianten

### Basis

| Specificatiecode | Producttype | Inhoudelijke variant |
|---|---|---|
| `VAR-FIRST-AID-KIT-BASIC` | `PTYPE-FIRST-AID-KIT` | Compacte basis EHBO-set. |
| `VAR-PLASTERS-BASIC` | `PTYPE-PLASTERS` | Basis pleisterset. |
| `VAR-STERILE-GAUZE-BASIC` | `PTYPE-STERILE-GAUZE` | Basis gaas/verpakking. |
| `VAR-WOUND-CLEANING-BASIC` | `PTYPE-WOUND-CLEANING` | Basis wondreiniging. |
| `VAR-MEDICAL-TAPE-BASIC` | `PTYPE-MEDICAL-TAPE` | Basis tape/fixatie. |
| `VAR-GLOVES-NITRILE-BASIC` | `PTYPE-NITRILE-GLOVES` | Bestaande Basis-handschoenen waar mogelijk. |

### Basis+

| Specificatiecode | Producttype | Inhoudelijke variant |
|---|---|---|
| `VAR-FIRST-AID-KIT-PLUS` | `PTYPE-FIRST-AID-KIT` | Robuustere/volledigere EHBO-set. |
| `VAR-PLASTERS-PLUS` | `PTYPE-PLASTERS` | Betere/meer diverse pleisterset. |
| `VAR-STERILE-GAUZE-PLUS` | `PTYPE-STERILE-GAUZE` | Betere/ruimere gaasdekking. |
| `VAR-WOUND-CLEANING-PLUS` | `PTYPE-WOUND-CLEANING` | Betere wondreiniging volgens productspecificatie. |
| `VAR-MEDICAL-TAPE-PLUS` | `PTYPE-MEDICAL-TAPE` | Betere tape/fixatie. |
| `VAR-GLOVES-NITRILE-PLUS` | `PTYPE-NITRILE-GLOVES` | Bestaande Basis+ handschoenen waar mogelijk. |
| `VAR-THERMOMETER-PLUS` | `PTYPE-THERMOMETER` | Supporting thermometer voor Basis+. |

---

## 11. Items Basis/Basis+

### Basis — conceptitems

| Conceptitem | Producttype | Verwachte rol | Verwachte quantity-intentie |
|---|---|---|---|
| `IOE-FIRSTAID-KIT-BASIC` | `PTYPE-FIRST-AID-KIT` | Core | Fixed 1 per huishouden. |
| `IOE-PLASTERS-BASIC` | `PTYPE-PLASTERS` | Core | Fixed 1 pack. |
| `IOE-STERILE-GAUZE-BASIC` | `PTYPE-STERILE-GAUZE` | Core/supporting | Fixed 1 pack. |
| `IOE-WOUND-CLEANING-BASIC` | `PTYPE-WOUND-CLEANING` | Core/supporting | Fixed 1. |
| `IOE-MEDICAL-TAPE-BASIC` | `PTYPE-MEDICAL-TAPE` | Accessory/supporting | Fixed 1. |
| `IOE-GLOVES-NITRILE-BASIC` | `PTYPE-NITRILE-GLOVES` | Accessory/core for handling | Reuse uit hygiënebatch indien bestaand. |

### Basis+ — conceptitems

| Conceptitem | Producttype | Verwachte rol | Verwachte quantity-intentie |
|---|---|---|---|
| `IOE-FIRSTAID-KIT-PLUS` | `PTYPE-FIRST-AID-KIT` | Core | Fixed 1 per huishouden. |
| `IOE-PLASTERS-PLUS` | `PTYPE-PLASTERS` | Core | Fixed 1 pack. |
| `IOE-STERILE-GAUZE-PLUS` | `PTYPE-STERILE-GAUZE` | Core/supporting | Fixed 1 pack. |
| `IOE-WOUND-CLEANING-PLUS` | `PTYPE-WOUND-CLEANING` | Core/supporting | Fixed 1. |
| `IOE-MEDICAL-TAPE-PLUS` | `PTYPE-MEDICAL-TAPE` | Accessory/supporting | Fixed 1. |
| `IOE-GLOVES-NITRILE-PLUS` | `PTYPE-NITRILE-GLOVES` | Accessory/core for handling | Reuse uit hygiënebatch indien bestaand. |
| `IOE-THERMOMETER-PLUS` | `PTYPE-THERMOMETER` | Supporting | Fixed 1, geen diagnoseclaim. |

Niet genereren als item:

- `IOE-PAINKILLERS-*`;
- `IOE-PERSONAL-MEDICATION-*`;
- `IOE-ANTIBIOTICS-*`;
- `IOE-PRESCRIPTION-*`.

---

## 12. Quantity policies

Conceptuele policies die later naar bestaande mechaniek moeten worden gemapt:

| Conceptterm | Betekenis | Mapping-intentie later |
|---|---|---|
| `one_per_household` | Eén item/verpakking per huishouden. | Bestaande fixed policy met base_amount = 1. |
| `one_pack_per_household` | Eén pack als baseline. | Bestaande fixed/per_household policy. |
| `fixed_care_pack` | Vaste POC-packhoeveelheid. | Bestaande fixed, geen nieuwe enum. |
| `when_wound_care_required` | Alleen bij wondzorgcontext. | Accessoire requirement of productregelcontext. |
| `basis_plus_supporting_only` | Alleen Basis+ supporting. | Tier candidate/productregel, geen nieuwe enum. |

POC-aannames:

- EHBO-set: fixed 1;
- pleisters: fixed 1 pack;
- steriel gaas: fixed 1 pack;
- wondreiniging: fixed 1;
- verbandtape: fixed 1 via accessoire/productregel;
- nitril handschoenen: fixed 1 pack via accessoire/productregel, deduped bij meerdere add-ons;
- thermometer: Basis+ fixed 1, supporting;
- persoonlijke medicatie: geen itemquantity;
- pijnstilling: geen itemquantity.

---

## 13. Accessoire requirements

| Parent/context | Vereist accessoire | Reden | Opmerking |
|---|---|---|---|
| Steriel gaas | Verbandtape | Gaas/fixatie praktisch bruikbaar maken. | Accessoire requirement of productregel. |
| Wondverzorging / EHBO-set | Nitril handschoenen | Hygiënisch handelen bij wondzorg. | Reuse bestaande handschoenen waar mogelijk. |
| Wondreiniging | Nitril handschoenen | Contact en contaminatie beperken. | Dedupliceren met EHBO-set/wondzorg. |

Accessoires ontstaan via bestaande accessoiremechaniek, productregels of scenario needs. Niet via directe add-on → item koppeling.

---

## 14. Claim governance

Algemene governance:

> EHBO-producten ondersteunen eerste hulp bij kleine incidenten. Ze vervangen geen professionele medische hulp, diagnose of behandeling.

| Domein | Governance-regel |
|---|---|
| EHBO-set | Basisvoorziening, geen volledige medische zelfredzaamheid. |
| Pleisters | Kleine wondafdekking, geen behandeling van ernstige wonden. |
| Steriel gaas | Wondafdekking, geen garantie tegen infectie. |
| Wondreiniging | Reinigen volgens instructie, geen claim dat infecties worden voorkomen/behandeld. |
| Verbandtape | Fixatie, geen medische behandeling op zichzelf. |
| Nitril handschoenen | Handbescherming, geen steriele medische bescherming tenzij bewezen buiten POC-scope. |
| Thermometer | Temperatuur meten, geen diagnose of behandeladvies. |
| Persoonlijke medicatie | Gebruiker moet eigen medicatie/checklist controleren; geen generiek productadvies. |
| Pijnstilling | Geen generiek itemadvies in deze fase; alleen latere governancebeslissing of checklist. |

Verboden public claims:

- “vervangt arts/professionele hulp”;
- “behandelt infectie”;
- “voorkomt infectie”;
- “diagnosticeert”;
- “geschikt voor ernstige verwondingen”;
- “neem dit medicijn”;
- “pijnstillers zijn standaard nodig”;
- “persoonlijke medicatie wordt automatisch geregeld”.

---

## 15. Usage constraints

Conceptuele constraints, later te mappen naar bestaande constraint types of notes:

| Conceptterm | Betekenis | Voorbeelden |
|---|---|---|
| `not_medical_advice` | Geen medisch advies. | EHBO-set, thermometer, wondreiniging. |
| `seek_professional_help` | Professionele hulp bij ernstige/twijfelachtige situaties. | EHBO-set, wondproducten. |
| `check_expiry_periodically` | Houdbaarheid controleren. | EHBO-set, wondreiniging, pleisters, gaas. |
| `single_use` | Wegwerp/eenmalig gebruik. | Pleisters, gaas, handschoenen. |
| `keep_away_from_children` | Buiten bereik van kinderen. | Wondreiniging, EHBO-set. |
| `store_cool_dry` | Koel/droog bewaren. | Pleisters, gaas, tape, wondreiniging. |
| `dispose_safely` | Veilig weggooien. | Gaas, handschoenen, gebruikte pleisters. |
| `allergy_sensitivity_warning` | Let op allergie/gevoeligheid. | Pleisters, tape, wondreiniging. |
| `temperature_not_diagnosis` | Meting is geen diagnose. | Thermometer. |
| `medication_personal_check_only` | Persoonlijke medicatie zelf controleren. | Medicatie-task/content-only. |

Geen nieuwe constraint-enums toevoegen.

---

## 16. Public explanation templates

**EHBO-set**

> Deze EHBO-set is toegevoegd als basisvoorziening voor kleine incidenten en eenvoudige eerste hulp. Dit vervangt geen professionele medische hulp, diagnose of behandeling.

**Pleisters**

> Deze pleisters zijn toegevoegd om kleine wondjes praktisch af te dekken. Gebruik ze volgens instructie en zoek hulp bij ernstige, diepe, vuile of hevig bloedende wonden.

**Steriel gaas**

> Dit steriele gaas ondersteunt het tijdelijk afdekken van wonden. Het voorkomt of behandelt geen infecties en is geen vervanging voor medische beoordeling.

**Wondreiniging**

> Dit wondreinigingsproduct ondersteunt eenvoudige reiniging volgens productinstructie. Het is geen behandeling en garandeert geen infectiepreventie.

**Verbandtape**

> Deze tape is toegevoegd om gaas of verband praktisch te fixeren. Het is ondersteunend en geen medische behandeling op zichzelf.

**Nitril handschoenen**

> Deze handschoenen zijn toegevoegd voor handbescherming bij wondzorg. Ze zijn niet steriel en bieden geen medische garantie; gebruik ze eenmalig en gooi ze veilig weg.

**Thermometer**

> Deze thermometer is toegevoegd als ondersteunend hulpmiddel om temperatuur te meten. Een meting is geen diagnose en vervangt geen medisch advies.

**Persoonlijke medicatie**

> Controleer zelf je persoonlijke medicatie, voorschriften en medische hulpmiddelen voor de gekozen periode. Dit systeem geeft geen persoonlijk medicatieadvies en levert geen receptmedicatie.

**Pijnstilling**

> Pijnstilling is persoonlijk en contextafhankelijk. Deze fase voegt geen generieke pijnstiller toe; leg dit alleen vast als checklist- of overlegpunt.

---

## 17. Expected output Basis

Voor:

```text
addon=ehbo_persoonlijke_zorg
tier=basis
```

moet de Basis-output inhoudelijk minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie |
|---|---|---|
| EHBO basis | `IOE-FIRSTAID-KIT-BASIC` | Core |
| Pleisters | `IOE-PLASTERS-BASIC` | Core |
| Steriel gaas | `IOE-STERILE-GAUZE-BASIC` | Core/supporting |
| Wondreiniging | `IOE-WOUND-CLEANING-BASIC` | Core/supporting |
| Verbandtape | `IOE-MEDICAL-TAPE-BASIC` | Accessory/supporting |
| Handschoenen | `IOE-GLOVES-NITRILE-BASIC` | Accessory/core for handling |

Basis mag geen generieke medicatie of pijnstillers bevatten.

---

## 18. Expected output Basis+

Voor:

```text
addon=ehbo_persoonlijke_zorg
tier=basis_plus
```

moet de Basis+-output inhoudelijk minimaal bevatten:

| Verwachte regel | Conceptitem | Rol-intentie |
|---|---|---|
| EHBO basis+ | `IOE-FIRSTAID-KIT-PLUS` | Core |
| Pleisters | `IOE-PLASTERS-PLUS` | Core |
| Steriel gaas | `IOE-STERILE-GAUZE-PLUS` | Core/supporting |
| Wondreiniging | `IOE-WOUND-CLEANING-PLUS` | Core/supporting |
| Verbandtape | `IOE-MEDICAL-TAPE-PLUS` | Accessory/supporting |
| Handschoenen | `IOE-GLOVES-NITRILE-PLUS` | Accessory/core for handling |
| Thermometer | `IOE-THERMOMETER-PLUS` | Supporting |

Basis+ mag geen generieke medicatie of pijnstillers bevatten.

---

## 19. Coveragecriteria

Een latere output is inhoudelijk voldoende als:

1. `basis-ehbo` is afgedekt door een EHBO-set.
2. `wonden-afdekken` is afgedekt door pleisters en/of gaas.
3. `wondreiniging-ondersteunen` is afgedekt zonder infectiepreventieclaim.
4. `verband-fixeren` is supporting/accessory afgedekt wanneer gaas/verband aanwezig is.
5. `zorg-handbescherming` is afgedekt waar wondzorg/handling dit vereist.
6. `temperatuur-controleren` is supporting afgedekt in Basis+ als thermometer wordt gekozen.
7. `persoonlijke-medicatie-check` leidt niet tot generiek itemadvies.
8. `pijnstilling-governance-check` leidt niet tot generiek pijnstilleritem.
9. EHBO- en medische claims hebben usage constraints/governance.
10. QA blocking 0 blijft.

---

## 20. Sourcecriteria

- Elke generated line heeft minimaal één source.
- Core lines zijn herleidbaar naar scenario_need en product_rule.
- Accessory lines zijn herleidbaar naar parent item/accessory requirement of scenario context.
- Reused nitril handschoenen mogen meerdere sources hebben als hygiëne/sanitatie en EHBO beide actief zijn.
- Task/content-only medicatie-informatie mag geen generated package line als item worden.
- POC-aannames worden vastgelegd in internal explanation of notes.
- Supplier-offer informatie blijft binnen bestaande velden.
- Geen supplier_offer schema-uitbreiding.
- Geen direct package/add-on → item source.

---

## 21. QA-criteria

De latere implementatie moet minimaal voldoen aan:

- QA blocking = 0.
- Geen active scenario zonder needs.
- Geen active needs zonder capabilities, tenzij content-only volgens bestaand patroon.
- Geen scenario needs zonder product rules voor niet-content-only productbehoeften.
- Geen active items zonder capabilities.
- Geen active consumables zonder quantity policy.
- Geen required accessories zonder candidate item.
- Geen producttype mismatch.
- Geen generated lines zonder sources.
- Geen generated line producttype mismatch.
- Geen medische overclaims.
- Geen medicatieproduct zonder governance.
- Geen pijnstillerproduct in deze baseline.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer schema-uitbreiding.
- Geen directe add-on/package → item koppeling.

---

## 22. Engine-aanpassingen — inhoudelijke verwachting

De engine moet later minimaal ondersteunen of hergebruiken:

- fixed household quantities;
- accessoire requirements bij wondzorg;
- cross-batch reuse/deduplicatie van nitril handschoenen;
- task/content-only needs zonder generated item, als het bestaande schema dit ondersteunt;
- supporting/accessory role-afleiding;
- medische governance zichtbaar in output;
- explanation templates voor EHBO;
- regression per tier;
- QA-controle op medische overclaims.

De engine mag geen generieke medicatie of pijnstillers genereren, en mag geen EHBO-product uitleggen als diagnose/behandeling.

---

## 23. Interne webapp-aanpassing — inhoudelijke verwachting

De interne webapp moet later minimaal ondersteunen:

```text
addon=ehbo_persoonlijke_zorg
tier=basis
tier=basis_plus
```

De webapp moet tonen:

- core EHBO-regels;
- accessoires;
- supporting thermometer;
- quantities;
- sources;
- coverage;
- usage warnings;
- governance notes;
- QA-resultaat;
- verschil tussen Basis en Basis+;
- expliciete melding dat medicatie/pijnstilling niet als generiek item wordt toegevoegd.

---

## 24. Regression test — inhoudelijke specificatie

De latere regression krijgt vermoedelijk:

```text
regression_ehbo_poc.js
npm run test:ehbo-poc
```

De regression moet minimaal valideren:

1. `addon=ehbo_persoonlijke_zorg` werkt voor `tier=basis`.
2. `addon=ehbo_persoonlijke_zorg` werkt voor `tier=basis_plus`.
3. Basis-output bevat EHBO-set.
4. Basis+-output bevat EHBO-set.
5. Basis-output bevat wondafdekking.
6. Basis+-output bevat wondafdekking.
7. Wondreiniging is aanwezig met medische claimbeperking.
8. Verbandtape/fixatie is aanwezig of als accessoire gegenereerd.
9. Handschoenen worden gegenereerd waar wondzorg/handling dit vereist.
10. Basis+ gebruikt betere/hoger passende items dan Basis.
11. Basis+ bevat supporting thermometer of mapping legt expliciet uit waarom niet.
12. Thermometercoverage is supporting, niet diagnostisch.
13. Geen generiek persoonlijk medicatie-item wordt gegenereerd.
14. Geen generiek pijnstilleritem wordt gegenereerd.
15. Geen item maakt diagnose-, behandel-, infectiepreventie- of artsvervangende claims.
16. Usage constraints/governance zijn aanwezig bij EHBO-set, wondreiniging, handschoenen en thermometer.
17. QA generated lines without sources = 0.
18. QA generated line producttype mismatch = 0.
19. QA blocking = 0.
20. `npm run test:stroomuitval-poc` blijft groen.
21. `npm run test:drinkwater-poc` blijft groen.
22. `npm run test:voedsel-poc` blijft groen.
23. `npm run test:hygiene-sanitatie-poc` blijft groen.
24. `npm run test:ehbo-poc` is groen.

---

## 25. Release note — toekomstige baseline

Na implementatie en validatie moet een release note worden toegevoegd voor:

```text
v0.5.0-ehbo-baseline
```

De release note bevat minimaal:

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

## 26. Fase-afrondingscriteria

Fase 4 is technisch pas afgerond als:

- deze specificatie is opgenomen;
- `contentbatch_5_ehbo_persoonlijke_zorg_implementation_mapping.md` is opgenomen;
- mapping-check vóór implementatie is uitgevoerd;
- seed draait zonder schemawijzigingen;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen supplier_offer schema-uitbreiding is gedaan;
- add-on activeert scenario’s;
- geen directe add-on → item koppeling bestaat;
- geen directe package → item koppeling bestaat;
- Basis-output klopt;
- Basis+-output klopt;
- medische governance klopt;
- persoonlijke medicatie niet als generiek item verschijnt;
- pijnstilling niet als generiek item verschijnt;
- usage constraints zichtbaar zijn;
- QA blocking = 0;
- alle regressions groen zijn;
- interne webapp toont EHBO-output correct;
- release note aanwezig is;
- commit en tag pas na volledige validatie zijn gezet.

---

## 27. Samenvatting voor review

Deze specificatie definieert Contentbatch 5 als claimgevoelige baseline voor:

- basis-EHBO;
- kleine wondafdekking;
- wondreiniging;
- verbandfixatie;
- handbescherming bij zorg;
- thermometer als supporting Basis+ optie;
- persoonlijke medicatie als task/checklist/content-only, niet als generiek item;
- pijnstilling als governance/checklist, niet als generiek product;
- medische claimbeperking;
- regressions over alle eerdere contentbatches.

Aanbevolen add-on slug:

```text
ehbo_persoonlijke_zorg
```

Beoogde baseline:

```text
v0.5.0-ehbo-baseline
```
