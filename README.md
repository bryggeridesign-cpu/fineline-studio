# FineLine Studio

En Netlify-klar webapp som gjør bilder om til fine line-inspirert strekillustrasjon.

## Kom i gang
1. Installer Node.js 18 eller nyere.
2. Kjør `npm install`.
3. Kjør `npm run dev` for lokal utvikling.
4. Kjør `npm run build` for produksjonsbygget.

## Publiser på Netlify
- Last opp prosjektet til et GitHub-repository og importer det i Netlify, eller dra `dist`-mappen til Netlify etter `npm run build`.
- Build command: `npm run build`
- Publish directory: `dist`

## Personvern og behandling
Standardbehandlingen skjer lokalt i nettleseren med Canvas API. Bildet sendes ikke til en server, og det brukes ingen AI-tjeneste eller automatisk innholdsmoderering. Dette gjør løsningen egnet for kunstneriske motiver, inkludert aktkunst, uten AI-leverandørens modereringsfilter.

## Om AI-valget
Appen er satt opp med lokal bildebehandling som fungerende standard. En reell AI-modus krever at du velger en konkret AI-leverandør og kobler til en sikker serverfunksjon/API-nøkkel. Ikke legg hemmelige API-nøkler i frontend. AI-leverandører kan ha egne regler for nakenhet og akt, så AI-modus kan ikke loves å være uten sensur. Den lokale modusen er derfor det pålitelige alternativet.

## Funksjoner
- Last opp JPG, PNG og WebP
- Finjuster detaljnivå, kontrast og linjetykkelse
- Vis original og resultat
- Last ned PNG
- Alt skjer lokalt i nettleseren
