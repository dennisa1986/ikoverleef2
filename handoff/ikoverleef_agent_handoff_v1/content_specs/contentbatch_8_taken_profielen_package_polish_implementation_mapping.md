# contentbatch_8_taken_profielen_package_polish_implementation_mapping.md

**Project:** Ik overleef  
**Fase:** Fase 7 — Contentbatch 8 Taken, profielafhankelijkheden & package-polish  
**Documenttype:** Implementatie-mapping naar bestaand datamodel  
**Status:** Verplicht vóór seed/engine/webapp/regression implementatie  
**Datum:** 2026-04-29  
**Hoort bij:** `contentbatch_8_taken_profielen_package_polish_v1.md`  
**Vorige baseline:** `v0.7.0-evacuatie-baseline`  
**Beoogde baseline na implementatie:** `v0.8.0-taken-profielen-baseline`

---

## 0. Doel en harde implementatieregel

Dit document vertaalt de inhoudelijke specificatie voor Contentbatch 8 naar bestaande database- en engineconventies.

Deze batch moet nadrukkelijk binnen het bestaande datamodel blijven:

- geen nieuwe enumwaarden;
- geen schemawijzigingen;
- geen supplier_offer uitbreiding;
- geen Directus composite-PK wijziging;
- geen account/profielopslag;
- geen directe package/add-on → item koppeling;
- geen generieke persoonlijke productitems.

---

## 1. Definitieve add-on slug

Gebruik voor deze fase consequent:

```text
addon=taken_profielen
```

Deze slug is gekozen omdat:

- de batch primair tasks/checks en profielafhankelijkheden test;
- package-polish een resultaat is, geen productdomein;
- de slug duidelijk en kort blijft.

Als de bestaande database al een andere slug vereist, stop dan vóór implementatie en rapporteer de afwijking.

---

## 2. Code naar database-slug mapping

### 2.1 Add-on

| Specificatiecode | Database-slug |
|---|---|
| `ADDON-TASKS-PROFILE-POLISH` | `taken_profielen` |

### 2.2 Scenario’s

| Specificatiecode | Database-slug |
|---|---|
| `SCN-PROFILE-TASKS-72H-HOME` | `profiel-taken-thuis-72u` |
| `SCN-CHILDREN-PREPAREDNESS` | `kinderen-voorbereiding-checks` |
| `SCN-PETS-PREPAREDNESS` | `huisdieren-voorbereiding-checks` |
| `SCN-PERSONAL-READINESS` | `persoonlijke-gereedheid-checks` |
| `SCN-PACKAGE-POLISH` | `pakketadvies-polish` |

### 2.3 Needs

| Specificatiecode | Database-slug | Mappingtype |
|---|---|---|
| `NEED-PROFILE-DURATION-CHECK` | `duur-profiel-check` | task/content-only |
| `NEED-CHILDREN-READINESS-CHECK` | `kinderen-gereedheid-check` | task/content-only |
| `NEED-BABY-READINESS-CHECK` | `baby-gereedheid-check` | task/content-only |
| `NEED-PET-READINESS-CHECK` | `huisdieren-gereedheid-check` | task/content-only |
| `NEED-PERSONAL-MEDICATION-CHECK` | `persoonlijke-medicatie-check` | task/content-only |
| `NEED-DOCUMENTS-CONTACTS-CHECK` | `documenten-contacten-check` | task/content-only |
| `NEED-KEYS-CASH-CHARGERS-CHECK` | `sleutels-cash-laders-check` | task/content-only |
| `NEED-PACKAGE-REVIEW-CHECK` | `pakketadvies-controleren` | task/content-only |

### 2.4 Capabilities

| Specificatiecode | Database-slug | Productcoverage |
|---|---|---|
| `CAP-PROFILE-DURATION-REVIEW` | `duur-en-profiel-controleren` | nee |
| `CAP-CHILDREN-PREPAREDNESS-REVIEW` | `kinderen-voorbereiding-controleren` | nee |
| `CAP-BABY-PREPAREDNESS-REVIEW` | `baby-voorbereiding-controleren` | nee |
| `CAP-PET-PREPAREDNESS-REVIEW` | `huisdieren-voorbereiding-controleren` | nee |
| `CAP-PERSONAL-MEDICATION-REVIEW` | `persoonlijke-medicatie-controleren` | nee |
| `CAP-DOCUMENTS-CONTACTS-REVIEW` | `documenten-contacten-controleren` | nee |
| `CAP-KEYS-CASH-CHARGERS-REVIEW` | `sleutels-cash-laders-controleren` | nee |
| `CAP-PACKAGE-REVIEW` | `pakketadvies-periodiek-controleren` | nee |

---

## 3. Geen nieuwe enumwaarden

De volgende termen zijn semantiek, geen database-enums:

```text
task_only
profile_sensitive
package_polish
child_adjusted
pet_adjusted
personal_check
profile_warning
```

Gebruik bestaande velden:

