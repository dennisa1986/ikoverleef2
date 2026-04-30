# Release note — v1.0.2-end-user-framing

## Fase
Fase 14 — Eindgebruikersframing & adviespresentatie

## Baseline
- Vertrekbasis: `v1.0.1-demo-readiness`
- Vertrekcommit: `b5216be`
- Nieuwe tag: `v1.0.2-end-user-framing`

## Doel
De bestaande MVP-adviesflow begrijpelijker maken voor eindgebruikersreview, zonder webshop, checkout, account, prijzen, voorraad of leverancierintegratie te bouwen.

## Aanleiding uit review
- De engine en contentlogica werken.
- `/mvp` voelde nog te veel als interne validatie-tool.
- Gebruikers misten verwachting vooraf en een duidelijke volgende stap.
- Interne details waren te prominent op de adviespagina.
- Aandachtspunten stonden te veel als lange technische lijst.

## Scope
Binnen scope:

- `/mvp` configuratorcopy;
- add-on-groepering;
- `/mvp/recommendation` adviespresentatie;
- vereenvoudigde hoofdsecties;
- warning-groepering;
- volgende-stap sectie;
- demo-disclaimer;
- end-user framing regression.

## Wat Is Verbeterd
- Configurator opent met duidelijke verwachting: adviespreview, geen bestelling.
- Basis/Basis+ worden kort uitgelegd.
- Add-ons zijn gegroepeerd in herkenbare domeinen.
- Adviespagina gebruikt eindgebruikerssecties:
  - Kern van je pakket;
  - Benodigde accessoires;
  - Backup en ondersteuning;
  - Persoonlijke taken;
  - Aandachtspunten;
  - Wat kun je nu doen?
- Demo-disclaimer maakt duidelijk dat product- en leveranciersdata placeholder kunnen zijn.

## Routegedrag
Ongewijzigde routes:

- `/mvp`
- `/mvp/recommendation`
- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## Eindgebruikersframing
De MVP route is nu een adviespreview in plaats van een interne validatiepagina. De gebruiker ziet wat hij/zij invult, wat het advies oplevert en wat daarna praktisch gedaan kan worden.

## Interne Details Verplaatst
Op `/mvp/recommendation` zijn SKU, run-id, technische coverage/source-tabellen, producttype slugs, capability slugs en backoffice-link niet meer prominent zichtbaar.

Technische inspectie blijft beschikbaar via:

- `/internal/recommendation-poc`
- `/internal/backoffice-poc`

## Warning-groepering
Aandachtspunten worden runtime gegroepeerd en ontdubbeld in onder meer:

- Water & voedselveiligheid;
- Vuur, gas & gebruiksveiligheid;
- Medisch & EHBO;
- Evacuatie & documenten;
- Opslag & houdbaarheid;
- Persoonlijke checks.

## CTA/Volgende Stap
Toegevoegd:

- Print of bewaar deze checklist;
- Gebruik dit als boodschappenlijst;
- Bespreek dit advies met je huishouden;
- Vraag later een pakketvoorstel aan als demo-copy zonder verwerking;
- Bekijk interne onderbouwing voor test en review.

Er is geen leadopslag, e-mailverzending, checkout, betaling of accountflow toegevoegd.

## Validatie
Groen gedraaid:

- alle bestaande POC regressions;
- `npm run test:mvp-rc-poc`;
- `npm run test:demo-readiness-poc`;
- `npm run test:end-user-framing-poc`.

QA:

- QA blocking = 0
- generated lines without sources = 0
- producttype mismatch = 0
- forbidden UI links/CTA's = 0

## Bewust Buiten Scope
- Geen checkout.
- Geen betaling.
- Geen winkelmand.
- Geen account/auth.
- Geen klantprofielopslag.
- Geen echte prijzen.
- Geen voorraadreservering.
- Geen leverancierintegraties.
- Geen schemawijzigingen.
- Geen productlogica-, scoring-, quantity- of coverage-wijziging.

## Open Punten
- MVP blijft een interne POC-server.
- Visuele merklaag en echte commerciële flow komen later.
- Prijs, gewicht, voorraad en leveranciersinformatie zijn nog niet definitief.

## Conclusie
De MVP-adviesflow is beter geschikt voor eindgebruikersreview als `v1.0.2-end-user-framing`.
