# contentbatch_6_warmte_droog_shelter_light_implementation_mapping.md

**Project:** Ik overleef  
**Fase:** Fase 5 — Contentbatch 6 Warmte, droog blijven & shelter-light  
**Documenttype:** Implementatie-mapping naar bestaand datamodel  
**Status:** Verplicht vóór seed/engine/webapp/regression implementatie  
**Datum:** 2026-04-28  
**Hoort bij:** `contentbatch_6_warmte_droog_shelter_light_v1.md`  
**Vorige baseline:** `v0.5.0-ehbo-baseline`  
**Beoogde baseline na implementatie:** `v0.6.0-warmte-droog-shelter-light-baseline`

---

## 0. Doel en harde implementatieregel

Dit document vertaalt de inhoudelijke specificatie voor Contentbatch 6 naar de bestaande database- en engineconventies van Ik overleef.

De specificatie beschrijft wat inhoudelijk moet kloppen. Dit mappingdocument bepaalt hoe dat binnen het bestaande datamodel moet worden geïmplementeerd.

Er worden geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen toegevoegd zonder expliciete toestemming.

---

## 1. Definitieve add-on slug

Gebruik consequent:

```text
addon=warmte_droog_shelter_light
```

De add-on mag alleen scenario's activeren via bestaande add-on-scenario mechaniek.

Niet toegestaan:

- add-on direct koppelen aan item;
- add-on direct koppelen aan productvariant;
- add-on direct koppelen aan item candidate;
- package direct koppelen aan item;
- package direct koppelen aan productvariant.

---

## 2. Code naar database-slug mapping

### 2.1 Add-on

| Specificatiecode | Database-slug |
|---|---|
| `ADDON-WARMTH-DRY-SHELTER-LIGHT` | `warmte_droog_shelter_light` |

### 2.2 Scenario's

| Specificatiecode | Database-slug |
|---|---|
| `SCN-WARMTH-72H-HOME` | `warmtebehoud-thuis-72u` |
| `SCN-DRY-STAY-72H-HOME` | `droog-blijven-thuis-72u` |
| `SCN-SHELTER-LIGHT-72H-HOME` | `beschutting-light-thuis-72u` |

### 2.3 Needs

| Specificatiecode | Database-slug |
|---|---|
| `NEED-WARMTH-RETENTION` | `warmte-behouden` |
| `NEED-WARMTH-BACKUP-EMERGENCY` | `noodwarmte-backup` |
| `NEED-DRY-PERSONAL-RAIN` | `persoonlijk-droog-blijven` |
| `NEED-SHELTER-LIGHT-COVER` | `lichte-beschutting` |
| `NEED-SHELTER-ANCHORING` | `beschutting-bevestigen` |
| `NEED-GROUND-MOISTURE-BARRIER` | `grondvocht-barriere` |

### 2.4 Capabilities

| Specificatiecode | Database-slug |
|---|---|
| `CAP-THERMAL-BLANKET-WARMTH` | `warmtedeken-gebruiken` |
| `CAP-EMERGENCY-BLANKET-REFLECTIVE` | `nooddeken-reflecterend` |
| `CAP-RAIN-PONCHO-PERSONAL` | `regenponcho-gebruiken` |
| `CAP-TARP-LIGHT-COVER` | `tarp-light-beschutting` |
| `CAP-SHELTER-ANCHORING` | `beschutting-bevestigen` |
| `CAP-GROUND-MOISTURE-BARRIER` | `grondvocht-afschermen` |

### 2.5 Producttypes

| Specificatiecode | Database-slug |
|---|---|
| `PTYPE-THERMAL-BLANKET` | `warmtedeken` |
| `PTYPE-EMERGENCY-BLANKET` | `nooddeken` |
| `PTYPE-RAIN-PONCHO` | `regenponcho` |
| `PTYPE-TARP-LIGHT` | `tarp-light` |
| `PTYPE-PARACORD` | `paracord` |
| `PTYPE-TARP-PEGS` | `tarp-haringen` |
| `PTYPE-GROUNDSHEET` | `grondzeil` |

### 2.6 Productvarianten

