# Release note — v0.9.0-engine-hardening-baseline

## Fase
Fase 8 — Engine hardening

## Baseline
- Vorige baseline: `ad7811f`
- Vorige tag: `v0.8.0-taken-profielen-baseline`
- Nieuwe releasecommit: nog te zetten bij afronding
- Nieuwe tag: `v0.9.0-engine-hardening-baseline`

## Doel
Deze baseline hardent de recommendation engine en de interne POC-output voor MVP-gebruik, zonder nieuwe contentdomeinen, schemawijzigingen of enumuitbreidingen.

## Architectuurprincipes
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen nieuwe generated outputtabellen.
- Geen `generated_package_line.role` of `generated_package_line.section`.
- Runtime-secties worden afgeleid uit bestaande generated data.
- Tasks blijven naast producten zichtbaar via bestaand `preparedness_task`-mechaniek.
- Warnings worden afgeleid uit bestaande usage constraints, governance en QA-context.

## Schema-impact
- Geen seedbestand toegevoegd.
- Geen database-uitbreiding nodig.
- Geen nieuwe QA-view vereist.
- Alleen engine-, webapp- en regression-hardening.

## Multi-add-on gedrag
- `addon=` accepteert comma-separated waarden in de interne webapp.
- `addon_slugs` blijft array-input voor de engine.
- Single-add-on routes blijven backwards compatible.
- Exacte add-onset matching voorkomt dat regressions of webapp per ongeluk een bredere combo-run ophalen.

## Runtime sections
Runtime-output wordt opgebouwd als:

```txt
core_items
accessories
supporting_items
backup_items
optional_additions
tasks
warnings
qa_summary
```

Deze structuur bestaat alleen runtime/UI-zijdig.

## Deduplicatie
- Dedupe key blijft `item_id`.
- Quantity blijft `max(quantity)`.
- Sources blijven behouden bij gedeelde items.
- Coverage blijft behouden bij gedeelde items.
- Bewezen voor onder meer:
  - hoofdlamp bij `stroomuitval + evacuatie`
  - nitril handschoenen in brede multi-add-on run
  - accessoires zoals batterijen met source-herleiding

## Tasks
- Tasks blijven zichtbaar als aparte sectie.
- `taken_profielen` blijft task-only waar bedoeld.
- Profiel- en duration-checks blijven zichtbaar zonder klantprofielopslag.

## Warnings
- Structured warnings worden opgebouwd uit:
  - `item_usage_constraint`
  - governance-notes uit internal explanations
  - QA context views indien van toepassing
- Geen aparte warningtabel toegevoegd.

## QA summary
- Blocking QA total
- Warning/context QA total
- Generated lines without sources
- Generated line producttype mismatch
- Status `clean` of `attention`
- Detailtabellen voor blocking en warning/context views

## Interne webapp-route
Gecontroleerde routes:

- `http://127.0.0.1:4173/internal/recommendation-poc?addon=evacuatie,drinkwater&tier=basis_plus`
- `http://127.0.0.1:4173/internal/recommendation-poc?addon=drinkwater,taken_profielen&tier=basis_plus&adults=2&children=1&pets=1&duration_hours=72`

De webapp toont:
- input summary
- actieve add-ons
- household profile
- duration
- core/accessory/supporting/backup/optional sections
- tasks
- warnings
- QA summary
- debug details met sources, coverage en usage constraints

## Validatie
- `npm run test:stroomuitval-poc`: groen
- `npm run test:drinkwater-poc`: groen
- `npm run test:voedsel-poc`: groen
- `npm run test:hygiene-sanitatie-poc`: groen
- `npm run test:ehbo-poc`: groen
- `npm run test:warmte-droog-shelter-poc`: groen
- `npm run test:evacuatie-poc`: groen
- `npm run test:taken-profielen-poc`: groen
- `npm run test:engine-hardening-poc`: groen
- QA blocking: `0`
- Generated lines without sources: `0`
- Generated line producttype mismatch: `0`

## Bekende open punten
- `optional_additions` wordt in deze fase wel als runtime-sectie getoond, maar blijft nog leeg.
- De huidige drinkwaterbaseline genereert in de combinatie `drinkwater + evacuatie` geen losse `IOE-BOTTLE-1L-PLUS` uit beide domeinen; daardoor is drinkfles-dedupe daar nog geen actieve case, alleen single-source hergebruik.
- Warning/context QA kan conceptueel nog `attention` tonen zonder blocking issues; dat blijft een bestaande QA-contextlaag, geen releaseblokker.

## Conclusie
Fase 8 brengt de engine-output naar een steviger MVP-structuur met multi-add-on ondersteuning, runtime sectioning, structured warnings en QA-summary, zonder schema-impact.
