# contentbatch_5_ehbo_persoonlijke_zorg_implementation_mapping.md

**Project:** Ik overleef  
**Fase:** Fase 4 — Contentbatch 5 EHBO & persoonlijke zorg  
**Documenttype:** Implementatie-mapping naar bestaand datamodel  
**Status:** Verplicht vóór seed/engine/webapp/regression implementatie  
**Datum:** 2026-04-28  
**Hoort bij:** `contentbatch_5_ehbo_persoonlijke_zorg_v1.md`  
**Vorige baseline:** `v0.4.0-hygiene-sanitatie-baseline`  
**Beoogde baseline na implementatie:** `v0.5.0-ehbo-baseline`

---

## 0. Doel en harde implementatieregel

Dit document vertaalt de inhoudelijke specificatie voor Contentbatch 5 naar de bestaande database- en engineconventies van Ik overleef.

Vanaf Fase 4 blijft verplicht:

1. eerst inhoudelijke specificatie;
2. daarna expliciete implementatie-mapping;
3. daarna mapping-check;
4. pas daarna seed/engine/webapp/regression;
5. release note, commit, tag en push pas na volledige validatie.

Geen nieuwe enumwaarden, schemawijzigingen, supplier_offer-uitbreiding, Directus composite-PK wijziging of directe add-on/package → item koppeling zonder expliciete toestemming.

---

## 1. Definitieve add-on slug

Gebruik voor Fase 4 consequent:

```text
addon=ehbo_persoonlijke_zorg
```

Deze slug is gekozen omdat EHBO én persoonlijke zorg allebei onderdeel van de batchscope zijn. Persoonlijke medicatie/checklist is inhoudelijk onderdeel van deze batch, ook al wordt het geen generiek product.

Als de database al een andere slug vereist, bijvoorbeeld `ehbo`, moet de agent vóór implementatie stoppen en rapporteren:

- welke slug al bestaat;
- waarom die gekozen zou moeten worden;
- impact op seed, engine, webapp en regression;
- of dit de persoonlijke-zorgscope versmalt.

Zonder akkoord blijft `ehbo_persoonlijke_zorg` leidend.

---

## 2. Code naar database-slug mapping

### Add-on

| Specificatiecode | Database-slug |
|---|---|
| `ADDON-FIRST-AID-PERSONAL-CARE` | `ehbo_persoonlijke_zorg` |

### Scenario’s

| Specificatiecode | Database-slug |
|---|---|
| `SCN-FIRST-AID-WOUND-72H-HOME` | `ehbo-wondzorg-thuis-72u` |
| `SCN-PERSONAL-CARE-72H-HOME` | `persoonlijke-zorg-thuis-72u` |
| `SCN-MEDICATION-CHECK-72H-HOME` | `persoonlijke-medicatie-check-thuis-72u` |

### Needs

| Specificatiecode | Database-slug | Implementatienotitie |
|---|---|---|
| `NEED-FIRST-AID-BASE` | `basis-ehbo` | Productneed. |
| `NEED-WOUND-COVERAGE` | `wonden-afdekken` | Productneed. |
| `NEED-WOUND-CLEANING` | `wondreiniging-ondersteunen` | Productneed met claimbeperking. |
| `NEED-BANDAGE-FIXATION` | `verband-fixeren` | Accessory/supporting. |
| `NEED-CARE-HAND-PROTECTION` | `zorg-handbescherming` | Accessory/core for handling. |
| `NEED-TEMPERATURE-CHECK` | `temperatuur-controleren` | Supporting, vooral Basis+. |
| `NEED-PERSONAL-MEDICATION-CHECK` | `persoonlijke-medicatie-check` | Task/content-only, geen item. |
| `NEED-PAIN-RELIEF-GOVERNANCE` | `pijnstilling-governance-check` | Task/content-only, geen item. |

### Capabilities

