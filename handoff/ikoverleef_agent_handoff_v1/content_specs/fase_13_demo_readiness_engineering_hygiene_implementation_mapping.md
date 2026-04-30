# Fase 13 — Demo readiness & engineering hygiene implementation mapping

## 1. Fasekarakter

Fase 13 is geen contentbatch en geen schemafase. Het is een demo-readiness en engineering-hygiene fase bovenop `v1.0.0-mvp-rc1`.

## 2. Baseline mapping

Vertrekpunt:

```txt
Tag: v1.0.0-mvp-rc1
Commit: abe7b48
```

Nieuwe baseline:

```txt
Tagvoorstel: v1.0.1-demo-readiness
```

## 3. Geen schemawijzigingen

Niet toevoegen:
- geen tabellen;
- geen kolommen;
- geen enumwaarden;
- geen supplier_offer-velden;
- geen Directus composite-PK wijziging;
- geen release registry tabel;
- geen test_result tabel;
- geen qa_result tabel.

## 4. Documentatie mapping

Documentatiebestanden mogen worden toegevoegd zonder database-impact.

Voorkeur:

```txt
README.md
CONTRIBUTING.md
backend/.env.example
handoff/ikoverleef_agent_handoff_v1/release_notes/acceptance_note_v1.0.0_mvp_rc1.md
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.0.1_demo_readiness_baseline.md
```

Eventueel aanvullend:

```txt
handoff/ikoverleef_agent_handoff_v1/README.md
```

Alleen committen als dit geen bestaande lokale handoff-setupmap met oude/ongewenste inhoud meeneemt.

## 5. Environment mapping

`IOE_PG_URL` blijft environmentvariabele. Geen secrets committen.

Toegestaan:
- `.env.example` met placeholders;
- script dat `.env.local` leest;
- README-instructie.

Niet toegestaan:
- echte DB-url;
- wachtwoord;
- API keys;
- secrets in docs of scripts.

## 6. Startscript mapping

Mogelijke implementatie:
- root `package.json` toevoegen als dit nog niet bestaat, of
- scripts toevoegen aan bestaande `backend/package.json`, of
- klein Node/PowerShell helper-script toevoegen.

Voorkeur als root package.json bestaat of veilig toegevoegd kan worden:

```json
{
  "scripts": {
    "dev:mvp": "node scripts/start_mvp.js",
    "test:mvp": "cd backend && npm run test:mvp-rc-poc",
    "test:all-poc": "cd backend && npm run test:mvp-suite-poc && npm run test:mvp-rc-poc"
  }
}
```

Als root package.json niet gewenst is, gebruik backend scripts en documenteer het.

## 7. UI-copy mapping

UI-copy mag worden aangepast in:

```txt
apps/internal-poc/server.js
```

Alleen presentatie-/labelwijzigingen. Geen recommendation semantics.

Mapping:
- Core items -> Kernitems
- Accessoires -> Accessoires
- Supporting items -> Ondersteunend
- Backup items -> Backup
- Optional additions -> Optioneel
- Tasks -> Taken
- Warnings -> Aandachtspunten
- QA summary -> Interne QA-status

Behoud technische inspectie in interne route.

## 8. Inputvalidatie mapping

Validatie mag in server/input parsing plaatsvinden, bij voorkeur in bestaande route parsing helpers.

Mapping:
- adults < 1 -> fallback 1 of duidelijke UI-melding
- children < 0 -> fallback 0
- pets < 0 -> fallback 0
- duration_hours < 24 -> fallback 72 of minimum 24
- unknown tier -> fallback basis_plus of duidelijke UI-melding
- unknown addon -> negeren met UI-melding of fallback

Geen wijziging aan DB policy formulas.

## 9. Test mapping

Nieuwe regression toegestaan:

```txt
backend/regression_demo_readiness_poc.js
```

Script:

```json
"test:demo-readiness-poc": "node regression_demo_readiness_poc.js"
```

Validaties:
- README bestaat;
- acceptance note bestaat;
- `.env.example` bevat placeholders en geen echte secrets;
- MVP-startscript of startinstructie bestaat;
- `/mvp` blijft werken;
- `/mvp/recommendation` blijft werken;
- ongeldige input crasht niet;
- geen checkout/account/betaling;
- `test:mvp-rc-poc` blijft groen.

## 10. CI mapping

CI toevoegen alleen als het niet leidt tot structureel rode GitHub checks door ontbrekende database.

Opties:
1. Geen CI, maar documenteren waarom.
2. CI met static checks/documentation only.
3. CI met database service als haalbaar.

Geen breekbare CI toevoegen.

## 11. Release mapping

Release note:

```txt
handoff/ikoverleef_agent_handoff_v1/release_notes/release_note_v1.0.1_demo_readiness_baseline.md
```

Tag:

```txt
v1.0.1-demo-readiness
```

Commitvoorstel:

```txt
chore(demo): improve mvp demo readiness and project onboarding
```

## 12. Go/no-go

Go als:
- geen schemawijziging;
- geen enumwijziging;
- geen supplier_offer-uitbreiding;
- geen checkout/account/betaling;
- alle regressions groen;
- README/startinstructies bruikbaar;
- acceptance note aanwezig.

No-go als:
- productlogica wijzigt;
- scoring/quantity/coverage wijzigt;
- secrets dreigen te worden gecommit;
- CI structureel rood zou worden;
- startscript echte credentials embedt.
