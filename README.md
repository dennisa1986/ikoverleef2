# Ik overleef

Ik overleef is een database-first MVP voor uitlegbaar noodpakketadvies. De huidige release candidate bewijst dat backoffice, database, recommendation engine, interne MVP UI en regression suite samen een pakketadvies kunnen maken voor 72 uur voorbereiding.

## MVP RC1

`v1.0.0-mvp-rc1` bewijst:

- Basispakket met Basis en Basis+;
- meerdere add-ons tegelijk;
- profielinput voor volwassenen, kinderen, huisdieren en duur;
- generated package lines met aantallen;
- sources, coverage, tasks, warnings en QA summary;
- backoffice inspectie;
- reproduceerbare release-gate via regressions.

Dit is nog geen webshop. Checkout, betaling, winkelmand, account, klantprofielopslag en externe leverancierintegraties zijn bewust buiten scope.

## Architectuur

De flow blijft:

```txt
package / tier / add-ons / profiel
-> scenario's
-> needs
-> capabilities
-> productregels
-> quantity policies
-> productvarianten
-> item candidates
-> accessoire requirements
-> generated package lines
-> sources + coverage + QA
```

Packages en add-ons hangen nooit direct aan items.

## Repo-layout

- `backend/`: recommendation engine, regressions en package scripts.
- `apps/internal-poc/`: interne MVP UI, recommendation POC en backoffice POC.
- `handoff/ikoverleef_agent_handoff_v1/content_specs/`: specificaties en implementation mappings.
- `handoff/ikoverleef_agent_handoff_v1/database/`: seed- en databasebestanden.
- `handoff/ikoverleef_agent_handoff_v1/release_notes/`: release notes en acceptance notes.
- `scripts/`: kleine lokale hulpscripts.

## Vereisten

- Node.js 20+.
- Een lokale PostgreSQL database met de Ik overleef schema- en seeddata.
- Environmentvariabele `IOE_PG_URL`.

## Environment

Maak lokaal een `.env.local` in de repo-root:

```env
IOE_PG_URL=postgresql://ioe_app:<password>@localhost:5432/ikoverleef_dev
PORT=4173
```

Commit nooit echte wachtwoorden of connection strings. Gebruik `.env.example` en `backend/.env.example` alleen als placeholders.

## Installatie

```bash
cd backend
npm install
```

## MVP UI starten

Vanuit de repo-root:

```bash
npm run dev:mvp
```

Alternatief:

```bash
npm run start:internal-poc
```

Deze scripts lezen `.env.local` en geven een duidelijke foutmelding als `IOE_PG_URL` ontbreekt.

Belangrijkste routes:

- `http://127.0.0.1:4173/mvp`
- `http://127.0.0.1:4173/mvp/recommendation`
- `http://127.0.0.1:4173/internal/recommendation-poc`
- `http://127.0.0.1:4173/internal/backoffice-poc`

## Tests

Volledige MVP-gate:

```bash
npm run test:all-poc
```

Alleen RC-check:

```bash
npm run test:mvp-rc
```

Vanuit `backend/` kan ook elk los script worden gedraaid, bijvoorbeeld:

```bash
npm run test:mvp-rc-poc
npm run test:demo-readiness-poc
```

## Release discipline

Elke fase volgt:

```txt
specificatie
-> implementation mapping
-> mapping-check
-> implementatie
-> regressions
-> release note
-> commit/tag/push
```

Geen schemawijzigingen, enumwaarden, supplier_offer uitbreidingen of productlogica-wijzigingen zonder expliciete toestemming.

## Buiten scope

- checkout;
- betaling;
- winkelmand;
- auth;
- klantaccount;
- klantprofielopslag;
- voorraadreservering;
- externe leverancierintegraties;
- publieke marketingwebsite;
- volledige merkrebranding.