| Specificatiecode | Database-slug | Tier |
|---|---|---|
| `VAR-THERMAL-BLANKET-BASIC` | `warmtedeken-basis` | `basis` |
| `VAR-THERMAL-BLANKET-PLUS` | `warmtedeken-basis-plus` | `basis_plus` |
| `VAR-EMERGENCY-BLANKET-BASIC` | `nooddeken-basis` | `basis` |
| `VAR-EMERGENCY-BIVVY-PLUS` | `nooddeken-basis-plus` | `basis_plus` |
| `VAR-RAIN-PONCHO-BASIC` | `regenponcho-basis` | `basis` |
| `VAR-RAIN-PONCHO-PLUS` | `regenponcho-basis-plus` | `basis_plus` |
| `VAR-TARP-LIGHT-BASIC` | `tarp-light-basis` | `basis` |
| `VAR-TARP-LIGHT-PLUS` | `tarp-light-basis-plus` | `basis_plus` |
| `VAR-PARACORD-BASIC` | `paracord-basis` | `basis` |
| `VAR-PARACORD-PLUS` | `paracord-basis-plus` | `basis_plus` |
| `VAR-TARP-PEGS-BASIC` | `tarp-haringen-basis` | `basis` |
| `VAR-TARP-PEGS-PLUS` | `tarp-haringen-basis-plus` | `basis_plus` |
| `VAR-GROUNDSHEET-PLUS` | `grondzeil-basis-plus` | `basis_plus` |

### 2.7 Items

| Item code | Aanbevolen item-slug |
|---|---|
| `IOE-THERMAL-BLANKET-BASIC` | `ioe-thermal-blanket-basic` |
| `IOE-THERMAL-BLANKET-PLUS` | `ioe-thermal-blanket-plus` |
| `IOE-EMERGENCY-BLANKET-BASIC` | `ioe-emergency-blanket-basic` |
| `IOE-EMERGENCY-BIVVY-PLUS` | `ioe-emergency-bivvy-plus` |
| `IOE-PONCHO-BASIC` | `ioe-poncho-basic` |
| `IOE-PONCHO-PLUS` | `ioe-poncho-plus` |
| `IOE-TARP-LIGHT-BASIC` | `ioe-tarp-light-basic` |
| `IOE-TARP-LIGHT-PLUS` | `ioe-tarp-light-plus` |
| `IOE-PARACORD-BASIC` | `ioe-paracord-basic` |
| `IOE-PARACORD-PLUS` | `ioe-paracord-plus` |
| `IOE-TARP-PEGS-BASIC` | `ioe-tarp-pegs-basic` |
| `IOE-TARP-PEGS-PLUS` | `ioe-tarp-pegs-plus` |
| `IOE-GROUNDSHEET-PLUS` | `ioe-groundsheet-plus` |

---

## 3. Geen nieuwe enumwaarden

De volgende specificatietermen zijn semantische intenties of UI-labels, geen vrij te seeden database-enums:

| Term | Niet doen | Wel doen |
|---|---|---|
| `backup warmth` | Niet als nieuwe coverage enum. | `coverage_strength = backup` of `secondary` gebruiken. |
| `supporting shelter` | Niet als nieuwe line-role enum. | Role afleiden uit productregel/source/coverage. |
| `required_accessory` | Niet als coverage enum. | Bestaande accessoiremechaniek gebruiken. |
| `environmental_warning` | Niet als enum toevoegen. | Usage constraints, notes of public warnings. |
| `suffocation_warning` | Niet als enum toevoegen. | Bestaande safety/child/storage warning of notes. |
| `weather_exposure_limit` | Niet als enum toevoegen. | Notes/public explanation/governance. |
| `shelter_light` | Niet als enum toevoegen. | Scenario/producttype/need-slug gebruiken. |

---

## 4. Coverage mapping

Gebruik uitsluitend bestaande coverage enumwaarden. Bekend uit eerdere baselines:

```text
primary
secondary
backup
```

| Specificatieterm | Database-mapping |
|---|---|
| `primary` | `coverage_strength = primary` |
| `supporting` | `coverage_strength = secondary` |
| `backup` | `coverage_strength = backup` |
| `required_accessory` | `is_accessory = true` + `generated_line_source.source_type = accessory_requirement` indien bestaand |

### 4.1 Toegestane sufficient coverage

| Need-slug | Capability-slug | Toegestane sufficient coverage |
|---|---|---|
| `warmte-behouden` | `warmtedeken-gebruiken` | `primary` |
| `noodwarmte-backup` | `nooddeken-reflecterend` | `backup` of `secondary`; niet als slaapcomfort. |
| `persoonlijk-droog-blijven` | `regenponcho-gebruiken` | `primary` |
| `lichte-beschutting` | `tarp-light-beschutting` | `secondary` of `primary` alleen voor shelter-light-scope. |
| `beschutting-bevestigen` | `beschutting-bevestigen` | accessory/supporting |
| `grondvocht-barriere` | `grondvocht-afschermen` | `secondary` |

