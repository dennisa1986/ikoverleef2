# Contributing

Werk aan Ik overleef volgt een vaste release-discipline.

## Vaste workflow

1. Voeg eerst een specificatie toe.
2. Voeg daarna een implementation mapping toe.
3. Rapporteer een mapping-check voor implementatie.
4. Implementeer pas als de mapping-check groen is.
5. Draai regressions.
6. Maak een release note.
7. Commit, tag en push pas na groene validatie.

## Architectuurregels

- Database-first.
- Geen schemawijzigingen zonder expliciete toestemming.
- Geen nieuwe enumwaarden zonder expliciete toestemming.
- Geen supplier_offer uitbreiding zonder expliciete toestemming.
- Geen Directus composite-PK wijziging.
- Packages en add-ons hangen nooit direct aan items.
- Packages en add-ons activeren scenario's.
- Scenario's leiden via needs, capabilities, productregels, quantity policies, candidates en accessoirelogica tot generated package lines.
- Geen scoring-, quantity- of coverage-semantiek wijzigen zonder expliciete opdracht.

## Buiten scope zonder expliciete opdracht

- checkout;
- betaling;
- winkelmand;
- auth;
- klantaccount;
- klantprofielopslag;
- externe leverancierintegraties;
- voorraadreservering;
- nieuwe contentdomeinen;
- nieuwe producttypes;
- nieuwe itemcatalogus.

## Secrets

- Commit geen echte `.env` of `.env.local`.
- Commit geen wachtwoorden, tokens, API keys of echte database URLs.
- Gebruik alleen `.env.example` met placeholders.

## Regressions

Voor releasewerk is de minimale gate:

```bash
npm run test:all-poc
```

Voor demo-readiness:

```bash
cd backend
npm run test:demo-readiness-poc
```

Als een regression rood is, geen tag maken.
