# Fase 8 — Engine hardening v1

## 1. Waar we staan in het MVP-plan

Project **Ik overleef** heeft inmiddels de belangrijkste inhoudelijke baselines doorlopen en vastgezet:

- Fase 0 — Stroomuitval baseline
- Fase 1 — Drinkwaterzekerheid baseline
- Fase 2 — Voedsel & voedselbereiding baseline
- Fase 3 — Hygiëne, sanitatie & afval baseline
- Fase 4 — EHBO & persoonlijke zorg baseline
- Fase 5 — Warmte, droog blijven & shelter-light baseline
- Fase 6 — Evacuatie & documenten baseline
- Fase 7 — Taken, profielafhankelijkheden & package-polish baseline

Fase 8 is **geen nieuwe product- of contentbatch**. Deze fase is een **MVP-hardeningfase voor de recommendation engine en interne outputstructuur**.

Tot nu toe bewijst het systeem vooral dat afzonderlijke scenario- en contentdomeinen database-first kunnen genereren:

```text
package / tier / add-ons / profiel
→ scenario’s
→ behoeften
→ capabilities
→ productregels
→ quantity policies
→ productvarianten
→ item candidates
→ accessoire requirements
→ generated package lines
→ sources + coverage + QA
```

Vanaf Fase 8 moet de engine beter geschikt worden voor een MVP-output die een gebruiker en beheerder begrijpen:

```text
Core items
Accessoires
Optional additions
Tasks
Warnings
```

Belangrijk: deze outputstructuur mag in Fase 8 **niet** betekenen dat het datamodel conceptueel wordt omgebouwd. De eerste implementatie moet schema-veilig zijn en bestaande tabellen, velden, enumwaarden, source types, coverage, constraints, tasks en generated output hergebruiken.

## 2. Doel

Fase 8 heeft als doel de recommendation engine van POC-output naar MVP-bruikbare output te brengen, zonder nieuwe contentdomeinen te introduceren.

Deze fase moet bewijzen dat:

1. multi-add-on runs robuust werken;
2. deduplicatie over contentbatches correct blijft;
3. generated package lines logisch gegroepeerd kunnen worden in sections;
4. tasks naast producten zichtbaar blijven;
5. warnings uit usage constraints/governance zichtbaar en herleidbaar zijn;
6. core/accessory/supporting/backup/optional rollen betrouwbaar uit bestaande data afgeleid kunnen worden;
7. runtime QA per run bruikbaar samengevat wordt;
8. bestaande regressions groen blijven;
9. de interne webapp dichter bij de MVP-adviesstructuur komt;
10. er geen schemawijzigingen of nieuwe enumwaarden nodig zijn.

## 3. Niet-doen-lijst

Niet doen in Fase 8:

- geen nieuwe productdomeinbatch;
- geen nieuwe enumwaarden;
- geen schemawijzigingen;
- geen supplier_offer schema-uitbreiding;
- geen Directus composite-PK aanpassing;
- geen checkout;
- geen auth;
- geen klantaccount;
- geen betaalflow;
- geen externe leverancierintegraties;
- geen klantprofielopslag;
- geen nieuwe package → item koppeling;
- geen nieuwe add-on → item koppeling;
- geen conceptuele datamodelwijziging voor sections;
- geen nieuwe database-outputsectie als tabel;
- geen nieuwe `generated_package_line.role` kolom;
- geen nieuwe `warning` tabel;
- geen nieuwe `optional_addition` tabel;
- geen hardcoded pakketbundels;
- geen removal/replacement-flow voor klantitems;
- geen commerciële winkelmandlogica.

## 4. Scope

Fase 8 raakt primair:

- `backend/calculate.js`
- `apps/internal-poc/server.js`
- `backend/package.json`
- een nieuwe regression test, bijvoorbeeld:
  - `backend/regression_engine_hardening_poc.js`
- mogelijk documentatie/release note:
  - `release_note_v0.9.0_engine_hardening_baseline.md`

In principe is er **geen seedbestand nodig**, tenzij de mapping-check aantoont dat er een zeer beperkte docs/QA-seed nodig is binnen bestaande tabellen. De voorkeursroute is: geen databasewijziging, alleen engine/webapp/regression hardening.

## 5. Baseline-invoer voor hardening

De engine moet minimaal getest worden op:

### Enkelvoudige add-ons

- `stroomuitval`
- `drinkwater`
- `voedsel_bereiding`
- `hygiene_sanitatie_afval`
- `ehbo_persoonlijke_zorg`
- `warmte_droog_shelter_light`
- `evacuatie`
- `taken_profielen`

