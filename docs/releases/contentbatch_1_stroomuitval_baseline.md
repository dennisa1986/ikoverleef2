# Contentbatch 1 Stroomuitval Regression Baseline

Datum: 2026-04-28

Deze baseline legt de akkoord bevonden technische POC-stand vast voor de bestaande Stroomuitval-scope:
Basispakket + Stroomuitval, 72 uur, 2 volwassenen, zonder checkout, klantaccount of klantflow.

## SQL-volgorde

De schone regression-run is opgebouwd met:

1. `DROP DATABASE IF EXISTS ikoverleef_dev WITH (FORCE);`
2. `CREATE DATABASE ikoverleef_dev;`
3. `handoff/ikoverleef_agent_handoff_v1/database/schema_v1_0_1_clean.sql`
4. `handoff/ikoverleef_agent_handoff_v1/database/mini_masterdata_seed_stroomuitval_v1.sql`
5. `handoff/ikoverleef_agent_handoff_v1/database/contentbatch_1_stroomuitval_seed.sql`
6. `handoff/ikoverleef_agent_handoff_v1/database/qa_checks.sql`
7. Applicatiegrants voor `ioe_app` en read-only/Directus-grants voor `ioe_directus`
8. Directus bootstrap + `directus/seed_backoffice_metadata.sql`
9. Engine-run voor `tier_slug=basis`
10. Engine-run voor `tier_slug=basis_plus`

## Basis Expected Output

Input:

```json
{
  "package_slug": "basispakket",
  "tier_slug": "basis",
  "addon_slugs": ["stroomuitval"],
  "duration_hours": 72,
  "household_adults": 2,
  "household_children": 0,
  "household_pets": 0
}
```

| SKU | Qty | Type |
|---|---:|---|
| `IOE-PB-10K-BASIC` | 1 | core |
| `IOE-HEADLAMP-AAA-BASIC` | 2 | core |
| `IOE-LANTERN-AA-BASIC` | 1 | core |
| `IOE-RADIO-AA-BASIC` | 1 | core |
| `IOE-CABLE-USBC-BASIC` | 1 | accessory |
| `IOE-BATT-AAA-12-BASIC` | 1 | accessory |
| `IOE-BATT-AA-12-BASIC` | 1 | accessory |

## Basis+ Expected Output

Input:

```json
{
  "package_slug": "basispakket",
  "tier_slug": "basis_plus",
  "addon_slugs": ["stroomuitval"],
  "duration_hours": 72,
  "household_adults": 2,
  "household_children": 0,
  "household_pets": 0
}
```

| SKU | Qty | Type |
|---|---:|---|
| `IOE-PB-20K-PLUS` | 1 | core |
| `IOE-HEADLAMP-AAA-PLUS` | 2 | core |
| `IOE-LANTERN-AA-PLUS` | 1 | core |
| `IOE-RADIO-AAUSB-PLUS` | 1 | core |
| `IOE-CABLE-USBC-SET` | 1 | accessory |
| `IOE-BATT-AAA-12` | 1 | accessory |
| `IOE-BATT-AA-12` | 1 | accessory |

## QA-resultaten

Baseline vereist:

| Check | Verwacht |
|---|---:|
| Blocking QA totaal | 0 |
| Warning/context QA totaal | 0 |
| `qa_generated_lines_without_sources` | 0 |
| `qa_generated_line_product_type_mismatch` | 0 |

De blocking QA bestaat uit:

- `qa_active_scenarios_without_needs`
- `qa_active_needs_without_capabilities`
- `qa_scenario_needs_without_product_rules`
- `qa_product_types_without_capabilities`
- `qa_active_items_without_capabilities`
- `qa_variant_item_product_type_mismatch`
- `qa_default_candidate_conflicts`
- `qa_items_with_claimed_primary_coverage`
- `qa_required_accessories_missing_candidate_items`
- `qa_active_consumables_without_quantity_policy`
- `qa_claim_governance_scope_invalid`
- `qa_quantity_policy_invalid_scope`

## Known Issues

- Optional zaklamp is seeded als optional/supporting candidate, maar heeft nog geen aparte optional-outputsectie.
- Directus composite-PK beperking blijft een inspectiebeperking; het conceptuele datamodel is hiervoor niet aangepast.
- Scoring is nog een POC-heuristiek en geen definitief rankingmodel.
