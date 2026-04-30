# Fase 13 — Demo readiness & engineering hygiene v1

## 1. Waar we staan

Project **Ik overleef** heeft `v1.0.0-mvp-rc1` bereikt. De MVP RC1 bewijst dat backoffice, database, recommendation engine, UI MVP en regression suite end-to-end samenwerken voor een uitlegbaar 72-uurs pakketadvies.

De gebruiker heeft handmatig getest:
- Git/tag staan goed op `v1.0.0-mvp-rc1`.
- `npm run test:mvp-rc-poc` is groen.
- De UI werkt na correcte `IOE_PG_URL`-injectie.
- Drinkwater-profielruns werken.
- De MVP UI is functioneel correct, maar nog duidelijk een interne POC en geen webshop/publieke frontend.

Fase 13 is daarom geen nieuwe contentfase en geen webshopfase. Het is een polish- en hygiene-fase om MVP RC1 beter overdraagbaar, testbaar en demo-ready te maken.

## 2. Doel

Fase 13 moet de bestaande MVP RC1 verbeteren op:
1. Startbaarheid voor ontwikkelaar/gebruiker.
2. Documentatie en onboarding.
3. Demo-/acceptance-instructies.
4. Kleine UI-copy/label polish.
5. Veiligere inputvalidatie en route-feedback waar mogelijk zonder engine-semantiek te wijzigen.
6. Release-hygiëne.

## 3. Niet doen

Niet doen in Fase 13:
- Geen nieuwe productcontent.
- Geen nieuwe contentbatch.
- Geen nieuwe producttypes.
- Geen nieuwe itemcatalogus.
- Geen schemawijzigingen.
- Geen nieuwe enumwaarden.
- Geen supplier_offer-uitbreiding.
- Geen Directus composite-PK wijziging.
- Geen checkout, betaling, winkelmand, klantaccount, auth of klantprofielopslag.
- Geen voorraadreservering.
- Geen externe leverancierintegraties.
- Geen grote `calculate.js`-refactor.
- Geen scoring/quantity/coverage-semantiek wijzigen.
- Geen package/add-on direct aan items koppelen.
- Geen publieke marketingwebsite.
- Geen volledige merkrebranding.

## 4. Scope

### 4.1 README en onboarding

Maak of verbeter een root `README.md` met minimaal:
- Wat is Ik overleef?
- Wat bewijst MVP RC1?
- Architectuur in eenvoudige tekst.
- Repo-layout.
- Vereisten.
- Lokale setup.
- Environmentvariabelen.
- Hoe start je de MVP UI?
- Hoe draai je regressions?
- Belangrijkste routes.
- Wat is bewust buiten scope?
- Hoe werkt spec → mapping → implementatie?
- Hoe ga je om met secrets?

### 4.2 Environment en startgemak

Voeg demo-/dev-startscripts toe zodat de gebruiker niet handmatig `IOE_PG_URL` hoeft te injecteren voor de UI.

Gewenst:
- `npm run dev:mvp`
- `npm run start:internal-poc`
- of vergelijkbaar volgens bestaande repo-conventie.

Het script moet `.env.local` kunnen laden of duidelijke instructie geven als `IOE_PG_URL` ontbreekt.

Geen secrets committen.

### 4.3 `.env.example`

Er zijn lokaal untracked `.env.example`-bestanden genoemd. Beoordeel of deze veilig kunnen worden opgenomen.

Minimaal wenselijk:
- `backend/.env.example`
- eventueel root `.env.example`
- geen wachtwoorden
- geen echte connection strings
- alleen placeholders.

Voorbeeld:

```env
IOE_PG_URL=postgresql://ioe_app:<password>@localhost:5432/ikoverleef_dev
PORT=4173
```

Alleen committen als geen secrets aanwezig zijn.

### 4.4 Acceptance note

Maak een acceptance note voor de handmatige MVP RC1-test.

Voorgestelde locatie:

```txt
handoff/ikoverleef_agent_handoff_v1/release_notes/acceptance_note_v1.0.0_mvp_rc1.md
```

