# Interne recommendation POC

Interne, niet-klantgerichte webapp-pagina voor de bestaande Stroomuitval recommendation output.

## Scope

Deze app:

```text
- leest de laatste generated recommendation_run voor de bestaande Stroomuitval POC-input;
- toont pakketregels, sources, coverage en QA-counts;
- gebruikt ioe_app via IOE_PG_URL;
- bouwt geen checkout, klantaccount, betaalflow of nieuwe content.
```

## Starten

Zorg dat `C:\IkOverleef2\.env.local` bestaat en `IOE_PG_URL` bevat.

```powershell
cd C:\IkOverleef2\apps\internal-poc
npm.cmd run start
```

Open:

```text
http://127.0.0.1:4173/internal/recommendation-poc
```

Tierkeuze:

```text
http://127.0.0.1:4173/internal/recommendation-poc?tier=basis
http://127.0.0.1:4173/internal/recommendation-poc?tier=basis_plus
```

Andere poort:

```powershell
$env:PORT=4174
npm.cmd run start
```

De server bindt standaard expliciet op `127.0.0.1`, zodat deze POC lokaal/intern blijft.

## Data

Gebruikte input:

```json
{
  "package_slug": "basispakket",
  "tier_slug": "basis of basis_plus",
  "addon_slugs": ["stroomuitval"],
  "duration_hours": 72,
  "household_adults": 2,
  "household_children": 0,
  "household_pets": 0
}
```

De app gebruikt alleen bestaande generated database-output. Draai de engine opnieuw wanneer je een nieuwe run wilt tonen.