### Multi-add-on combinaties

Minimaal:

```text
stroomuitval + drinkwater
drinkwater + voedsel_bereiding
evacuatie + drinkwater
evacuatie + stroomuitval
evacuatie + taken_profielen
drinkwater + taken_profielen
stroomuitval + drinkwater + voedsel_bereiding + hygiene_sanitatie_afval + ehbo_persoonlijke_zorg + warmte_droog_shelter_light + evacuatie + taken_profielen
```

De laatste combinatie is een brede stressrun voor MVP-achtig gedrag. Deze hoeft geen perfecte commerciële pakketcompositie te zijn, maar moet:

- niet crashen;
- dedupliceren waar item_id gelijk is;
- sources behouden;
- coverage behouden;
- tasks tonen;
- warnings tonen;
- QA blocking = 0 houden.

## 6. Outputsections

Fase 8 introduceert **geen nieuwe database-enum** voor sections. Sections worden runtime afgeleid uit bestaande data.

De MVP-output moet minimaal logisch kunnen worden weergegeven als:

```text
core_items
accessories
supporting_items
backup_items
optional_additions
tasks
warnings
qa_summary
```

### 6.1 Core items

Core items zijn generated package lines die:

- niet accessory zijn;
- `is_core_line = true` hebben of via bestaande productregel/source/coverage als core afleidbaar zijn;
- primary/sufficient coverage leveren voor een scenario need;
- niet alleen backup/supporting/governance zijn.

Voorbeelden:

- drinkwatervoorraad;
- voedselpakket;
- EHBO-set;
- warmtedeken;
- evacuatietas als containerlijn voor draagbaarheid;
- lantaarn/hoofdlamp wanneer deze primary lichtzekerheid dekken.

### 6.2 Accessories

Accessories zijn generated package lines die:

- `is_accessory = true` hebben;
- of via `generated_line_source.source_type = accessory_requirement` ontstaan;
- of bestaande role-afleiding hebben zoals batterijen, kabels, brandstof, pot, absorber, tape, paracord/haringen.

Voorbeelden:

- batterijen;
- kabelset;
- brandstof;
- ontsteking;
- kookvat;
- absorber;
- handschoenen;
- verbandtape;
- paracord;
- tarp-haringen.

### 6.3 Supporting items

Supporting items ondersteunen een scenario, maar vervangen geen core dekking.

Voorbeelden:

- waterfilter;
- waterzuiveringstabletten;
- filterfles;
- kooktoestel;
- thermometer;
- tarp-light;
- grondzeil;
- zipbags;
- nooddeken/noodbivvy waar dit backup/supporting is.

### 6.4 Backup items

Backup items leveren fallback, weak coverage of reservefunctionaliteit en mogen niet als primary voldoende dekking worden gepresenteerd.

Voorbeelden:

- filter/tabletten bij drinkwater;
- zwengel-/solarfunctie bij noodradio;
- nooddeken als backup warmte;
- filterfles als backup waterbehandeling.

### 6.5 Optional additions

Fase 8 hoeft optional additions nog niet commercieel te activeren, maar moet een **lege of voorbereide sectie** kunnen tonen.

Als er bestaande `role = optional` productregels of niet-default candidates bestaan die schema-veilig zichtbaar gemaakt kunnen worden, mogen ze als internal optional candidates getoond worden. Zo niet:

```text
optional_additions = []
```

Dit is acceptabel als MVP-hardeningstap, mits het expliciet in release note/open punten staat.

Belangrijk:

- optional additions mogen geen required coverage vervangen;
- ze mogen niet als winkelmand upsell worden gepresenteerd;
- geen checkout of prijslogica.

### 6.6 Tasks

Tasks komen uit het bestaande `preparedness_task`-mechaniek en blijven naast producten zichtbaar.

Voorbeelden:

- persoonlijke medicatie controleren;
- documenten en contacten controleren;
- kinderen/baby/huisdieren indien van toepassing;
- tas periodiek controleren;
- houdbaarheid en batterijen controleren.

Tasks mogen geen productlines afdwingen tenzij er expliciete productregels bestaan. Content-only needs blijven content-only.

### 6.7 Warnings

Warnings worden runtime afgeleid uit bestaande bronnen:

- `item_usage_constraint`;
- claim governance;
- generated line explanations;
- internal governance notes;
- QA warnings/context views.

Er komt geen nieuwe warningtabel.

Warnings moeten minimaal tonen:

- item-SKU;
- constraint type;
- severity indien bestaand;
- public warning;
- internal notes;
- whether it blocks recommendation indien bestaand;
- herleiding naar generated line.

Warnings mogen niet worden verstopt in alleen free-text uitleg. De interne webapp moet ze gestructureerd tonen.

### 6.8 QA summary

De output moet per run een compacte QA-summary tonen:

- blocking QA total;
- warning/context QA total;
- generated lines without sources;
- generated line producttype mismatch;
- status: clean / attention;
- lijst van blocking views;
- lijst van warning views.

De bestaande QA-views blijven leidend. Er worden geen nieuwe QA-views verplicht toegevoegd in Fase 8.

## 7. Multi-add-on gedrag

Fase 8 moet multi-add-on input ondersteunen in engine en interne webapp.

### 7.1 Engine

`calculate.js` ondersteunt al input met `addon_slugs: []`. Fase 8 moet valideren dat:

- meerdere add-ons in één run geaccepteerd worden;
- alle scenario’s uit package + alle add-ons worden samengevoegd;
- scenario needs worden opgelost zonder duplicaatcrashes;
- generated lines dedupliceren per item;
- sources van meerdere scenario needs behouden blijven;
- quantities niet onterecht worden opgeteld als hetzelfde item vanuit meerdere sources komt, tenzij bestaande policy dit expliciet vereist;
- tasks uit meerdere actieve scenario’s zichtbaar blijven.

### 7.2 Interne webapp

De interne POC moet minimaal URLs ondersteunen zoals:

```text
/internal/recommendation-poc?addon=evacuatie,drinkwater&tier=basis_plus
/internal/recommendation-poc?addon=evacuatie,stroomuitval&tier=basis_plus
/internal/recommendation-poc?addon=drinkwater,taken_profielen&tier=basis_plus&adults=2&children=1&pets=1&duration_hours=72
```

Toegestaan alternatief:

- `addons=evacuatie,drinkwater`

Maar kies één consistente route en documenteer dit.

De UI moet duidelijk tonen welke add-ons actief zijn.

## 8. Deduplicatie-eisen

Deduplicatie blijft op itemniveau:

```text
dedupe key = item_id
```

Als hetzelfde item door meerdere scenario needs of accessoire requirements wordt geselecteerd:

- één generated package line;
- quantity = bestaande dedupe-regel, bij voorkeur max van quantities zoals huidig gedrag;
- alle sources blijven bewaard;
- alle relevante coverage rows blijven bewaard;
- accessories behouden parent-source waar relevant.

Specifieke dedupe-cases die regression moet bewijzen:

1. `IOE-HEADLAMP-AAA-BASIC/PLUS` bij `stroomuitval + evacuatie`;
2. `IOE-BOTTLE-1L-BASIC/PLUS` bij `drinkwater + evacuatie`;
3. `IOE-FILTERBOTTLE-PLUS` als supporting/backup bij `drinkwater + evacuatie`;
4. `IOE-GLOVES-NITRILE-BASIC/PLUS` bij hygiëne + EHBO, indien gecombineerd;
5. batterijen/kabels/accessoires behouden source-herleiding.

## 9. Quantity governance

Fase 8 mag geen nieuwe quantity policy enumwaarden introduceren.

De hardening moet bewijzen dat bestaande quantity policies blijven werken bij:

- multi-add-on;
- profielinput;
- duration 72 uur;
- children;
- pets als input aanwezig is;
- pack-size rounding;
- fixed household items;
- per-person items;
- accessories.

Belangrijk:

- tasks hebben geen quantity policy;
- content-only needs genereren geen productline;
- dedupe mag quantities niet willekeurig optellen;
- quantitybeslissingen moeten uitlegbaar blijven via sources en internal explanation.

## 10. Role-afleiding

Fase 8 mag geen nieuwe `role` enum toevoegen.

Runtime role-afleiding gebruikt bestaande velden:

- `generated_package_line.is_accessory`;
- `generated_package_line.is_core_line`;
- `generated_line_source.source_type`;
- `scenario_need_product_rule.role`;
- `generated_line_coverage.coverage_strength`;
- `generated_line_coverage.counted_as_sufficient`;
- product_type slugs waar bestaande POC-logica dit al doet;
- explanation/governance notes waar nodig.

Te tonen runtime labels:

```text
core
accessory
supporting
backup
optional
task
warning
```

Deze labels zijn UI/runtime-classificaties, geen database-enums.

## 11. Public explanation hardening