Inhoud:
- datum;
- baseline/tag;
- technische tests;
- UI-tests;
- bevinding dat functioneel correct;
- expliciet: nog geen webshop/publieke frontend;
- besluit: MVP RC1 functioneel geaccepteerd als basis voor demo-readiness.

### 4.5 CONTRIBUTING / agent workflow

Maak bij voorkeur een root `CONTRIBUTING.md` of handoff workflowdocument met:
- vaste werkwijze: specificatie → implementation mapping → mapping-check → implementatie → regressions → release note → commit/tag/push;
- database-first;
- geen nieuwe enum/schema zonder toestemming;
- packages/add-ons nooit direct aan items;
- regressions verplicht;
- geen secrets.

### 4.6 UI-copy polish

Kleine UI-copy-polish is toegestaan, mits:
- geen nieuwe engine-logica;
- geen productlogica hardcoded in UI;
- geen checkout/account/betaling;
- geen commerciële claims;
- geen paniektaal.

Doel:
- interne MVP iets begrijpelijker maken;
- debug/inspectie duidelijk scheiden van klantgerichte adviesinformatie;
- labels waar mogelijk Nederlands of begrijpelijker maken.

Voorbeelden:
- `Core items` → `Kernitems`
- `Supporting items` → `Ondersteunend`
- `Backup items` → `Backup`
- `Optional additions` → `Optioneel`
- `Tasks` → `Taken`
- `Warnings` → `Aandachtspunten`
- `QA summary` → `Interne QA-status`

Laat technische debugdetails beschikbaar, maar niet dominant op de MVP-pagina.

### 4.7 Inputvalidatie light

Voeg lichte runtime inputvalidatie toe waar dit zonder engine-semantiek kan:
- adults minimaal 1;
- children minimaal 0;
- pets minimaal 0;
- duration_hours minimaal 24, standaard 72;
- tier alleen `basis` of `basis_plus`;
- add-ons alleen uit bekende add-on allowlist.

Bij ongeldige input:
- geen crash;
- duidelijke fallback of duidelijke melding;
- geen 500-error voor normale UI-input.

Let op: wijzig geen quantity semantics in `calculate.js` tenzij strikt noodzakelijk en regressions groen blijven.

### 4.8 CI / npm test alias

Voeg minimaal een eenvoudige testalias toe:
- `npm test` of `npm run test:all-poc` draait de volledige MVP-gate.

Voeg GitHub Actions alleen toe als dat niet leidt tot structureel rode checks door ontbrekende database. Als CI zonder database niet zinvol is, documenteer dit en voeg geen breekbare workflow toe.

### 4.9 Release note

Maak release note:

```txt
release_note_v1.0.1_demo_readiness_baseline.md
```

Tagvoorstel:

```txt
v1.0.1-demo-readiness
```

## 5. Verwachte output

Na Fase 13 moet een nieuwe ontwikkelaar of gebruiker kunnen:
1. Repo openen.
2. README lezen.
3. Environment instellen.
4. Backendtests draaien.
5. MVP UI starten.
6. `/mvp` openen.
7. Demo-scenario’s testen.
8. Begrijpen wat wel/niet binnen scope is.

## 6. Validatiecriteria

Fase 13 is afgerond als:
- README aanwezig en bruikbaar is.
- Startscript of duidelijke startinstructie aanwezig is.
- `.env.example` veilig aanwezig is of expliciet niet gecommit wegens risico.
- Acceptance note aanwezig is.
- CONTRIBUTING of agent workflowdoc aanwezig is.
- Alle bestaande regressions groen blijven.
- MVP RC-test groen blijft.
- Geen schemawijzigingen zijn gedaan.
- Geen nieuwe enumwaarden zijn toegevoegd.
- Geen checkout/account/betaling is toegevoegd.
- Geen productlogica is gewijzigd.
- Release note en tag zijn gemaakt en gepusht.

## 7. Open punten na Fase 13

Waarschijnlijk blijven deze punten bewust open:
- echte publieke webshop UI;
- merklaag;
- checkout/betaling;
- klantaccounts;
- supplier-integraties;
- Directus role/permission inrichting;
- grote engine-refactor;
- DB-gedreven explanation management;
- seed execution tracking.
