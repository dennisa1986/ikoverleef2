# contentbatch_8_taken_profielen_package_polish_v1.md

**Project:** Ik overleef  
**Fase:** Fase 7 — Contentbatch 8 Taken, profielafhankelijkheden & package-polish  
**Documenttype:** Inhoudelijke specificatie  
**Status:** Specificatie v1 — klaar voor implementation mapping en end-to-end uitvoering  
**Datum:** 2026-04-29  
**Vorige formele baseline:** `v0.7.0-evacuatie-baseline`  
**Beoogde volgende baseline:** `v0.8.0-taken-profielen-baseline`  
**Nog vereist vóór implementatie:** `contentbatch_8_taken_profielen_package_polish_implementation_mapping.md`

---

## 0. Harde scope- en governance-opmerking

Dit document specificeert Contentbatch 8: **Taken, profielafhankelijkheden & package-polish**.

Deze fase is geen nieuwe productdomeinbatch zoals water, voedsel of EHBO. Het is een integratiebatch die bewijst dat het platform naast productregels ook **taken/checks**, **profielinvloed** en **pakketpolish** betrouwbaar kan afhandelen zonder checkout, account of volledige personalisatie.

Vaste werkwijze blijft verplicht:

1. Eerst inhoudelijke specificatie.
2. Daarna expliciete implementation mapping naar het bestaande schema.
3. Pas daarna seed/engine/webapp/regression implementeren.
4. Geen nieuwe enumwaarden, schemawijzigingen of conceptuele modelwijzigingen zonder expliciete toestemming.
5. Database-first blijven.
6. Packages en add-ons nooit direct aan items koppelen.
7. Packages en add-ons activeren scenario’s.
8. Scenario’s leiden via needs, capabilities, productregels, quantity policies, productvarianten, item candidates, accessoire requirements, generated package lines, sources, coverage en QA tot output.
9. Taken/checks verschijnen naast producten, niet als generieke productvervangers.
10. Bestaande slugs, enumwaarden, QA-views en engineconcepten blijven leidend.

Termen zoals `task_only`, `profile_sensitive`, `package_polish`, `child_adjusted`, `pet_adjusted`, `personal_check` en `content_only` zijn inhoudelijke intenties. Ze mogen niet automatisch als nieuwe database-enums worden toegevoegd.

---

## 1. Waar we staan in het plan

Afgerond:

- Fase 0 — Stroomuitval baseline
- Fase 1 — Drinkwaterzekerheid baseline
- Fase 2 — Voedsel & voedselbereiding baseline
- Fase 3 — Hygiëne, sanitatie & afval baseline
- Fase 4 — EHBO & persoonlijke zorg baseline
- Fase 5 — Warmte, droog blijven & shelter-light baseline
- Fase 6 — Evacuatie & documenten baseline

Nu:

**Fase 7 — Taken, profielafhankelijkheden & package-polish**

Deze fase moet bewijzen dat Ik overleef niet alleen producten kan genereren, maar ook profielafhankelijke aandachtspunten en niet-productmatige acties kan tonen.

Belangrijke uitgangspunten:

> Persoonlijke zaken worden niet als generiek product verkocht.

> Profielinput mag quantities beïnvloeden waar dat verantwoord en al modelmatig ondersteund is.

> Taken/checks moeten naast producten verschijnen en mogen geen schijnzekerheid geven.

---

## 2. Doel van Fase 7

Deze fase moet aantonen dat:

- tasks/checks in de output betrouwbaar naast producten verschijnen;
- kinderen, baby’s, huisdieren en persoonlijke aandachtspunten niet automatisch leiden tot risicovolle productclaims;
- bestaande quantity policies profielinput kunnen gebruiken waar dit al verantwoord is;
- duration, adults, children en pets zichtbaar effect hebben waar bestaande policies dat ondersteunen;
- package output beter uitlegbaar wordt voor een echte configurator;
- de interne webapp taken en warnings beter toont;
- regressions alle eerdere contentbatches blijven borgen.

De batch is bedoeld als brug richting MVP-UI en engine-hardening.

