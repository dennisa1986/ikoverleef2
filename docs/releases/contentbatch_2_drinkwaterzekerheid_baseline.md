# Contentbatch 2 Drinkwaterzekerheid Baseline

Datum: 2026-04-28

Deze baseline legt Fase 1 Drinkwaterzekerheid vast bovenop de Stroomuitval-baseline `v0.1.0-stroomuitval-baseline`.
De scope blijft intern/technisch: geen checkout, klantaccount, betaalflow of klantgerichte flow.

## SQL-volgorde

De schone regression-run is opgebouwd met:

1. `DROP DATABASE IF EXISTS ikoverleef_dev WITH (FORCE);`
2. `CREATE DATABASE ikoverleef_dev;`
3. `handoff/ikoverleef_agent_handoff_v1/database/schema_v1_0_1_clean.sql`
4. `handoff/ikoverleef_agent_handoff_v1/database/mini_masterdata_seed_stroomuitval_v1.sql`
5. `handoff/ikoverleef_agent_handoff_v1/database/contentbatch_1_stroomuitval_seed.sql`
6. `handoff/ikoverleef_agent_handoff_v1/database/contentbatch_2_drinkwaterzekerheid_seed.sql`
7. `handoff/ikoverleef_agent_handoff_v1/database/qa_checks.sql`
8. Applicatiegrants voor `ioe_app` en read-only/Directus-grants voor `ioe_directus`
9. Directus bootstrap + `directus/seed_backoffice_metadata.sql`
10. Regression-run voor Stroomuitval Basis/Basis+
11. Regression-run voor Drinkwater Basis/Basis+

## Basis Expected Output

Input:

```json
{
  "package_slug": "basispakket",
  "tier_slug": "basis",
  "addon_slugs": ["drinkwater"],
  "duration_hours": 72,
  "household_adults": 2,
  "household_children": 0,
  "household_pets": 0
}
```

| SKU | Qty | Type | Notes |
|---|---:|---|---|
| `IOE-WATER-PACK-6L-BASIC` | 3 | core | 18 liter directe voorraad |
| `IOE-JERRYCAN-10L-BASIC` | 1 | core | 10 liter thuisopslag |
| `IOE-WATERFILTER-BASIC` | 1 | backup/core | Filterbackup, geen vervanging voor opslag |
| `IOE-WATER-TABS-BASIC` | 1 | backup/core | Backupbehandeling volgens instructie |

## Basis+ Expected Output

Input:

```json
{
  "package_slug": "basispakket",
  "tier_slug": "basis_plus",
  "addon_slugs": ["drinkwater"],
  "duration_hours": 72,
  "household_adults": 2,
  "household_children": 0,
  "household_pets": 0
}
```

| SKU | Qty | Type | Notes |
|---|---:|---|---|
| `IOE-WATER-PACK-6L-PLUS` | 3 | core | 18 liter betere voorraadverpakking |
| `IOE-JERRYCAN-20L-PLUS` | 1 | core | Robuuste 20L opslag met kraan |
| `IOE-WATERFILTER-PLUS` | 1 | backup/core | Betere filterbackup |
| `IOE-WATER-TABS-PLUS` | 1 | backup/core | Betere backupbehandeling |

## QA-resultaten

Baseline vereist en gevalideerd:

| Check | Resultaat |
|---|---:|
| Blocking QA totaal | 0 |
| Warning/context QA totaal | 0 |
| `qa_generated_lines_without_sources` | 0 |
| `qa_generated_line_product_type_mismatch` | 0 |
| `qa_evacuation_items_without_physical_specs` | 0 |

## Engine-aanpassingen

- `pack_size` rounding levert nu het aantal verpakkingen op: `ceil(liters / pack_size)`.
- `per_person_per_day` gebruikt aparte adult/child factoren en `ceil(duration_hours / 24)`.
- Drinkwater public explanations toegevoegd voor waterpack, jerrycan, filter, tabletten, drinkfles en filterfles.
- Regression lookup is add-on aware gemaakt, zodat Stroomuitval en Drinkwater elkaar niet overschrijven in "laatste run per tier".

## Coverage-afspraken

- Waterpack telt sufficient voor `drinkwater-voorraad-houden`.
- Jerrycan telt sufficient voor `drinkwater-opslaan`.
- Waterfilter telt alleen voor `water-filteren` en vervangt geen opslag.
- Waterzuiveringstabletten tellen alleen als backup voor `water-chemisch-behandelen` en vervangen geen voorraad.
- Filterfles en drinkfles zijn beperkt voorbereid voor evacuatie-water; thuis-drinkwater gebruikt ze niet.

## Known Issues

- Backupregels worden in de huidige engine nog als generated package lines met `is_core_line=true` geschreven; inhoudelijk zijn ze via rule role, explanation en coverage wel backup/supporting.
- Er is nog geen aparte optional/supporting outputsectie in de interne webapp.
- Evacuatie-water is alleen beperkt voorbereid; geen volledige evacuatiebatch.
- Directus composite-PK beperking blijft een inspectiebeperking; geen conceptuele schemawijziging.
- Scoring blijft een POC-heuristiek en geen definitief rankingmodel.

## Git

Commit en tag zijn nog niet gezet in deze implementatiestap.
Tagvoorstel: `v0.2.0-drinkwater-baseline`.
