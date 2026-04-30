# Release note — v1.0.1-demo-readiness

## Fase
Fase 13 — Demo readiness & engineering hygiene

## Baseline
- Vertrekbasis: `v1.0.0-mvp-rc1`
- Vertrekcommit: `abe7b48`
- Nieuwe tag: `v1.0.1-demo-readiness`

## Doel
Deze baseline maakt MVP RC1 beter startbaar, uitlegbaar, overdraagbaar en geschikt voor interne demo of besloten feedback.

## Scope
Binnen scope:

- README en onboarding;
- contributing/workflow documentatie;
- veilige `.env.example` placeholders;
- MVP startscript;
- acceptance note voor MVP RC1;
- lichte MVP UI-copy polish;
- lichte inputvalidatie;
- demo-readiness regression.

## Wat Is Verbeterd
- Root `README.md` beschrijft project, architectuur, setup, routes, tests en release discipline.
- Root `CONTRIBUTING.md` legt de vaste workflow en architectuurregels vast.
- `npm run dev:mvp` start de interne MVP UI met `.env.local`.
- `node apps/internal-poc/server.js` kan `.env.local` gebruiken zonder handmatige `IOE_PG_URL` injectie.
- MVP labels zijn begrijpelijker gemaakt, met Engelse termen behouden voor herkenbaarheid.
- UI input wordt licht genormaliseerd zodat normale ongeldige input niet tot een 500 leidt.

## Startscript/environment
- Root `.env.example` en `backend/.env.example` bevatten alleen placeholders.
- Geen secrets gecommit.
- Startscript: `scripts/start_mvp.js`.
- Routes na start:
  - `/mvp`
  - `/mvp/recommendation`
  - `/internal/recommendation-poc`
  - `/internal/backoffice-poc`

## README/CONTRIBUTING
- README bevat MVP RC1-uitleg, lokale setup, `IOE_PG_URL`, tests, routes en buiten-scope punten.
- CONTRIBUTING bevat spec -> mapping -> mapping-check -> implementatie -> regressions -> release note -> commit/tag/push.

## Acceptance Note
Toegevoegd:

```txt
handoff/ikoverleef_agent_handoff_v1/release_notes/acceptance_note_v1.0.0_mvp_rc1.md
```

De note legt vast dat MVP RC1 functioneel is geaccepteerd als basis voor demo-readiness.

## UI-copy/inputvalidatie
- Core items -> Kernitems (Core items)
- Supporting items -> Ondersteunend (Supporting items)
- Backup items -> Backup (Backup items)
- Optional additions -> Optioneel (Optional additions)
- Tasks -> Taken (Tasks)
- Warnings -> Aandachtspunten (Warnings)
- QA summary -> Interne QA-status (QA summary)

Inputvalidatie:

- adults minimaal 1;
- children minimaal 0;
- pets minimaal 0;
- duration_hours minimaal 24;
- tier fallback naar `basis_plus`;
- onbekende add-ons worden genegeerd met bestaande fallback.

## Validatie
Groen gedraaid:

- alle bestaande POC regressions;
- `npm run test:mvp-rc-poc`;
- `npm run test:demo-readiness-poc`.

QA:

- QA blocking = 0
- generated lines without sources = 0
- generated line producttype mismatch = 0
- forbidden UI links/CTA's = 0

## Bewust Buiten Scope
- Geen nieuwe productcontent.
- Geen nieuwe contentbatch.
- Geen schemawijziging.
- Geen nieuwe enumwaarden.
- Geen supplier_offer uitbreiding.
- Geen checkout, betaling, winkelmand, auth of klantaccount.
- Geen klantprofielopslag.
- Geen productlogica-, scoring-, quantity- of coverage-wijziging.
- Geen publieke marketingwebsite.

## Open Punten
- MVP UI blijft een interne POC-server.
- Directus role/permission inrichting blijft later.
- Supplier offers blijven POC/handmatig.
- Geen CI toegevoegd omdat de volledige suite een lokale database vereist.

## Conclusie
MVP is demo-ready als `v1.0.1-demo-readiness`.