---

## 3. Niet-doen-lijst

Deze fase doet expliciet niet:

- geen checkout;
- geen klantaccounts;
- geen auth;
- geen betaalflow;
- geen externe leverancierintegraties;
- geen echte voorraadreservering;
- geen volledige baby-module;
- geen volledige huisdiermodule;
- geen kind-specifieke productbundels;
- geen generieke medicatieproducten;
- geen doseringsadvies;
- geen medische personalisatie;
- geen automatische documentgeneratie;
- geen klantprofielopslag/account;
- geen replacement-flow;
- geen approved replacements;
- geen nieuwe schemawijzigingen;
- geen nieuwe enumwaarden;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen directe package → item koppeling;
- geen directe add-on → item koppeling.

---

## 4. Add-on / activatie

### 4.1 Specificatiecode

```text
ADDON-TASKS-PROFILE-POLISH
```

### 4.2 Voorkeurslug

Voorkeur voor implementation mapping:

```text
taken_profielen
```

Alternatieven alleen gebruiken als bestaande conventie dat vereist:

```text
profiel_taken
package_polish
```

Advies: gebruik `taken_profielen`, omdat deze fase primair taken en profielafhankelijkheden test. Package-polish is het resultaat, niet de add-on-identiteit.

### 4.3 Architectuurregel

De add-on activeert scenario’s. De add-on mag nooit direct aan taken, items of productvarianten hangen.

Gewenste flow:

```text
addon=taken_profielen
→ scenario’s
→ content-only/task needs
→ preparedness tasks
→ profile-aware explanations
→ generated output/tasks panel
→ QA
```

Als bestaande architectuur beter past bij package-scenario in plaats van add-on-scenario, mag de mapping-check dat voorstellen, maar niet implementeren zonder expliciete rapportage.

---

## 5. Scenario’s

Minimaal uitwerken:

| Specificatiecode | Voorlopige slugrichting | Doel |
|---|---|---|
| `SCN-PROFILE-TASKS-72H-HOME` | `profiel-taken-thuis-72u` | Algemene profielafhankelijke checks voor thuisvoorbereiding. |
| `SCN-CHILDREN-PREPAREDNESS` | `kinderen-voorbereiding-checks` | Checklist en aandachtspunten wanneer kinderen in het huishouden zitten. |
| `SCN-PETS-PREPAREDNESS` | `huisdieren-voorbereiding-checks` | Checklist voor huisdieren zonder volledige huisdiermodule. |
| `SCN-PERSONAL-READINESS` | `persoonlijke-gereedheid-checks` | Medicatie, contacten, documenten, sleutels/cash/laders als checks. |
| `SCN-PACKAGE-POLISH` | `pakketadvies-polish` | Algemene uitlegbaarheid, volledigheid en outputpolish. |

Scenario’s mogen task-only zijn. Ze hoeven geen productregels te genereren.

---

## 6. Needs

Minimaal uitwerken:

| Specificatiecode | Voorlopige slugrichting | Type | Doel |
|---|---|---|---|
| `NEED-PROFILE-DURATION-CHECK` | `duur-profiel-check` | Task/check | Duur en huishouden controleren. |
| `NEED-CHILDREN-READINESS-CHECK` | `kinderen-gereedheid-check` | Task/check | Kindgerelateerde aandachtspunten. |
| `NEED-BABY-READINESS-CHECK` | `baby-gereedheid-check` | Task/check | Babyspullen als checklist, geen volledige module. |
| `NEED-PET-READINESS-CHECK` | `huisdieren-gereedheid-check` | Task/check | Huisdierwater/voer/medicatie als checklist. |
| `NEED-PERSONAL-MEDICATION-CHECK` | `persoonlijke-medicatie-check` | Task/check | Medicatie zelf regelen/controleren. |
| `NEED-DOCUMENTS-CONTACTS-CHECK` | `documenten-contacten-check` | Task/check | Documenten en noodcontacten controleren. |
| `NEED-KEYS-CASH-CHARGERS-CHECK` | `sleutels-cash-laders-check` | Task/check | Niet-productmatige vertrek-/backupzaken. |
| `NEED-PACKAGE-REVIEW-CHECK` | `pakketadvies-controleren` | Task/check | Advies periodiek controleren en houdbaarheid nalopen. |

