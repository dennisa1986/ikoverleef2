# Release note v1.1.1-quality-impulse

## Fase
Fase 19 — Quality impulse & pre-demo hardening.

## Baseline
- Vertrekbasis: `v1.1.0-commerce-readiness-alpha`
- Vertrekcommit: `b980a53`

## Doel
Los de kritische reviewpunten op uit de code review van `v1.1.0-commerce-readiness-alpha` zonder nieuwe features, zonder productlogica-wijzigingen en zonder echte commerce.

## Scope
- Bug- en hardeningfixes op de bestaande publieke API-contracten en checklistpagina.
- Documentatie- en regression-uitbreidingen.
- Geen schema-, enum-, supplier_offer- of contentwijzigingen.

## Review-aanleiding
- Debug payload mistte `run_id` (`data.run_id` ipv `data.run.id`).
- `?debug=true` / `?internal=true` exposeerde interne QA-data zonder gating.
- `/health` en `/api/health` waren divergent qua shape.
- README en root `package.json` waren niet meer in sync met de v1.1.0-API.
- `next_actions` bevatte `future_shopify_checkout`, wat de "no checkout" framing ondergroef.
- API-responses waren standaard pretty-printed; onnodige bandbreedte voor publieke clients.
- Print-knop op `/pakket/checklist` gebruikte inline `onclick="window.print()"`.
- Geen aparte regression voor deze quality-laag.

## Debug run_id fix
`buildRecommendationApiPayload` schreef voorheen `payload.debug.run_id = data.run_id`, wat `undefined` was omdat het run-object op `data.run` zit. Gefixt naar `data.run?.id`. Regression `regression_quality_impulse_poc.js` controleert dat `debug.run_id` aanwezig is wanneer debug is toegestaan.

## Debug gating
`debugEnabled` is gegated achter de environment variable `IOE_ALLOW_PUBLIC_DEBUG=1` (alias: `POC_PUBLIC_DEBUG=1`). Zonder env-flag retourneert `/api/recommendation?debug=true` géén `debug` object, geen `qa_summary` en geen `run_id`. Met env-flag is debug zichtbaar voor lokale review.

## Health endpoint consistency
`/health` en `/api/health` retourneren nu dezelfde JSON-shape via een gedeelde `healthPayload()` helper:

```json
{
  "status": "ok",
  "mode": "poc",
  "commerce_mode": "preview",
  "checkout_enabled": false,
  "cart_enabled": false,
  "payment_enabled": false
}
```

`/api/health` is canonical; `/health` is een alias met identieke shape.

## README/package script sync
- `README.md` benoemt expliciet `v1.1.0-commerce-readiness-alpha` en `v1.1.1-quality-impulse`, de public funnel, checkout-preview, recommendation API, commerce payload API, checklist API, `/pakket/checklist` en de gating-regels (no real checkout, no Shopify, debug env-flag, compact JSON).
- Root `package.json`:
  - `version` → `1.1.1-quality-impulse`.
  - `test:all-poc` omvat nu `test:public-funnel-poc`, `test:public-funnel-polish-poc`, `test:commerce-readiness-poc` en `test:quality-impulse-poc` bovenop `test:mvp-suite-poc` en `test:mvp-rc-poc`.
  - Nieuw `test:quality-gate`: `quality-impulse-poc → commerce-readiness-poc → public-funnel-polish-poc → mvp-rc-poc`.
- `backend/package.json`: nieuw script `test:quality-impulse-poc`.

## Commerce next_actions naming
`next_actions` bevat niet meer `future_shopify_checkout`. Hernoemd naar `future_commerce_handoff` om geen suggestie van een actieve of nabije checkout-flow te wekken. De rest van de payload (`cart_eligible: false`, geen `cart_id`/`checkout_url`/`order_id`) is ongewijzigd.

## JSON formatting
`writeJson` is omgebouwd: standaard compact JSON (`JSON.stringify(payload)`). Pretty-printing alleen via `?pretty=true` *en* een actieve debug env-flag. Dit verbreekt het JSON-contract niet (zelfde keys, zelfde waarden); alleen whitespace wijzigt.