### 4.2 Verboden coverage

| Item/capability | Verboden coverage |
|---|---|
| Nooddeken | Geen primary slaapcomfort, geen langdurige verwarming, geen medische behandeling. |
| Poncho | Geen shelter-light coverage als volwaardige beschutting. |
| Tarp-light | Geen warmtebehoud coverage. |
| Paracord/haringen | Geen shelter coverage zonder tarp. |
| Grondzeil | Geen slaapmat/shelter coverage als totaaloplossing. |
| Warmtedeken | Geen medische onderkoelingsbehandeling. |

---

## 5. Claim type mapping

Gebruik alleen bestaande `claim_type` waarden. Bekend uit vorige baselines:

```text
verified_spec
assumed
```

| Specificatieterm | Database-mapping |
|---|---|
| `validated` | `verified_spec` indien productspecificatie dit ondersteunt. |
| `poc_assumption` | `assumed` + internal explanation. |
| `environmental_claim` | `verified_spec` of `assumed` met beperkte uitleg; geen nieuwe enum. |
| `not_extreme_weather` | Governance/usage notes, geen claim type. |

Stop en rapporteer als sufficient coverage alleen mogelijk lijkt met een nieuwe claim type waarde.

---

## 6. Usage constraint mapping

Gebruik alleen bestaande `item_usage_constraint` types. Relevante bestaande waarden uit eerdere batches kunnen zijn:

```text
medical_claim_limit
storage_safety
expiry_sensitive
hygiene_contamination_risk
fire_risk
child_safety
disposal_requirement
dosage_warning
```

Inspecteer vóór implementatie welke waarden daadwerkelijk bestaan.

| Conceptterm uit specificatie | Voorkeursmapping | Fallback zonder nieuwe enum |
|---|---|---|
| `fire_risk_near_heat_source` | `fire_risk` | Public/internal warning. |
| `suffocation_or_entanglement_warning` | `child_safety` of bestaande safety constraint | Public/internal warning. |
| `not_for_extreme_weather` | Bestaande safety/governance indien aanwezig | Public/internal warning. |
| `not_medical_hypothermia_treatment` | `medical_claim_limit` indien bestaand | Public/internal warning. |
| `dry_before_storage` | `storage_safety` | Public/internal warning. |
| `check_damage_periodically` | `storage_safety` of expiry/damage note | Internal/public warning. |
| `anchor_safely` | Bestaande safety constraint indien aanwezig | Public/internal warning. |
| `child_safety` | `child_safety` | — |
| `storage_safety` | `storage_safety` | — |

Geen nieuwe constraint-enums toevoegen.

---

## 7. Quantity policy mapping

Gebruik geen nieuwe quantity policy enumwaarden. Hergebruik bestaande mechaniek:

```text
fixed
per_person
per_person_per_day
pack_size
min_quantity
max_quantity
rounding_rule
```

Gebruik `per_person` alleen als dit al bestaat. Als `per_person` niet bestaat, gebruik een bestaand patroon:

- `per_person_per_day` met `duration_day_factor` passend bij bestaande engine, of
- `fixed` POC-aantal voor 2 volwassenen met internal note, als dat de enige schema-veilige optie is.

### 7.1 Conceptterm mapping

| Conceptterm | Database-mapping |
|---|---|
| `per_person` | Bestaande `per_person`, of bestaand alternatief zonder nieuwe enum. |
| `one_per_household` | `fixed`, `base_amount = 1`. |
| `accessory_fixed_one` | Accessoire requirement + fixed 1. |
| `basis_plus_supporting_only` | Tier/productvariant/candidate mapping. |

### 7.2 Aanbevolen POC quantities bij 2 volwassenen / 72 uur

| Producttype | Basis | Basis+ |
|---|---:|---:|
| `warmtedeken` | 2 | 2 |
| `nooddeken` | 2 | 2 |
| `regenponcho` | 2 | 2 |
| `tarp-light` | 1 | 1 |
| `paracord` | 1 | 1 |
| `tarp-haringen` | 1 | 1 |
| `grondzeil` | 0 | 1 |

---

## 8. Accessoire requirement mapping