Deze needs mogen geen generieke productlines afdwingen.

---

## 7. Capabilities

Minimaal uitwerken:

| Specificatiecode | Voorlopige slugrichting | Productcoverage toegestaan? |
|---|---|---|
| `CAP-PROFILE-DURATION-REVIEW` | `duur-en-profiel-controleren` | Nee |
| `CAP-CHILDREN-PREPAREDNESS-REVIEW` | `kinderen-voorbereiding-controleren` | Nee |
| `CAP-BABY-PREPAREDNESS-REVIEW` | `baby-voorbereiding-controleren` | Nee |
| `CAP-PET-PREPAREDNESS-REVIEW` | `huisdieren-voorbereiding-controleren` | Nee |
| `CAP-PERSONAL-MEDICATION-REVIEW` | `persoonlijke-medicatie-controleren` | Nee |
| `CAP-DOCUMENTS-CONTACTS-REVIEW` | `documenten-contacten-controleren` | Nee |
| `CAP-KEYS-CASH-CHARGERS-REVIEW` | `sleutels-cash-laders-controleren` | Nee |
| `CAP-PACKAGE-REVIEW` | `pakketadvies-periodiek-controleren` | Nee |

Deze capabilities zijn task/check capabilities. Ze mogen geen productcoverage genereren, tenzij het bestaande model daar al veilig een content-only/task concept voor heeft.

---

## 8. Producttypes

Deze batch voegt in principe **geen nieuwe producttypes** toe.

Niet toevoegen:

```text
babyspullen
huisdiervoer
huisdiermedicatie
persoonlijke-medicatie
documenten
cash
sleutels
contactpersonen
klantprofiel
```

Bestaande producttypes uit eerdere batches mogen alleen worden hergebruikt in regressions om profile quantity behavior te testen. Bijvoorbeeld:

- drinkwater;
- voedsel;
- hygiëneconsumables;
- evacuatie drinkfles;
- bestaande tasks uit EHBO/evacuatie.

---

## 9. Preparedness tasks

Minimaal toe te voegen of te borgen tasks:

| Task slug | Wanneer tonen | Inhoud |
|---|---|---|
| `duur-en-huishouden-controleren` | Altijd bij deze batch | Controleer of duur, volwassenen, kinderen en huisdieren kloppen. |
| `kinderen-benodigdheden-check` | Als kinderen > 0, of statisch met “indien van toepassing” | Denk aan eten, drinken, comfort, kleding, identificatie en afhankelijkheid. |
| `baby-benodigdheden-check` | Alleen als bestaand profiel dit ondersteunt; anders “indien van toepassing” | Luiers, voeding, verzorging, warmte; geen volledige productmodule. |
| `huisdieren-water-voer-check` | Als huisdieren > 0, of statisch met “indien van toepassing” | Water, voer, medicatie, lijn/bench, identificatie. |
| `persoonlijke-medicatie-controleren` | Altijd of bij persoonlijke zorgscenario | Zelf regelen; geen generiek productadvies. |
| `documenten-en-contacten-controleren` | Altijd of bij evacuatie/documentcontext | Kopieën, noodcontacten, verzekeringen, ID. |
| `sleutels-cash-laders-controleren` | Altijd of bij evacuatie/persoonlijke readiness | Sleutels, cash, laders, powerbank compatibiliteit. |
| `houdbaarheid-en-batterijen-controleren` | Altijd | Controleer water, voedsel, batterijen, medicatie, hygiëneproducten. |
| `pakketadvies-periodiek-herzien` | Altijd | Herzie pakket bij gezinswijziging, verhuizing of seizoensrisico. |

Als bestaande `preparedness_task` geen profielcondities ondersteunt, gebruik dan statische tasks met duidelijke “indien van toepassing” uitleg of bestaande content_only/notes. Voeg geen schema toe.

---

## 10. Profielafhankelijkheden