| Specificatiecode | Database-slug |
|---|---|
| `CAP-FIRST-AID-KIT-BASE` | `basis-ehbo-set-gebruiken` |
| `CAP-WOUND-COVER-PLASTER` | `pleisters-gebruiken` |
| `CAP-WOUND-COVER-GAUZE` | `steriel-gaas-gebruiken` |
| `CAP-WOUND-CLEANING-SUPPORT` | `wondreiniging-ondersteunen` |
| `CAP-BANDAGE-FIXATION` | `verband-fixeren` |
| `CAP-DISPOSABLE-CARE-GLOVES` | `wegwerp-handschoenen-zorg` |
| `CAP-TEMPERATURE-MEASUREMENT` | `temperatuur-meten` |
| `CAP-PERSONAL-MEDICATION-REMINDER` | `persoonlijke-medicatie-herinneren` |
| `CAP-PAIN-RELIEF-CHECKLIST` | `pijnstilling-checklist` |

### Producttypes

| Specificatiecode | Database-slug | Opmerking |
|---|---|---|
| `PTYPE-FIRST-AID-KIT` | `ehbo-set` | Nieuw producttype. |
| `PTYPE-PLASTERS` | `pleisters` | Nieuw producttype. |
| `PTYPE-STERILE-GAUZE` | `steriel-gaas` | Nieuw producttype. |
| `PTYPE-WOUND-CLEANING` | `wondreiniging` | Nieuw producttype. |
| `PTYPE-MEDICAL-TAPE` | `verbandtape` | Nieuw producttype. |
| `PTYPE-NITRILE-GLOVES` | `nitril-handschoenen` | Reuse bestaand producttype uit Fase 3 indien aanwezig. |
| `PTYPE-THERMOMETER` | `thermometer` | Nieuw producttype, supporting. |

Niet toevoegen als producttype:

- persoonlijke medicatie;
- pijnstillers;
- antibiotica;
- receptmedicatie;
- medische diagnose.

### Productvarianten

| Specificatiecode | Database-slug | Tier |
|---|---|---|
| `VAR-FIRST-AID-KIT-BASIC` | `ehbo-set-basis` | `basis` |
| `VAR-FIRST-AID-KIT-PLUS` | `ehbo-set-basis-plus` | `basis_plus` |
| `VAR-PLASTERS-BASIC` | `pleisters-basis` | `basis` |
| `VAR-PLASTERS-PLUS` | `pleisters-basis-plus` | `basis_plus` |
| `VAR-STERILE-GAUZE-BASIC` | `steriel-gaas-basis` | `basis` |
| `VAR-STERILE-GAUZE-PLUS` | `steriel-gaas-basis-plus` | `basis_plus` |
| `VAR-WOUND-CLEANING-BASIC` | `wondreiniging-basis` | `basis` |
| `VAR-WOUND-CLEANING-PLUS` | `wondreiniging-basis-plus` | `basis_plus` |
| `VAR-MEDICAL-TAPE-BASIC` | `verbandtape-basis` | `basis` |
| `VAR-MEDICAL-TAPE-PLUS` | `verbandtape-basis-plus` | `basis_plus` |
| `VAR-GLOVES-NITRILE-BASIC` | `nitril-handschoenen-basis` | `basis` |
| `VAR-GLOVES-NITRILE-PLUS` | `nitril-handschoenen-basis-plus` | `basis_plus` |
| `VAR-THERMOMETER-PLUS` | `thermometer-basis-plus` | `basis_plus` |

### Items

| Item code | Aanbevolen item-slug |
|---|---|
| `IOE-FIRSTAID-KIT-BASIC` | `ioe-firstaid-kit-basic` |
| `IOE-FIRSTAID-KIT-PLUS` | `ioe-firstaid-kit-plus` |
| `IOE-PLASTERS-BASIC` | `ioe-plasters-basic` |
| `IOE-PLASTERS-PLUS` | `ioe-plasters-plus` |
| `IOE-STERILE-GAUZE-BASIC` | `ioe-sterile-gauze-basic` |
| `IOE-STERILE-GAUZE-PLUS` | `ioe-sterile-gauze-plus` |
| `IOE-WOUND-CLEANING-BASIC` | `ioe-wound-cleaning-basic` |
| `IOE-WOUND-CLEANING-PLUS` | `ioe-wound-cleaning-plus` |
| `IOE-MEDICAL-TAPE-BASIC` | `ioe-medical-tape-basic` |
| `IOE-MEDICAL-TAPE-PLUS` | `ioe-medical-tape-plus` |
| `IOE-GLOVES-NITRILE-BASIC` | `ioe-gloves-nitrile-basic`, reuse indien bestaand |
| `IOE-GLOVES-NITRILE-PLUS` | `ioe-gloves-nitrile-plus`, reuse indien bestaand |
| `IOE-THERMOMETER-PLUS` | `ioe-thermometer-plus` |