Gebruik bestaande `item_accessory_requirement` mechaniek waar mogelijk. Gebruik `generated_line_source.source_type = accessory_requirement` alleen als deze waarde al bestaat.

| Parent/context | Required producttype | Required capability | Quantity |
|---|---|---|---|
| `tarp-light` | `paracord` | `beschutting-bevestigen` | fixed 1 |
| `tarp-light` | `tarp-haringen` | `beschutting-bevestigen` | fixed 1 |
| `tarp-light-plus` | `grondzeil` | `grondvocht-afschermen` | fixed 1 of productregel supporting |

Paracord en haringen moeten generated worden als accessories met parent tarp-line, niet als directe add-on-item.

---

## 9. Supplier/source-regels

Geen nieuwe velden toevoegen aan `supplier_offer`.

Niet toevoegen:

```text
source_status
source_url
source_checked_at
claim_coverage
price_status
environmental_rating_status
temperature_rating_status
weatherproof_status
```

POC-sourceinformatie kan worden vastgelegd in bestaande velden, notes, internal explanations, public explanations, claim governance notes of usage constraint notes.

Elke generated package line moet minimaal één `generated_line_source` hebben.

---

## 10. Supporting/core/accessory output mapping

| Producttype | Verwacht intern label | Mapping |
|---|---|---|
| `warmtedeken` | core | Productregel voor `warmte-behouden`. |
| `nooddeken` | backup/supporting | `coverage_strength = backup` of `secondary`, geen slaapcomfort. |
| `regenponcho` | core | Productregel voor `persoonlijk-droog-blijven`. |
| `tarp-light` | supporting/core shelter-light | Productregel voor `lichte-beschutting`. |
| `paracord` | accessory | Accessoire bij tarp. |
| `tarp-haringen` | accessory | Accessoire bij tarp. |
| `grondzeil` | supporting/accessory | Basis+ supporting of accessoire. |

De webapp mag labels zoals `core`, `supporting`, `backup`, `accessory` tonen, maar deze mogen niet als nieuwe database-enums worden toegevoegd.

---

## 11. Seed-implementatieregels

Pas na mapping-check mag een seedbestand worden gemaakt:

```text
contentbatch_6_warmte_droog_shelter_light_seed.sql
```

Seed moet minimaal bevatten:

- add-on `warmte_droog_shelter_light`;
- add-on → scenarioactivatie;
- scenario's, needs, capabilities volgens mapping;
- producttypes;
- productvarianten Basis/Basis+;
- item candidates Basis/Basis+;
- item capabilities;
- productregels;
- quantity policies;
- accessoire requirements;
- supplier offers binnen bestaande velden;
- claim governance / usage constraints binnen bestaande velden;
- explanation templates of item explanations binnen bestaande patronen;
- QA-relevante dekking.

Seed mag niet bevatten:

- nieuwe enumwaarden;
- schemawijzigingen;
- supplier_offer uitbreiding;
- Directus composite-PK wijziging;
- directe add-on → item koppeling;
- directe package → item koppeling;
- volledige evacuatie/slaap/sheltermodule;
- medische hypothermieclaims.

---

## 12. Engine mapping

De engine moet later:

- `addon=warmte_droog_shelter_light` ondersteunen;
- scenario's activeren via add-on;
- per-person quantities of bestaand equivalent toepassen;
- fixed household quantities toepassen;
- accessoire requirements verwerken;
- role-afleiding voor backup/supporting/accessory behouden;
- geen overclaim maken rond shelter, slaapcomfort, extreme weather of hypothermie;
- generated_line_source correct vullen;
- generated_line_coverage correct vullen;
- usage constraints/governance zichtbaar houden;
- bestaande regressions groen houden.

Niet doen:

- geen nieuwe quantity formula enum toevoegen;
- geen hardcoded add-on → item mapping;
- geen schemawijziging voor environmental specs;
- geen full shelter/evacuatie/slaapmodule bouwen.

---

## 13. Interne webapp mapping

De interne webapp moet later minimaal ondersteunen:

```text
addon=warmte_droog_shelter_light
tier=basis
tier=basis_plus
```

Te tonen onderdelen:

- core warmte/droog-regels;
- supporting/backup regels;
- accessories;
- quantities;
- sources;
- coverage;
- usage constraints;
- governance warnings;
- QA-resultaat;
- verschil tussen Basis en Basis+.

---

## 14. Regression mapping

Maak later:

```text
regression_warmte_droog_shelter_poc.js
npm run test:warmte-droog-shelter-poc
```