Deze fase mag profielinput op twee manieren gebruiken:

### 10.1 Quantity behavior valideren

Bestaande quantity policies mogen aantonen dat:

- volwassenen meetellen;
- kinderen meetellen waar child_factor bestaat;
- huisdieren meetellen waar pet_factor bestaat;
- duur in uren wordt vertaald naar dagen waar bestaande policies dit ondersteunen.

Te testen domeinen:

- drinkwater;
- voedsel;
- hygiëneconsumables;
- evacuatie draagbare water/zichtbaarheid/licht waar relevant.

### 10.2 Task behavior tonen

Profielgerelateerde tasks worden zichtbaar als:

- profielspecifiek als bestaande taskcondities dit ondersteunen;
- anders als algemene “controleer indien van toepassing”-task.

Niet doen:

- geen babyproductgeneratie;
- geen huisdiervoerproductgeneratie;
- geen persoonlijke medicatieproductgeneratie;
- geen medische dosering;
- geen klantaccount/profielopslag.

---

## 11. Package-polish

Deze fase moet de output richting MVP beter structureren zonder schemawijziging.

Inhoudelijke labels:

- core items;
- accessories;
- supporting/backup;
- tasks;
- warnings;
- sources;
- coverage;
- QA.

Als het datamodel nog geen aparte outputsecties heeft, mag de webapp labels afleiden uit bestaande velden zoals `is_accessory`, `is_core_line`, source type, product rule role, coverage strength, usage constraints en preparedness_task.

Geen nieuwe line role enum toevoegen.

---

## 12. Expected output

Voor:

```text
addon=taken_profielen
tier=basis
```

en:

```text
addon=taken_profielen
tier=basis_plus
```

moet de productoutput mogelijk leeg of beperkt zijn, maar de task-output moet minimaal aanwezig zijn.

Minimale task-output:

```text
duur-en-huishouden-controleren
kinderen-benodigdheden-check
huisdieren-water-voer-check
persoonlijke-medicatie-controleren
documenten-en-contacten-controleren
sleutels-cash-laders-controleren
houdbaarheid-en-batterijen-controleren
pakketadvies-periodiek-herzien
```

Als bestaande taskconditionering baby/children/pets niet ondersteunt, mogen child/pet/baby tasks algemene “indien van toepassing”-checks zijn. Dit moet in explanations worden vastgelegd.

---

## 13. Coveragecriteria

Een output is inhoudelijk voldoende als:

1. Task-only needs niet als productlines worden gegenereerd.
2. Tasks zichtbaar zijn naast producten.
3. Productoutput niet wordt vervuild met persoonlijke items.
4. Profile/duration check zichtbaar is.
5. Kinderen en huisdieren worden niet genegeerd in uitleg.
6. Persoonlijke medicatie blijft een check, geen product.
7. Documenten/contacten/cash/sleutels blijven checks, geen producten.
8. Existing quantity policies blijven werken met adults/children/pets/duration.
9. QA blocking = 0.
10. Alle eerdere regressions blijven groen.

---

## 14. Sourcecriteria

- Elke task moet herleidbaar zijn naar scenario_need/preparedness_task of bestaand taskmechanisme.
- Productlines uit andere add-ons blijven herleidbaar naar generated_line_source.
- Geen task ontstaat uit directe add-on → item koppeling.
- Geen productline ontstaat uit task-only need.
- POC-aannames worden vastgelegd in internal notes/explanations.

---

## 15. QA-criteria

Minimaal:

- QA blocking = 0.
- Geen active scenario zonder needs.
- Geen active needs zonder capabilities, tenzij bestaand content_only/taskpatroon dit expliciet toestaat.
- Geen scenario needs zonder product rules voor productmatige needs.
- Task-only/content-only needs hoeven geen product rule te vereisen als het bestaande QA-patroon dit ondersteunt.
- Geen generated lines zonder sources.
- Geen generated line producttype mismatch.
- Geen persoonlijke medicatieproducten.
- Geen document/cash/sleutel/contact-producten.
- Geen baby/huisdierproductmodules.
- Geen nieuwe enumwaarden.
- Geen schemawijzigingen.