Fase 8 moet uitlegtemplates en runtime output controleren op:

- geen overclaims;
- duidelijke “waarom zit dit erin?”;
- zichtbaar verschil tussen core, accessory, supporting en backup;
- filters/tabletten vervangen geen watervoorraad;
- koken vervangt geen no-cook voedsel;
- nooddeken vervangt geen slaapcomfort;
- EHBO vervangt geen arts;
- evacuatie-items garanderen geen veilige evacuatie;
- tasks zijn persoonlijke checks, geen producten.

## 12. Interne webapp MVP-output

De interne webapp moet na Fase 8 dichter bij de MVP-adviesstructuur komen.

Minimaal tonen:

1. input summary:
   - package;
   - tier;
   - active add-ons;
   - duration;
   - volwassenen;
   - kinderen;
   - huisdieren;
2. sectioned package output:
   - core items;
   - accessories;
   - supporting items;
   - backup items;
   - optional additions;
3. tasks;
4. warnings;
5. coverage;
6. sources;
7. QA summary;
8. debug details per item.

Geen checkout of commerciële flow bouwen.

## 13. Regression test

Maak een nieuwe regression:

```text
backend/regression_engine_hardening_poc.js
```

Nieuw npm-script:

```json
"test:engine-hardening-poc": "node regression_engine_hardening_poc.js"
```

De regression moet minimaal valideren:

1. single-add-on regressions blijven groen via bestaande testcommando’s;
2. multi-add-on run `stroomuitval + evacuatie` werkt;
3. multi-add-on run `drinkwater + evacuatie` werkt;
4. multi-add-on run `drinkwater + taken_profielen` met kinderen/huisdier werkt;
5. full MVP stressrun met alle add-ons werkt;
6. dedupe per item werkt voor hergebruikte hoofdlamp;
7. dedupe per item werkt voor hergebruikte drinkfles;
8. sources blijven behouden bij dedupe;
9. coverage blijft behouden bij dedupe;
10. tasks zijn zichtbaar in runs met `taken_profielen`;
11. warnings/usage constraints zijn zichtbaar;
12. outputsections bevatten core/accessory/supporting/backup/tasks/warnings;
13. optional_additions sectie bestaat, desnoods leeg;
14. generated lines without sources = 0;
15. generated line producttype mismatch = 0;
16. QA blocking = 0;
17. geen nieuwe schemawijzigingen nodig;
18. geen nieuwe enumwaarden nodig;
19. geen package/add-on direct aan items gekoppeld.

## 14. Testcommando’s

Na implementatie moeten minimaal draaien:

```bash
npm run test:stroomuitval-poc
npm run test:drinkwater-poc
npm run test:voedsel-poc
npm run test:hygiene-sanitatie-poc
npm run test:ehbo-poc
npm run test:warmte-droog-shelter-poc
npm run test:evacuatie-poc
npm run test:taken-profielen-poc
npm run test:engine-hardening-poc
```

Alle negen moeten groen zijn.

## 15. Release note

Bij succesvolle afronding:

```text
release_note_v0.9.0_engine_hardening_baseline.md
```

Voorgestelde tag:

```text
v0.9.0-engine-hardening-baseline
```

## 16. Fase-afrondingscriteria

Fase 8 is technisch afgerond als:

- specificatie is opgenomen;
- implementation mapping is opgenomen;
- mapping-check is groen;
- geen schemawijzigingen zijn gedaan;
- geen nieuwe enumwaarden zijn toegevoegd;
- geen supplier_offer uitbreiding is gedaan;
- multi-add-on runs werken;
- dedupe over add-ons werkt;
- sections zichtbaar zijn;
- tasks zichtbaar zijn;
- warnings zichtbaar zijn;
- QA summary zichtbaar is;
- optional additions sectie aanwezig is, desnoods leeg;
- bestaande acht regressions groen zijn;
- nieuwe engine-hardening regression groen is;
- QA blocking = 0;
- generated lines without sources = 0;
- producttype mismatch = 0;
- interne webapp toont MVP-outputstructuur;
- release note aanwezig;
- commit en tag zijn gezet;
- main en tag zijn gepusht.

## 17. Toekomstige agent-opdracht

Na goedkeuring van deze specificatie en het mappingdocument mag de agent Fase 8 end-to-end uitvoeren:

```text
specificatie controleren/opnemen
→ implementation mapping controleren/opnemen
→ mapping-check
→ implementatie
→ regressions
→ release note
→ commit/tag/push
→ eindrapportage
```