Niet genereren:

- `IOE-PAINKILLERS-*`;
- `IOE-PERSONAL-MEDICATION-*`;
- `IOE-ANTIBIOTICS-*`;
- `IOE-PRESCRIPTION-*`.

---

## 3. Geen nieuwe enumwaarden

De volgende termen zijn semantische intenties of UI-labels, geen database-enums:

| Term | Niet doen | Wel doen |
|---|---|---|
| `medical_governance` | Niet als enum toevoegen. | Vastleggen via claim governance, usage constraints, notes of explanations. |
| `task` | Niet als nieuwe line enum toevoegen. | Alleen gebruiken als bestaand task/checklistconcept bestaat; anders content-only/notes. |
| `checklist` | Niet als enum toevoegen. | Bestaand taskconcept gebruiken of notes/explanations. |
| `supporting` | Niet als nieuwe coverage enum toevoegen. | Mappen naar `secondary` of `backup`, plus role afleiden. |
| `required_accessory` | Niet als coverage enum toevoegen. | Gebruik bestaande accessoiremechaniek. |
| `not_medical_advice` | Niet als nieuwe enum toevoegen. | Mappen naar `medical_claim_limit` of notes/public warning als bestaand. |
| `poc_assumption` | Niet als enum toevoegen. | Vastleggen in internal explanation/notes. |
| `pain_relief_governance` | Niet als product enum toevoegen. | Task/content-only/governance; geen pijnstilleritem. |

---

## 4. Coverage mapping

Gebruik uitsluitend bestaande coverage enumwaarden. Bekende gebruikte waarden:

```text
primary
secondary
backup
```

| Need-slug | Capability-slug | Toegestane sufficient coverage |
|---|---|---|
| `basis-ehbo` | `basis-ehbo-set-gebruiken` | `primary`, met medische claimbeperking. |
| `wonden-afdekken` | `pleisters-gebruiken` | `primary`, kleine wonden. |
| `wonden-afdekken` | `steriel-gaas-gebruiken` | `primary` of `secondary`, afhankelijk productregel. |
| `wondreiniging-ondersteunen` | `wondreiniging-ondersteunen` | `primary` of `secondary`; geen infectiepreventieclaim. |
| `verband-fixeren` | `verband-fixeren` | `secondary` of accessory coverage. |
| `zorg-handbescherming` | `wegwerp-handschoenen-zorg` | `primary` for handling; geen steriele bescherming. |
| `temperatuur-controleren` | `temperatuur-meten` | `secondary`; geen diagnose. |
| `persoonlijke-medicatie-check` | `persoonlijke-medicatie-herinneren` | Geen generated itemcoverage; content-only/task. |
| `pijnstilling-governance-check` | `pijnstilling-checklist` | Geen generated itemcoverage; content-only/task. |

Verboden coverage:

- EHBO-set mag geen professionele zorg, diagnose of volledige medische behandeling dekken.
- Pleisters/gaas mogen geen infectiebehandeling claimen.
- Wondreiniging mag niet claimen dat het infecties voorkomt of behandelt.
- Handschoenen mogen geen steriele medische bescherming claimen.
- Thermometer mag geen diagnose of behandeladvies claimen.
- Medicatie/pijnstilling krijgt geen generated productcoverage in deze fase.

---

## 5. Claim type mapping

Gebruik alleen bestaande `claim_type` waarden. Bekend uit vorige batches:

```text
verified_spec
assumed
```

Als `tested` aantoonbaar bestaat, mag die alleen worden gebruikt voor werkelijk geteste claims.