## Print handler
`onclick="window.print()"` in `/pakket/checklist` is vervangen door een knop met `id="ioe-print-button"` en een kleine inline `<script>` die via `addEventListener('click', …)` `window.print()` triggert. Dit is een tussenstap richting CSP-vriendelijke handlers; volledige CSP-hardening (externe script, nonce, etc.) is bewust later.

## Regressions
Nieuw: `backend/regression_quality_impulse_poc.js` (`npm run test:quality-impulse-poc`). Dekt:

1. `/api/health` 200 JSON met `status=ok`, `mode=poc`, `commerce_mode=preview`, `checkout_enabled=false`.
2. `/health` 200 JSON identiek qua shape aan `/api/health`.
3. `/api/health` body is compact JSON (geen pretty-print whitespace).
4. `/api/recommendation?debug=true&internal=true` zonder env-flag bevat geen `debug`, geen `qa_summary`, geen `run_id`.
5. Met `IOE_ALLOW_PUBLIC_DEBUG=1` bevat dezelfde call wel `debug.run_id` en `debug.qa_summary`.
6. `commerce-payload` bevat geen `future_shopify_checkout` en wel `future_commerce_handoff` (of `future_shopify_handoff`).
7. `commerce-payload` blijft `cart_eligible=false`; geen `cart_id`, `checkout_url`, `order_id`; per-line `cart_eligible=false`, `shopify_variant_id=null`.
8. `/pakket/checklist` bevat geen inline `onclick="window.print()"` en wel een `addEventListener('click', …)`-binding op `#ioe-print-button`.
9. Na verwijderen van de env-flag wordt debug opnieuw onderdrukt (no leakage van eerdere staat).
10. README bevat alle relevante markers (public funnel, `/pakket/checklist`, `/api/recommendation`, commerce payload, checkout-preview, `v1.1.1-quality-impulse`).
11. Root `package.json` bevat `test:quality-gate` en `test:all-poc` dekt commerce-readiness, public-funnel en quality-impulse.
12. `server.js` bevat geen Shopify-tokens, geen Storefront/Admin API-calls, geen `future_shopify_checkout` en geen inline `onclick="window.print()"`.

## Bewust buiten scope
- Geen Shopify-integratie, tokens of secrets.
- Geen echte cart, checkout-session, betaling, PSP-koppeling.
- Geen orderdatabase, klantaccount, auth, e-mail, voorraadreservering.
- Geen schema-, enum- of supplier_offer-wijzigingen.
- Geen nieuwe contentbatch.
- Geen scoring-, quantity-, coverage- of productlogica-wijziging.
- Geen grote refactor van `calculate.js` of `server.js`.
- Geen volledige CSP-hardening (externalisatie van scripts, nonces) — pas in latere fase.

## Validatie
Verwachte uitvoer (lokaal met `IOE_PG_URL` gezet):

```bash
cd backend
npm run test:quality-impulse-poc
npm run test:commerce-readiness-poc
npm run test:public-funnel-polish-poc
npm run test:public-funnel-poc
npm run test:mvp-rc-poc
npm run test:mvp-suite-poc

cd ..
npm run test:all-poc
npm run test:quality-gate
```

Verwacht: alle scripts groen.

QA-eisen:
- QA blocking = 0.
- generated lines without sources = 0.
- producttype mismatch = 0.
- forbidden UI links/CTA's = 0.
- geen Shopify tokens of secrets in repo.

## Open punten
- Volledige CSP-hardening (externe script of nonce voor print handler) — toekomstige fase.
- Eventuele consolidatie van duplicatie tussen `buildCommercePayload` en `buildChecklistPayload` — bewust nu niet aangepakt om logic-impact te vermijden.
- Pg connection pooling in `server.js` — niet in scope, blijft punt voor latere performance-fase.

## Conclusie
Quality impulse is afgerond. Bestaande contracten van `v1.1.0-commerce-readiness-alpha` zijn behouden, debug-leak is gedicht, health endpoints zijn consistent, payload-naming en JSON-formatting zijn gehard, en een dedicated regression bewaakt de fixes.