- `need.content_only = true` indien bestaand;
- `preparedness_task`;
- `public/internal notes`;
- bestaande usage constraints;
- bestaande generated task/webapp rendering.

Voeg geen enum toe.

---

## 4. Coverage mapping

Task-only capabilities geven geen generated_line_coverage voor productitems.

Mapping:

| Intentie | Database-mapping |
|---|---|
| Task/check need | `content_only=true` indien bestaand, plus preparedness_task |
| Productcoverage | Niet genereren voor deze batch |
| Profile note | preparedness_task description/internal_notes |
| Package-polish label | webapp-afleiding, geen enum |
| Warning | bestaande usage constraints of notes |

Deze batch mag geen nieuwe productcoverage afdwingen.

---

## 5. Claim type mapping

Gebruik bestaande waarden:

```text
verified_spec
assumed
```

Voor tasks is meestal geen `claim_type` nodig. Als een capability toch in need_capability moet worden vastgelegd, gebruik bestaande waarden alleen als het schema dit vereist en voeg context toe in notes.

Geen medische/persoonlijke claims genereren.

---

## 6. Usage constraint mapping

Gebruik bestaande constraint types indien relevant, bijvoorbeeld:

```text
medical_claim_limit
storage_safety
expiry_sensitive
child_safety
hygiene_contamination_risk
disposal_requirement
```

Voor persoonlijke checks is een constraint meestal niet nodig. Gebruik task notes/public explanation.

Mapping:

| Concept | Bestaande mapping |
|---|---|
| Persoonlijke medicatie | task note + `medical_claim_limit` waar bestaande governance dit vereist |
| Babyspullen | task note, geen product |
| Huisdieren | task note, geen product |
| Documenten/contacten | task note |
| Houdbaarheid controleren | task note, eventueel bestaand `expiry_sensitive` op producten uit eerdere batches |

---

## 7. Preparedness task mapping

Gebruik bestaand `preparedness_task`-mechaniek.

Minimale tasks:

| Task slug | Need slug | Productline? |
|---|---|---|
| `duur-en-huishouden-controleren` | `duur-profiel-check` | nee |
| `kinderen-benodigdheden-check` | `kinderen-gereedheid-check` | nee |
| `baby-benodigdheden-check` | `baby-gereedheid-check` | nee |
| `huisdieren-water-voer-check` | `huisdieren-gereedheid-check` | nee |
| `persoonlijke-medicatie-controleren` | `persoonlijke-medicatie-check` | nee |
| `documenten-en-contacten-controleren` | `documenten-contacten-check` | nee |
| `sleutels-cash-laders-controleren` | `sleutels-cash-laders-check` | nee |
| `houdbaarheid-en-batterijen-controleren` | `pakketadvies-controleren` | nee |
| `pakketadvies-periodiek-herzien` | `pakketadvies-controleren` | nee |

Als taskconditionering op kinderen/huisdieren niet bestaat, gebruik algemene tasktekst:

```text
Indien van toepassing: ...
```

Geen schemawijziging toevoegen voor conditional tasks.

---

## 8. Quantity policy mapping

Deze batch introduceert geen nieuwe quantity policy enumwaarden.

Wel testen/hergebruiken:

| Concept | Mapping |
|---|---|
| `profile_duration_check` | Geen quantity policy; task |
| `children_quantity_effect` | Bestaande `child_factor` in bestaande policies |
| `pet_quantity_effect` | Bestaande `pet_factor` in bestaande policies, indien al gebruikt |
| `duration_effect` | Bestaande `duration_day_factor` |
| `task_only` | Geen quantity policy |
| `fixed_task` | preparedness_task, geen generated_package_line |

Voor regressions mag een run met children/pets/duration uitgevoerd worden op bestaande add-ons om te controleren dat bestaande policies niet breken.

---

## 9. Source mapping

Productlines:

- blijven uit bestaande add-ons komen;
- moeten `generated_line_source` houden.

Tasks:

- komen uit `preparedness_task`;
- moeten herleidbaar zijn naar scenario_need en need;
- worden niet in `generated_package_line` geschreven tenzij het bestaande schema dat al zo doet.

Geen directe add-on → item source.

---

## 10. Webapp/output mapping

De interne webapp mag tonen:

```text
Core items
Accessories
Supporting/backup
Tasks/checks
Warnings
Sources
Coverage
QA
```

Als er geen aparte outputsecties in het datamodel bestaan, moeten deze labels afgeleid worden uit bestaande velden.

Voor tasks:

- toon task title;
- need slug;
- priority;
- public description;
- internal notes;
- eventueel requires_completion.

Geen nieuwe outputsectie in database aanmaken.

---

## 11. Seed-implementatieregels

Seedbestand vermoedelijk:

```text
contentbatch_8_taken_profielen_package_polish_seed.sql
```

Moet minimaal bevatten:

- add-on `taken_profielen`;
- scenario’s uit deze mapping;
- content-only/task needs;
- capabilities indien vereist;
- preparedness_task rows;
- notes/explanations;
- geen producttypes;
- geen item candidates;
- geen supplier offers;
- geen productregels voor persoonlijke tasks;
- geen productitems voor documenten, medicatie, cash, sleutels, baby of huisdieren.

---

## 12. Engine mapping

Engine mag minimaal worden aangepast om:

- `addon=taken_profielen` te ondersteunen;
- preparedness tasks voor actieve scenario’s te tonen;
- tasks bij comma-separated addon combinaties te blijven tonen indien bestaande webapp dat aankan;
- task-only needs buiten productgeneratie te houden;
- profile input in task panel/explanations zichtbaar te maken;
- regressions met kinderen/huisdieren/duration te kunnen draaien.

Niet doen:

- geen nieuwe quantity formula enum;
- geen hardcoded add-on → item mapping;
- geen klantprofielopslag;
- geen taskcondition-schema;
- geen generieke productitems voor persoonlijke zaken.

---

## 13. Interne webapp mapping

Ondersteun minimaal:

```text
/internal/recommendation-poc?addon=taken_profielen&tier=basis
/internal/recommendation-poc?addon=taken_profielen&tier=basis_plus
```

Gewenst als dit schema-/engine-veilig kan:

```text
/internal/recommendation-poc?addon=evacuatie,taken_profielen&tier=basis_plus
```

Als multi-add-on URL niet bestaat, stop niet; rapporteer als open punt of implementeer minimaal zonder schemawijziging.

---

## 14. Regression mapping

Testbestand:

```text
regression_taken_profielen_poc.js
```

Npm-script:

```text
test:taken-profielen-poc
```

Minimale asserts:

1. `addon=taken_profielen` werkt voor Basis.
2. `addon=taken_profielen` werkt voor Basis+.
3. Tasks zijn aanwezig.
4. Profile/duration task is aanwezig.
5. Medicatiecheck-task is aanwezig.
6. Documenten/contacten-task is aanwezig.
7. Kinderencheck-task is aanwezig of als “indien van toepassing”.
8. Huisdierencheck-task is aanwezig of als “indien van toepassing”.
9. Geen medicatie-SKU’s.
10. Geen document/cash/sleutel/contact-SKU’s.
11. Geen baby/huisdierproductmodules.
12. Task-only needs genereren geen productlines.
13. QA blocking = 0.
14. Alle eerdere regressions blijven groen.

Optioneel maar gewenst:

- comborun met `evacuatie,taken_profielen`;
- profielrun met kinderen en huisdieren;
- controle dat bestaande water/food quantities niet regressief breken.

---

## 15. Mapping-check vóór implementatie

De agent moet vóór implementatie rapporteren:

```md
# Mapping-check Fase 7 — Taken, profielafhankelijkheden & package-polish

## Add-on slug
Gekozen slug: `taken_profielen`

## Coverage enumwaarden
Gebruikte bestaande waarden:
- primary
- secondary
- backup

## Claim type waarden
Gebruikte bestaande waarden:
- verified_spec
- assumed

## Task/content-only mapping
- Preparedness tasks gebruikt.
- Task-only needs genereren geen productlines.
- Geen persoonlijke productitems.

## Quantity policy mapping
- Geen nieuwe quantity policy enumwaarden.
- Bestaande child_factor/pet_factor/duration_day_factor waar aanwezig.
- Tasks hebben geen quantity policy.

## Webapp mapping
- Tasks zichtbaar naast producten.
- Geen nieuwe database-outputsectie.

## Schema-impact
- Geen schemawijziging nodig.
- Geen supplier_offer uitbreiding nodig.
- Geen Directus composite-PK wijziging nodig.
- Geen package/add-on → item koppeling.
- Geen package → item koppeling.

## Go / no-go
Conclusie:
- Implementatie kan doorgaan binnen bestaand datamodel.
```

---

## 16. Geen schema-uitbreiding buiten scope

Niet doen:

- geen nieuwe enumwaarden;
- geen schemawijzigingen;
- geen supplier_offer uitbreiding;
- geen Directus composite-PK wijziging;
- geen checkout/auth/account;
- geen klantprofielopslag;
- geen productitems voor persoonlijke zaken;
- geen baby/huisdiermodule;
- geen directe add-on/package → item koppeling.

---

## 17. Release note en tag

Na volledige groene validatie:

```text
release_note_v0.8.0_taken_profielen_baseline.md
v0.8.0-taken-profielen-baseline
```

---

## 18. Samenvatting voor implementatie

Definitieve keuzes:

- Add-on slug: `taken_profielen`
- Baseline tag: `v0.8.0-taken-profielen-baseline`
- Geen nieuwe producttypes.
- Preparedness tasks zijn hoofdoutput.
- Profile behavior wordt zichtbaar zonder klantaccount.
- Geen persoonlijke productgeneratie.
- Geen schemawijzigingen.