| Capability | Aanbevolen claim type | Opmerking |
|---|---|---|
| `basis-ehbo-set-gebruiken` | `verified_spec` of `assumed` | Geen volledige medische dekking. |
| `pleisters-gebruiken` | `verified_spec` of `assumed` | Kleine wondafdekking. |
| `steriel-gaas-gebruiken` | `verified_spec` of `assumed` | Geen infectiegarantie. |
| `wondreiniging-ondersteunen` | `verified_spec` of `assumed` | Reinigen volgens instructie; geen behandeling. |
| `verband-fixeren` | `verified_spec` of `assumed` | Fixatie. |
| `wegwerp-handschoenen-zorg` | `verified_spec` of `assumed` | Geen medische steriliteit. |
| `temperatuur-meten` | `verified_spec` of `assumed` | Meten, geen diagnose. |

Stop en rapporteer als `verified_spec` of `assumed` niet bestaan.

---

## 6. Usage constraint mapping

Gebruik alleen bestaande `item_usage_constraint` types. Bekende of inmiddels gebruikte constrainttypes kunnen onder meer zijn:

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

Gebruik alleen waarden die werkelijk in het bestaande schema/seedpatroon beschikbaar zijn. Als een gewenste nuance niet als bestaande enum bestaat, leg die vast in public_warning, internal_notes, item notes, claim governance of explanation.

| Conceptterm | Voorkeursmapping | Fallback zonder nieuwe enum |
|---|---|---|
| `not_medical_advice` | `medical_claim_limit` | Public/internal explanation. |
| `seek_professional_help` | `medical_claim_limit` | Public warning bij EHBO/wondproducten. |
| `check_expiry_periodically` | `expiry_sensitive` | Public/internal warning. |
| `single_use` | `disposal_requirement` of bestaande usage constraint | Public warning. |
| `keep_away_from_children` | `child_safety` | Vooral wondreiniging/EHBO-set. |
| `store_cool_dry` | `storage_safety` | Pleisters, gaas, tape, wondreiniging. |
| `dispose_safely` | `disposal_requirement` | Gebruikte pleisters/gaas/handschoenen. |
| `allergy_sensitivity_warning` | `medical_claim_limit` of notes | Geen nieuwe enum. |
| `temperature_not_diagnosis` | `medical_claim_limit` | Public warning bij thermometer. |
| `medication_personal_check_only` | `medical_claim_limit` of content-only note | Geen item. |

Minimale usage warnings:

- EHBO-set: `medical_claim_limit`, `storage_safety`, `expiry_sensitive`, `child_safety`.
- Pleisters: `medical_claim_limit`, `expiry_sensitive`, `storage_safety`, eventueel `disposal_requirement`.
- Steriel gaas: `medical_claim_limit`, `expiry_sensitive`, `storage_safety`, `disposal_requirement`.
- Wondreiniging: `medical_claim_limit`, `expiry_sensitive`, `child_safety`, `storage_safety`.
- Verbandtape: `medical_claim_limit`, `storage_safety`, allergie/sensitivity in notes.
- Nitril handschoenen: `medical_claim_limit`, `hygiene_contamination_risk`, `disposal_requirement`.
- Thermometer: `medical_claim_limit`, `storage_safety`, eventueel `child_safety`.
- Medicatie/pijnstilling notes: `medical_claim_limit` of content-only warning.

---

## 7. Quantity policy mapping

Gebruik geen nieuwe `quantity_policy.formula_type` of rounding enums.

| Conceptterm | Database-mapping | Opmerking |
|---|---|---|
| `one_per_household` | `fixed`, `base_amount = 1` | Geen nieuwe enum. |
| `one_pack_per_household` | `fixed`, `base_amount = 1` | Eén pack als POC-baseline. |
| `fixed_care_pack` | `fixed`, `base_amount = 1` | Geen nieuwe formula_type. |
| `when_wound_care_required` | Accessoire requirement of scenario_need product rule + fixed quantity | Geen nieuwe formula_type. |
| `basis_plus_supporting_only` | Tier-specific productvariant/candidate/productregel | Geen nieuwe enum. |

Aanbevolen POC quantities:

| Producttype | Basis | Basis+ | Opmerking |
|---|---:|---:|---|
| `ehbo-set` | 1 | 1 | Betere variant in Basis+. |
| `pleisters` | 1 pack | 1 pack | Betere/diversere variant in Basis+. |
| `steriel-gaas` | 1 pack | 1 pack | Betere/ruimere variant in Basis+. |
| `wondreiniging` | 1 | 1 | Betere variant in Basis+. |
| `verbandtape` | 1 | 1 | Accessory/supporting. |
| `nitril-handschoenen` | 1 pack | 1 pack | Reuse/dedup. |
| `thermometer` | 0 | 1 | Supporting Basis+. |
| `persoonlijke medicatie` | 0 | 0 | Task/content-only. |
| `pijnstilling` | 0 | 0 | Governance/checklist. |

---

## 8. Accessoire requirement mapping

Gebruik bestaande `item_accessory_requirement` mechaniek waar mogelijk. Gebruik `generated_line_source.source_type = accessory_requirement` alleen als deze waarde al bestaat.

| Parent/context | Required producttype | Required capability | Quantity mapping | Opmerking |
|---|---|---|---|---|
| `steriel-gaas` | `verbandtape` | `verband-fixeren` | fixed 1 | Fixatie van gaas. |
| `ehbo-set` of wondzorgcontext | `nitril-handschoenen` | `wegwerp-handschoenen-zorg` | fixed 1 pack | Handbescherming bij wondzorg. |
| `wondreiniging` | `nitril-handschoenen` | `wegwerp-handschoenen-zorg` | fixed 1 pack | Dedupen. |

### Reuse van nitril handschoenen

Fase 3 heeft `nitril-handschoenen` en `IOE-GLOVES-NITRILE-BASIC/PLUS` geïntroduceerd. Fase 4 moet die bestaande producttypes/items hergebruiken als ze bestaan.

Niet doen:

- geen tweede producttype `zorg-handschoenen` toevoegen als `nitril-handschoenen` voldoende is;
- geen duplicaat-SKU maken voor dezelfde handschoenfunctie;
- geen nieuwe enumwaarde voor cross-batch reuse.

Als de bestaande item/candidate structuur hergebruik blokkeert, rapporteer dat vóór implementatie.

---

## 9. Task/content-only mapping

### Persoonlijke medicatie

Persoonlijke medicatie is geen generiek item.

Voorkeursmapping:

1. Als het bestaande schema tasks/checklists ondersteunt: gebruik bestaande task/checklistmechaniek, zonder product item, zonder supplier offer en zonder generated package line als product.
2. Als task/checklist nog niet bestaat: gebruik `content_only = true` need waar het bestaande schema dat ondersteunt, of leg de waarschuwing vast in public/internal explanation/governance.
3. Regression moet altijd valideren dat er géén generiek medicatie-item wordt gegenereerd.

### Pijnstilling

Niet doen:

- geen generiek pijnstilleritem;
- geen doseringsadvies;
- geen aanbeveling voor specifieke werkzame stof;
- geen leeftijds-/gezondheidsadvies.

Alleen toegestaan:

- content-only note;
- task/checklist als bestaand schema dit ondersteunt;
- public warning dat gebruiker eigen situatie moet controleren.

---

## 10. Supplier/source-regels

Geen supplier_offer schema-uitbreiding.

Niet toevoegen:

```text
medical_claim_status
expiry_status
sterility_status
medicine_status
source_checked_at
claim_coverage
price_status
```

Elke generated package line moet minimaal één source hebben. Medicatie/pijnstilling krijgt geen generated product line.

---

## 11. Supporting/core/accessory output mapping

| Producttype | Verwacht intern label | Mapping |
|---|---|---|
| `ehbo-set` | core | Productregel voor `basis-ehbo`. |
| `pleisters` | core | Productregel voor `wonden-afdekken`. |
| `steriel-gaas` | core/supporting | Productregel voor `wonden-afdekken`. |
| `wondreiniging` | core/supporting | Productregel voor `wondreiniging-ondersteunen`. |
| `verbandtape` | accessory/supporting | Accessoire bij gaas/verband. |
| `nitril-handschoenen` | accessory/core for handling | Required bij wondzorg. |
| `thermometer` | supporting | Secondary coverage, geen diagnose. |
| `persoonlijke medicatie` | task/content-only | Geen itemline. |
| `pijnstilling` | task/content-only | Geen itemline. |