Gebruik `addon=warmte_droog_shelter_light`.

### Expected output Basis

Minimaal:

- `IOE-THERMAL-BLANKET-BASIC`
- `IOE-EMERGENCY-BLANKET-BASIC`
- `IOE-PONCHO-BASIC`
- `IOE-TARP-LIGHT-BASIC`
- `IOE-PARACORD-BASIC`
- `IOE-TARP-PEGS-BASIC`

### Expected output Basis+

Minimaal:

- `IOE-THERMAL-BLANKET-PLUS`
- `IOE-EMERGENCY-BIVVY-PLUS`
- `IOE-PONCHO-PLUS`
- `IOE-TARP-LIGHT-PLUS`
- `IOE-PARACORD-PLUS`
- `IOE-TARP-PEGS-PLUS`
- `IOE-GROUNDSHEET-PLUS`

### Minimale regression asserts

1. `addon=warmte_droog_shelter_light` werkt voor `tier=basis`.
2. `addon=warmte_droog_shelter_light` werkt voor `tier=basis_plus`.
3. Basis-output bevat warmtedeken.
4. Basis+-output bevat warmtedeken.
5. Basis-output bevat nooddeken.
6. Basis+-output bevat noodbivvy/nooddeken.
7. Basis-output bevat poncho.
8. Basis+-output bevat poncho.
9. Tarp-light verschijnt.
10. Paracord en haringen zijn required accessories bij tarp.
11. Basis+ bevat grondzeil.
12. Nooddeken telt niet als primary slaapcomfort of langdurige verwarming.
13. Poncho telt niet als shelter.
14. Tarp telt niet als warmtebehoud.
15. Usage constraints/governance zijn aanwezig.
16. QA generated lines without sources = 0.
17. QA generated line producttype mismatch = 0.
18. QA blocking = 0.
19. Alle eerdere regressions blijven groen.

---

## 15. Mapping-check vóór implementatie

Voor seed/engine/webapp/regression moet de agent rapporteren:

```md
# Mapping-check Fase 5 — Warmte, droog blijven & shelter-light

## Add-on slug
Gekozen slug: `warmte_droog_shelter_light`

## Coverage enumwaarden
Gebruikte bestaande waarden:
- primary
- secondary
- backup

## Claim type waarden
Gebruikte bestaande waarden:
- verified_spec
- assumed

## Usage constraint types
Gebruikte bestaande waarden:
- ...

Geen nieuwe usage_constraint types toegevoegd.

## Generated source types
Gebruikte bestaande waarden:
- scenario_need
- accessory_requirement

## Quantity policy mapping
- `per_person` → bestaand `per_person` of bestaand schema-veilig alternatief
- `one_per_household` → `fixed`, `base_amount = 1`
- `accessory_fixed_one` → accessoire requirement + fixed quantity
- `basis_plus_supporting_only` → tier/productvariant/candidate mapping

## Accessoire requirement mapping
- tarp-light → paracord
- tarp-light → tarp-haringen
- tarp-light-plus → grondzeil of supporting productregel

## Schema-impact
- Geen schemawijziging nodig.
- Geen supplier_offer uitbreiding nodig.
- Geen Directus composite-PK wijziging nodig.
- Geen package/add-on → item koppeling toegevoegd.
- Geen package → item koppeling toegevoegd.
- Geen nieuwe enumwaarden nodig.

## Go / no-go
Conclusie:
- Implementatie kan doorgaan binnen bestaand datamodel.
```

Als een van deze punten niet binnen het bestaande datamodel past, stop dan en rapporteer de blokkade.

---

## 16. Release note en tag na implementatie

Na volledige implementatie en groene validatie moet een release note worden toegevoegd voor:

```text
v0.6.0-warmte-droog-shelter-light-baseline
```

Tag alleen na volledige validatie.

---

## 17. Samenvatting voor implementatie

Definitieve mappingkeuzes:

- Add-on slug: `warmte_droog_shelter_light`
- Scenario's:
  - `warmtebehoud-thuis-72u`
  - `droog-blijven-thuis-72u`
  - `beschutting-light-thuis-72u`
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer uitbreiding.
- Geen directe package/add-on → item koppeling.
- Nooddeken blijft backup/supporting.
- Poncho blijft persoonlijke regenbescherming.
- Tarp-light blijft shelter-light, geen full shelter.
- Tarp-accessoires via bestaande accessoiremechaniek.
