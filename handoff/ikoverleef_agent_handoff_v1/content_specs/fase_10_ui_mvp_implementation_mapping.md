# Fase 10 — UI MVP implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt de inhoudelijke Fase 10-specificatie naar het bestaande Ik overleef-datamodel en de bestaande POC-applicatie.

Fase 10 is een UI-/presentation-hardeningfase.

Geen nieuwe productcontent.  
Geen nieuwe databaseconcepten.  
Geen schemawijzigingen.

## 2. Bestaande bronnen die gebruikt moeten worden

Gebruik bestaande runtime-output uit de engine:

- `loadRecommendationOutputForInput`;
- runtime sections uit Fase 8;
- tasks uit `preparedness_task`;
- warnings uit `item_usage_constraint`, governance/context en QA;
- QA summary uit bestaande QA views;
- backoffice data uit Fase 9 waar nodig.

Gebruik bestaande routes als referentie:

- `/internal/recommendation-poc`;
- `/internal/backoffice-poc`.

## 3. Schema-impact

Verwacht:

```text
schemawijziging nodig: nee
nieuwe enumwaarden nodig: nee
supplier_offer uitbreiding nodig: nee
Directus composite-PK wijziging nodig: nee
nieuwe tabellen nodig: nee
```

Niet toevoegen:

- `ui_flow` tabel;
- `cart` tabel;
- `customer` tabel;
- `session` tabel;
- `checkout` tabel;
- `generated_package_line.section`;
- `generated_package_line.role`;
- nieuwe readiness/status enums.

## 4. Route mapping

Voorgestelde nieuwe routes in bestaande internal POC server:

```text
/mvp
/mvp/recommendation
```

Toegestaan alternatief als conventie beter past:

```text
/internal/mvp
/internal/mvp/recommendation
```

Bestaande routes moeten blijven werken:

```text
/internal/recommendation-poc
/internal/backoffice-poc
```

## 5. Input mapping

UI-input wordt runtime gemapt naar bestaande engine input.

### Package

UI:

```text
package=basispakket
```

Engine:

```js
package_slug: 'basispakket'
```

Geen nieuwe package.

### Tier

UI:

```text
tier=basis
tier=basis_plus
```

Engine:

```js
tier_slug: 'basis' | 'basis_plus'
```

Geen nieuwe tier.

### Add-ons

UI:

```text
addons=drinkwater,evacuatie,taken_profielen
```

of backwards compatible:

```text
addon=drinkwater,evacuatie,taken_profielen
```

Engine:

```js
addon_slugs: ['drinkwater', 'evacuatie', 'taken_profielen']
```

Alleen bestaande add-on slugs:

```text
stroomuitval
drinkwater
voedsel_bereiding
hygiene_sanitatie_afval
ehbo_persoonlijke_zorg
warmte_droog_shelter_light
evacuatie
taken_profielen
```

Geen nieuwe add-on slug toevoegen.

### Profiel

UI:

```text
adults
children
pets
duration_hours
```

Engine:

```js
household_adults
household_children
household_pets
duration_hours
```

Geen klantprofielopslag.

## 6. Runtime section mapping

Gebruik bestaande runtime sections uit Fase 8.

Mapping:

```text
Core items → output.sections.core_items
Accessoires → output.sections.accessories
Supporting items → output.sections.supporting_items
Backup items → output.sections.backup_items
Optional additions → output.sections.optional_additions
Tasks → output.tasks
Warnings → output.warnings
QA summary → output.qa_summary
```

Dit zijn runtime/UI-secties, geen database-enums.

## 7. UI-label mapping

UI-labels mogen worden gebruikt als presentatietekst:

```text
Essentieel
Accessoire
Ondersteunend
Backup
Optioneel
Taak
Waarschuwing
```

Deze labels mogen niet als enumwaarden worden toegevoegd.

## 8. Public explanation mapping

Itemkaart toont:

- `title`;
- `quantity`;
- `explanation_public`;
- runtime section;
- eventueel korte governance/warning.

Detailpaneel toont:

- sources;
- coverage;
- usage constraints;
- internal explanation alleen in debug/intern blok.

## 9. Warning mapping

Warnings komen uit bestaande output:

```js
output.warnings
```

En mogen worden aangevuld met bestaande item usage constraints/governance die al in output aanwezig zijn.

Geen nieuwe warning table.  
Geen nieuwe warning enum.

## 10. Task mapping

Tasks komen uit:

```js
output.tasks
```

Task-only needs blijven content_only.

Tasks worden getoond in aparte sectie en nooit als productkaart.

## 11. QA mapping

QA summary komt uit:

```js
output.qa_summary
```

Toon minimaal:

- status;
- blocking_total;
- warning_total;
- generated_lines_without_sources;
- generated_line_producttype_mismatch.

Geen nieuwe QA views vereist.

## 12. Preset mapping

Presets zijn UI-only.

Voorbeeld:

```js
[
  {
    slug: 'mvp_start',
    label: 'Aanbevolen startpakket',
    addon_slugs: ['stroomuitval', 'drinkwater', 'evacuatie']
  },
  {
    slug: 'complete_72h',
    label: 'Compleet 72 uur POC',
    addon_slugs: [
      'stroomuitval',
      'drinkwater',
      'voedsel_bereiding',
      'hygiene_sanitatie_afval',
      'ehbo_persoonlijke_zorg',
      'warmte_droog_shelter_light',
      'evacuatie',
      'taken_profielen'
    ]
  }
]
```

Niet opslaan in database.

## 13. Geen checkout mapping

De UI mag geen checkout- of koopflow bevatten.

Niet toevoegen:

- winkelmand;
- betaalbutton;
- “bestel nu”;
- account aanmaken;
- voorraad reserveren.

Toegestane CTA’s:

- “Advies bekijken”;
- “Keuzes aanpassen”;
- “Uitleg bekijken”;
- “Taken bekijken”;
- “Debug openen”;
- “Interne backoffice bekijken”.

## 14. Regression mapping

Nieuwe test:

```text
backend/regression_ui_mvp_poc.js
```

NPM script:

```json
"test:ui-mvp-poc": "node regression_ui_mvp_poc.js"
```

Test mag:

- rendering functions direct importeren;
- of de server starten en HTTP-routes testen;
- of beide, zolang het stabiel blijft.

## 15. Validatie mapping

Na implementatie moeten alle bestaande scripts groen blijven:

- `test:stroomuitval-poc`
- `test:drinkwater-poc`
- `test:voedsel-poc`
- `test:hygiene-sanitatie-poc`
- `test:ehbo-poc`
- `test:warmte-droog-shelter-poc`
- `test:evacuatie-poc`
- `test:taken-profielen-poc`
- `test:engine-hardening-poc`
- `test:backoffice-hardening-poc`
- `test:ui-mvp-poc`

## 16. Release mapping

Release note:

```text
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v0.11.0_ui_mvp_baseline.md
```

Tag:

```text
v0.11.0-ui-mvp-baseline
```

Commit message:

```text
feat(ui): add mvp configurator and advice flow
```

## 17. Go/no-go

Implementatie mag doorgaan als:

- geen schemawijziging nodig is;
- geen nieuwe enum nodig is;
- bestaande engine-output voldoende is;
- UI-routes kunnen worden toegevoegd in bestaande POC-app;
- alle regressions kunnen blijven draaien.

Stop als:

- checkout/account vereist lijkt;
- nieuwe tabellen nodig lijken;
- nieuwe generated outputkolommen nodig lijken;
- engine-semantiek moet wijzigen;
- directe package/add-on → item koppeling nodig lijkt.