Webapp-labels mogen worden afgeleid uit bestaande velden. Voeg geen nieuwe database-enums toe voor `task`, `warning` of `supporting`.

---

## 12. Seed-implementatieregels

Seedbestand:

```text
contentbatch_5_ehbo_persoonlijke_zorg_seed.sql
```

Seed moet minimaal bevatten:

- add-on `ehbo_persoonlijke_zorg`;
- scenarioactivatie via add-on → scenario’s;
- scenario’s volgens mapping;
- needs volgens mapping;
- capabilities volgens mapping;
- producttypes volgens mapping, met reuse van `nitril-handschoenen` indien bestaand;
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

Seed mag niet bevatten:

- nieuwe enumwaarden;
- schemawijzigingen;
- supplier_offer uitbreiding;
- directe add-on → item koppeling;
- directe package → item koppeling;
- generieke medicatie-items;
- generieke pijnstiller-items;
- doseringsadvies.

---

## 13. Engine mapping

De engine moet later:

- `addon=ehbo_persoonlijke_zorg` ondersteunen;
- scenario’s activeren via add-on;
- fixed quantities verwerken;
- accessoire requirements verwerken;
- cross-batch deduplicatie van handschoenen behouden;
- supporting thermometer zichtbaar houden;
- medische governance zichtbaar houden in output;
- personal medication/pain relief niet als product genereren;
- QA blocking correct laten werken.

Niet doen:

- geen nieuwe quantity formula enum;
- geen hardcoded add-on → item mapping;
- geen medische claimlogica buiten bestaande governance/constraintmechaniek;
- geen generieke medicatie-itemgeneratie;
- geen pijnstiller-itemgeneratie;
- geen diagnose-/behandeladvies.

---

## 14. Interne webapp mapping

De interne webapp moet later minimaal ondersteunen:

```text
addon=ehbo_persoonlijke_zorg
tier=basis
tier=basis_plus
```

De webapp moet tonen:

- core EHBO-regels;
- accessories;
- supporting thermometer;
- quantities;
- sources;
- coverage;
- usage constraints;
- governance/public warnings;
- QA-resultaat;
- verschil tussen Basis en Basis+;
- melding of open punt rond persoonlijke medicatie/task-output.

Geen checkout, account, betaalflow, voorraadreservering of leverancierintegratie.

---

## 15. Regression mapping

Maak later:

```text
regression_ehbo_poc.js
npm run test:ehbo-poc
```

Gebruik `addon=ehbo_persoonlijke_zorg`, tenzij de mapping-check expliciet een andere bestaande slug goedkeurt.

### Expected output Basis

- `IOE-FIRSTAID-KIT-BASIC`
- `IOE-PLASTERS-BASIC`
- `IOE-STERILE-GAUZE-BASIC`
- `IOE-WOUND-CLEANING-BASIC`
- `IOE-MEDICAL-TAPE-BASIC`
- `IOE-GLOVES-NITRILE-BASIC` indien bestaand herbruikbaar

Niet bevatten:

- pijnstilleritem;
- persoonlijk medicatieitem;
- antibioticumitem;
- receptmedicatieitem.

### Expected output Basis+

- `IOE-FIRSTAID-KIT-PLUS`
- `IOE-PLASTERS-PLUS`
- `IOE-STERILE-GAUZE-PLUS`
- `IOE-WOUND-CLEANING-PLUS`
- `IOE-MEDICAL-TAPE-PLUS`
- `IOE-GLOVES-NITRILE-PLUS` indien bestaand herbruikbaar
- `IOE-THERMOMETER-PLUS`

Niet bevatten:

- pijnstilleritem;
- persoonlijk medicatieitem;
- antibioticumitem;
- receptmedicatieitem.

### Minimale regression asserts

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
11. Basis+ bevat supporting thermometer of mapping legt uit waarom niet.
12. Thermometercoverage is supporting, niet diagnostisch.
13. Geen generiek persoonlijk medicatie-item wordt gegenereerd.
14. Geen generiek pijnstilleritem wordt gegenereerd.
15. Geen diagnose-, behandel-, infectiepreventie- of artsvervangende claims.
16. Usage constraints/governance zijn aanwezig.
17. QA generated lines without sources = 0.
18. QA generated line producttype mismatch = 0.
19. QA blocking = 0.
20. Alle eerdere regressions blijven groen.
21. `npm run test:ehbo-poc` is groen.

