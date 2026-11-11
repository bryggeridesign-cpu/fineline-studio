# FineLine Studio Pro 2.0

## Funksjoner
- Lokal bildebehandling i nettleseren, uten AI-tjeneste eller AI-moderering
- Kontur, fin line, tattoo stencil, gravering og minimalistisk stil
- Styrke, terskel, detaljnivå, støyreduksjon, invertering og fargevalg
- Original/forhåndsvisning, zoom og tilpass bilde
- PNG-eksport i høy oppløsning

## Lokal kjøring
Krev Node.js 18+:
1. `npm install`
2. `npm run dev`
3. `npm run build`

## Netlify
Build command: `npm run build`
Publish directory: `dist`
Branch: `main`

Last opp innholdet i prosjektmappen til eksisterende GitHub-repository. Netlify bygger automatisk på nytt ved commit.

## Personvern og AI
Denne versjonen bruker Canvas API og klassisk bildebehandling i nettleseren. Bilder sendes ikke til server eller AI-leverandør. Det finnes ikke noe automatisk modereringsfilter i lokal behandling. AI-modus er ikke aktivert; en eventuell ekstern AI-integrasjon må velges separat og kan ha egne vilkår.
