# Directus lokale POC

## Status

Directus is lokaal geinstalleerd in `C:\IkOverleef2\directus` en verbonden met dezelfde PostgreSQL database:

```text
ikoverleef_dev
```

Directus gebruikt de aparte database user `ioe_directus`. De recommendation engine gebruikt `ioe_app`. De `postgres` superuser is alleen voor lokaal beheer.

Echte lokale wachtwoorden staan in:

```text
C:\IkOverleef2\.env.local
C:\IkOverleef2\directus\.env
```

Commit of deel deze bestanden niet. Gebruik `C:\IkOverleef2\directus\.env.example` als template.

## Installatie

Directus v11 verwacht Node 22. De machine had Node 24 als globale runtime; daarom is een projectlokale Node 22 dependency toegevoegd.

```powershell
cd C:\IkOverleef2\directus
npm.cmd install
npm.cmd install node@22
node_modules\node\bin\node.exe "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" rebuild isolated-vm --foreground-scripts
npm.cmd run bootstrap
```

De eerste `npm install` op Node 24 faalde op `isolated-vm`; de rebuild onder Node 22 is de gebruikte lokale workaround.

## Starten

```powershell
cd C:\IkOverleef2\directus
npm.cmd run start
```

Open daarna:

```text
http://localhost:8055
```

Health-check:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8055/server/health
```

## Login

Admin e-mail:

```text
admin@ikoverleef.nl
```

Het lokale admin-wachtwoord staat in `C:\IkOverleef2\.env.local` als `DIRECTUS_ADMIN_PASSWORD`.

## Aangemaakte rollen

```text
Admin
Productbeheer
Expert/QA
```

Voor `Productbeheer` en `Expert/QA` zijn app policies en basis-permissions aangemaakt. `Admin` heeft volledige Directus admin/app access.

## Aangemaakte menu-groepen

```text
1. Frontstage keuzes
2. Scenario-intelligence
3. Productcatalogus
4. Rules & policies
5. Accessoires & fysieke specs
6. Safety & governance
7. Supplier & commerce
8. Recommendation snapshots
9. QA dashboards
```

De metadata-seed staat in:

```text
C:\IkOverleef2\directus\seed_backoffice_metadata.sql
```

## QA-dashboard

Dashboard:

```text
QA dashboard
```

Panelen:

```text
Blocking QA views
Warning QA views
```

De panelen documenteren de blocking en warning QA-views. De SQL QA is leidend; Directus is hier backoffice en inspectielaag.

## Bekende beperkingen

Directus waarschuwt dat tabellen met samengestelde primary keys worden genegeerd als collecties zonder enkelvoudige PK. Dit raakt onder andere:

```text
need_capability
scenario_need_capability_policy
product_type_capability
item_capability
package_scenario
addon_scenario
recommendation_run_addon
generated_line_coverage
```

Ik heb het conceptuele datamodel hiervoor niet aangepast. Voor een volgende POC-stap kun je kiezen tussen:

```text
1. Directus-only surrogate views maken voor beheer/inspectie.
2. Het datamodel expliciet uitbreiden met surrogate ids na inhoudelijke goedkeuring.
```

Voor nu is de afgesproken werkwijze:

```text
- Composiet-PK relaties blijven database-first beheerd via SQL en engine-output.
- Inspectie loopt via QA-views, generated output tabellen, en SQL queries in deze POC.
- Directus wordt niet gebruikt om deze koppeltabellen conceptueel te herontwerpen.
- Als redactiewerk op composiet-PK relaties nodig wordt, maken we eerst read-only
  inspectieviews of aparte Directus-only beheerprojecties, zonder de bronrelaties te wijzigen.
```