---

## 16. Mapping-check vóór implementatie

Voor seed/engine/webapp/regression moet eerst een mapping-check rapportage worden gemaakt:

```md
# Mapping-check Fase 4 — EHBO & persoonlijke zorg

## Add-on slug
Gekozen slug: `ehbo_persoonlijke_zorg`

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
- medical_claim_limit
- storage_safety
- expiry_sensitive
- hygiene_contamination_risk
- child_safety
- disposal_requirement
- ...

Geen nieuwe usage_constraint types toegevoegd.

## Generated source types
Gebruikte bestaande waarden:
- scenario_need
- accessory_requirement

Geen nieuwe source_type enumwaarden toegevoegd.

## Quantity policy mapping
- `one_per_household` → `fixed`, `base_amount = 1`
- `one_pack_per_household` → `fixed`, `base_amount = 1`
- `fixed_care_pack` → `fixed`, `base_amount = 1`
- `when_wound_care_required` → accessoire requirement + fixed quantity
- `basis_plus_supporting_only` → tier/productvariant/candidate mapping

Geen nieuwe quantity policy enumwaarden toegevoegd.

## Task/content-only mapping
- `persoonlijke-medicatie-check` → bestaand task/checklistconcept indien aanwezig; anders content_only/notes.
- `pijnstilling-governance-check` → bestaand task/checklistconcept indien aanwezig; anders content_only/notes.
- Geen generieke medicatie-items.
- Geen pijnstiller-items.

## Reuse
- `nitril-handschoenen` producttype en `IOE-GLOVES-NITRILE-BASIC/PLUS` worden hergebruikt als bestaand.
- Geen duplicaat-handschoenproducttype toegevoegd.

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

Stop als een van deze punten niet binnen het bestaande datamodel past.

---

## 17. Implementatievolgorde na mapping-check

Pas na groene mapping-check mag de agent implementeren:

1. `contentbatch_5_ehbo_persoonlijke_zorg_seed.sql`
2. engine-aanpassingen voor EHBO/persoonlijke zorg
3. interne webapp-uitbreiding
4. `regression_ehbo_poc.js`
5. npm-script voor `npm run test:ehbo-poc`
6. regressions draaien:
   - `npm run test:stroomuitval-poc`
   - `npm run test:drinkwater-poc`
   - `npm run test:voedsel-poc`
   - `npm run test:hygiene-sanitatie-poc`
   - `npm run test:ehbo-poc`

---

## 18. Release note en tag na implementatie

Na volledige implementatie en groene validatie moet een release note worden toegevoegd voor:

```text
v0.5.0-ehbo-baseline
```

Voorkeurstag:

```text
v0.5.0-ehbo-baseline
```

Een langere tag, zoals `v0.5.0-ehbo-persoonlijke-zorg-baseline`, alleen gebruiken na expliciete goedkeuring.

---

## 19. Samenvatting voor implementatie

Definitieve mappingkeuzes voor Fase 4:

- Add-on slug: `ehbo_persoonlijke_zorg`
- Scenario’s:
  - `ehbo-wondzorg-thuis-72u`
  - `persoonlijke-zorg-thuis-72u`
  - `persoonlijke-medicatie-check-thuis-72u`
- Kernneeds:
  - `basis-ehbo`
  - `wonden-afdekken`
  - `wondreiniging-ondersteunen`
  - `verband-fixeren`
  - `zorg-handbescherming`
  - `temperatuur-controleren`
  - `persoonlijke-medicatie-check`
  - `pijnstilling-governance-check`
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.
- Geen supplier_offer uitbreiding.
- Geen directe package/add-on → item koppeling.
- Geen generieke medicatie-items.
- Geen pijnstiller-items.
- EHBO/persoonlijke zorg claims via bestaande governance/constraints/explanations begrenzen.
- Implementatie pas na mapping-check.
