# Fase 12 — MVP RC implementation mapping

## 1. Doel van dit mappingdocument

Dit document vertaalt de MVP RC-specificatie naar concrete implementatie binnen het bestaande Ik overleef-datamodel en de bestaande codebase.

Belangrijk: Fase 12 is een release-candidate hardeningfase. Er worden in principe geen nieuwe contentdomeinen, producttypes, schemaonderdelen of enumwaarden toegevoegd.

## 2. Geen schemawijzigingen

Niet toegestaan:

- geen nieuwe tabellen;
- geen nieuwe kolommen;
- geen nieuwe enumwaarden;
- geen supplier_offer uitbreiding;
- geen Directus composite-PK aanpassing;
- geen release registry tabel;
- geen qa_result/test_result tabel;
- geen checkout/cart/customer/session tabellen.

Alles moet via bestaande runtime-output, bestaande routes, bestaande regressions, release notes en Git-tags worden gevalideerd.

## 3. Baseline mapping

Laatste baseline vóór Fase 12:

```txt
v0.12.0-regression-suite-baseline
```

Doelbaseline Fase 12:

```txt
v1.0.0-mvp-rc1
```

Deze baseline wordt vastgelegd via:

- release note markdown;
- Git commit;
- Git tag;
- remote push;
- eindrapportage.

Geen database release registry.

## 4. Route mapping

Bestaande routes blijven leidend:

| Route | Mapping |
|---|---|
| `/` | redirect naar `/mvp` of MVP entry |
| `/mvp` | MVP configurator |
| `/mvp/recommendation` | MVP adviesresultaat |
| `/internal/recommendation-poc` | interne engine inspectie |
| `/internal/backoffice-poc` | interne backoffice inspectie |

Geen publieke marketingwebsite en geen aparte frontend-app vereist in deze fase.

## 5. Input mapping

Gebruik bestaande runtime input:

| UI input | Engine input |
|---|---|
| package | `package_slug` |
| tier | `tier_slug` |
| addons/addon | `addon_slugs[]` |
| adults | `household_adults` |
| children | `household_children` |
| pets | `household_pets` |
| duration_hours | `duration_hours` |

Geen klantprofielopslag.

## 6. Output mapping

Gebruik bestaande engine-output uit Fase 8/10:

```js
{
  sections: {
    core_items: [],
    accessories: [],
    supporting_items: [],
    backup_items: [],
    optional_additions: []
  },
  tasks: [],
  warnings: [],
  qa_summary: {}
}
```

Deze structuur is runtime-output en geen database schema.

## 7. Backoffice mapping

Gebruik bestaande runtime/read-only queries uit Fase 9:

- QA summary;
- scenario matrix;
- product readiness;
- candidate readiness;
- governance attention;
- supplier offer attention;
- release baseline overview;
- open attention points.

Indien de release baseline lijst statisch in code staat, mag `v1.0.0-mvp-rc1` als target/current worden toegevoegd aan runtimeconfiguratie. Dit is geen databasewijziging.

## 8. Regression mapping

Bestaande scripts blijven leidend:

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
- `test:mvp-suite-poc`

Nieuw toe te voegen script:

```json
"test:mvp-rc-poc": "node regression_mvp_rc_poc.js"
```

## 9. MVP RC regression mapping

Maak:

```txt
backend/regression_mvp_rc_poc.js
```

De regression mag bestaande helpers uit `apps/internal-poc/server.js` en `backend/calculate.js` hergebruiken.

Valideer minimaal:

- `/` redirect of MVP entry;
- `/mvp` configurator;
- `/mvp/recommendation` voor MVP-startpakket;
- `/mvp/recommendation` voor complete 72u POC;
- `/internal/recommendation-poc`;
- `/internal/backoffice-poc`;
- runtime sections;
- tasks;
- warnings;
- QA summary;
- forbidden productlines;
- geen checkout/account/payment/cart links;
- release baseline target/current bevat `v1.0.0-mvp-rc1`;
- master suite groen.

## 10. Forbidden UI mapping

De UI mag geen links of CTA’s bevatten naar:

- checkout;
- cart;
- winkelmand;
- betaling;
- payment;
- account;
- login;
- register.

Let op: een release note of tekst mag “geen checkout” benoemen. De regression moet vooral checken op links/CTA’s en niet op toegelichte scopebeperkingen in release notes.

## 11. Forbidden product mapping

Generated package lines mogen geen SKU/producttype bevatten voor:

- medicatie;
- pijnstillers;
- documenten;
- ID/paspoort;
- cash;
- sleutels;
- contacten;
- babyspullen;
- huisdiervoer;
- huisdiermedicatie.

Tasks mogen deze onderwerpen wel noemen.

## 12. Release note mapping

Maak:

```txt
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.0.0_mvp_rc1.md
```

Geen release registry tabel.

## 13. Package script mapping

Voeg toe aan `backend/package.json`:

```json
"test:mvp-rc-poc": "node regression_mvp_rc_poc.js"
```

Optioneel, alleen als veilig:

```json
"test:mvp-rc": "npm run test:mvp-suite-poc && npm run test:mvp-rc-poc"
```

## 14. Git/tag mapping

Commit message:

```txt
chore(release): prepare mvp rc1
```

Tag:

```txt
v1.0.0-mvp-rc1
```

Niet taggen als regressions niet groen zijn.

## 15. Go/no-go

Implementatie kan doorgaan als:

- geen schemawijziging nodig is;
- geen nieuwe enum nodig is;
- geen supplier_offer uitbreiding nodig is;
- geen checkout/account/betaling nodig is;
- MVP RC kan worden gevalideerd via runtime-output, tests, release note en Git-tag.