---

## 16. Engine-aanpassingen — inhoudelijke verwachting

De engine moet minimaal kunnen of hergebruiken:

- `addon=taken_profielen` scenarioactivatie;
- preparedness tasks ophalen voor actieve scenario’s;
- task-only needs niet als productlines behandelen;
- profile/duration input in tasks of explanations tonen;
- bestaande quantity policies blijven toepassen;
- geen productlines genereren voor persoonlijke checks;
- webapp taskpanel vullen;
- QA output blijven tonen.

Als taskconditionering per `household_children` of `household_pets` niet schema-veilig kan, stop niet automatisch; gebruik algemene “indien van toepassing”-tasks en rapporteer dit als bekend open punt.

---

## 17. Interne webapp-aanpassing — inhoudelijke verwachting

De interne webapp moet minimaal ondersteunen:

```text
/internal/recommendation-poc?addon=taken_profielen&tier=basis
/internal/recommendation-poc?addon=taken_profielen&tier=basis_plus
```

Daarnaast moet de webapp task-output duidelijk tonen bij relevante combinatie-add-ons, bijvoorbeeld:

```text
addon=evacuatie,taken_profielen
addon=drinkwater,taken_profielen
```

Als de huidige POC slechts één addon-param ondersteunt, mag een comma-separated aanpak worden toegevoegd als dit zonder schemawijziging kan. Anders moet de limitation worden gerapporteerd.

---

## 18. Regression test — inhoudelijke specificatie

Vermoedelijk:

```text
regression_taken_profielen_poc.js
npm run test:taken-profielen-poc
```

Minimaal valideren:

1. `addon=taken_profielen` werkt voor `tier=basis`.
2. `addon=taken_profielen` werkt voor `tier=basis_plus`.
3. Task-output is aanwezig.
4. Profile/duration check-task is aanwezig.
5. Medicatiecheck-task is aanwezig.
6. Documenten/contacten-task is aanwezig.
7. Huisdierencheck-task is aanwezig of als “indien van toepassing” zichtbaar.
8. Kinderencheck-task is aanwezig of als “indien van toepassing” zichtbaar.
9. Geen productlines voor medicatie.
10. Geen productlines voor documenten.
11. Geen productlines voor cash/sleutels/contacten.
12. Geen baby/huisdierproductmodules.
13. Eerdere productregressions blijven groen.
14. Een profielrun met kinderen beïnvloedt minimaal één bestaande quantity policy waar dat al hoort, of rapporteert dat huidige seed dit nog niet activeert.
15. QA blocking = 0.

---

## 19. Release note — toekomstige baseline

Later toevoegen:

```text
v0.8.0-taken-profielen-baseline
```

Release note bevat:

- fase;
- baseline;
- add-on slug;
- task-only scope;
- profielafhankelijkheden;
- quantity/profile behavior;
- package-polish;
- regressions;
- QA;
- bekende open punten.

---

## 20. Fase-afrondingscriteria

Fase 7 is technisch afgerond als:

- specificatie en mapping zijn opgenomen;
- mapping-check is uitgevoerd;
- seed draait zonder schemawijziging;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen supplier_offer uitbreiding is gedaan;
- `addon=taken_profielen` werkt;
- task-output zichtbaar is;
- task-only needs geen productlines genereren;
- persoonlijke items niet als producten verschijnen;
- webapp tasks toont;
- QA blocking = 0;
- regressions groen:
  - stroomuitval;
  - drinkwater;
  - voedsel;
  - hygiëne/sanitatie;
  - EHBO;
  - warmte/droog/shelter;
  - evacuatie;
  - taken/profielen;
- release note aanwezig;
- commit/tag/push na validatie.

---

## 21. Samenvatting

Deze batch maakt het MVP-advies menselijker en betrouwbaarder:

- producten blijven producten;
- persoonlijke zaken blijven checks;
- profielinput wordt zichtbaar;
- taken verschijnen naast pakketregels;
- output wordt voorbereid op de echte configurator.
