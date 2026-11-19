# ønskekø 🎵

Klikbar prototype til hackathon: gæster på en natklub ønsker sange til DJ'en fra telefonen – uden at gå op til pulten og forstyrre.

- **Gæst** (mobil, intet login): søg, ønsk, stem op, se din plads i køen.
- **DJ** (tablet/laptop): live-liste sorteret efter stemmer, Spillet/Afvis, pause, besked til gæster, genrefilter, recap.
- **Klub** (desktop): nøgletal, top 10, genrefordeling, ønsker pr. time og klubbens QR-kode.

Bygget med React + Vite + TypeScript + Tailwind CSS.

## Kom i gang

Kræver Node 20+.

```bash
cd onskeko
npm install
npm run dev
```

Åbn http://localhost:5173.

| Route | Hvad |
|---|---|
| `/` | Demo-forside med links, "Simulér gæster" og "Nulstil demo" |
| `/club/nova` | Gæst |
| `/dj/nova` | DJ – login **mira / 1234** |
| `/dj/nova/recap` | DJ recap: spillede og afviste sange |
| `/venue/nova` | Klub-dashboard |

## Data: to tilstande

Appen vælger selv backend ud fra, om der ligger Supabase-nøgler i `.env.local`. Forsiden viser, hvilken tilstand der kører.

| | Uden nøgler (fallback) | Med Supabase |
|---|---|---|
| Hvor ligger data | `localStorage` i browseren | Supabase-database |
| Live-opdatering | Mellem faner i **samme browser** (`BroadcastChannel`) | På tværs af **alle enheder** (Supabase Realtime) |
| Opsætning | Ingen | 5 minutter (se nedenfor) |

Demo-data (Club Nova, DJ Mira, 8 aktive ønsker + 3 tidligere aftener) seedes automatisk første gang og igen, når en ny aften starter. "Nulstil demo" på forsiden seeder på ny – i Supabase-tilstand for alle enheder.

Al dataadgang går gennem `src/lib/store.ts`; Supabase-delen ligger i `src/lib/remote.ts`.

### Opsæt Supabase (så det virker på rigtige telefoner)

1. Opret en gratis konto og et nyt projekt på [supabase.com](https://supabase.com).
2. Gå til **SQL Editor → New query**, indsæt hele `supabase/schema.sql`, og tryk **Run**.
3. Gå til **Project Settings → API** (eller **Connect**), og kopiér **Project URL** og **anon public key**.
4. Kopiér `.env.example` til `.env.local`, og indsæt de to værdier:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. Genstart dev-serveren. Forsiden skal nu vise "Supabase: live på tværs af enheder".

> ⚠️ Prototypen har åbne regler (alle med anon-nøglen kan læse og skrive). Fint til en demo – ikke til rigtig drift.

### Åbn appen på telefonen

```bash
npm run dev:host
```

Vite viser en **Network**-adresse, fx `http://192.168.1.23:5173`. Telefonen skal være på samme wifi. Åbn klub-dashboardet via den adresse på laptoppen – så peger QR-koden også derhen, og gæster kan scanne den. (Skoler og offentlige wifi blokerer nogle gange trafik mellem enheder; så kan I bruge en mobil-hotspot eller deploye til fx Vercel/Netlify.)

## Sangsøgning

Søgning bruger [iTunes Search API](https://itunes.apple.com/search?term=daft+punk&entity=song&country=dk&limit=15) (gratis, ingen nøgle), debounced 300 ms. Fejler API'et (fx intet internet), søges der i en lokal liste på 41 sange i `src/data/songs.json` – vist som "Offline-katalog". iTunes-genrer mappes til House, Disco, Pop, Hip hop, Techno, Rock og Andet (`src/lib/genres.ts`).

## Regler i prototypen

- Maks. 1 ønske pr. gæst pr. 15 min. (nedtælling vises). Afviser DJ'en ønsket, nulstilles ventetiden.
- Én stemme pr. gæst pr. sang. Den, der ønsker, tæller som første stemme.
- Allerede ønsket → "Stem op" i stedet for "Ønsk" (match på sang-id eller titel + kunstner).
- Spillet inden for den sidste time eller afvist i aften → kan ikke ønskes.
- DJ'en kan begrænse til bestemte genrer og sætte ønsker på pause med en besked.
- Gæsten identificeres anonymt med et id gemt i browseren.

## Demo-guide til præsentationen (ca. 3 min.)

1. **Forside** – fortæl problemet: gæster afbryder DJ'en midt i mixet.
2. Åbn **DJ** på laptoppen (log ind med mira / 1234). Med Supabase: lad publikum/holdkammerater scanne QR-koden fra klub-dashboardet. Uden: åbn **Gæst** i et smalt vindue ved siden af (eller Chrome DevTools → mobilvisning).
3. **Gæst:** vis listen "Populære ønsker", stem en sang op → DJ-listen opdaterer sig med det samme.
4. **Gæst:** søg "daft punk". Vis at *One More Time* allerede er ønsket (Stem op), og at *Harder, Better…* er spillet for nylig. Ønsk *Around the World* med hilsenen "Det er min fødselsdag!" → bekræftelsesskærm med plads i køen.
5. **DJ:** den nye sang blinker i bunden med hilsenen. Tryk **Afvis** → gæsten får en venlig besked og kan ønske igen med det samme.
6. **DJ:** skriv "Kun house og disco efter kl. 01", vælg House + Disco som genrer, og sæt evt. på pause → vis gæstens skærm.
7. Gå til forsiden og tryk **Simulér gæster** – se ønsker og stemmer strømme ind hos DJ'en.
8. **Klub-dashboard:** nøgletal, genrer og tidligere aftener i dropdown'en; QR-koden til borde og bar.

Tip: Brug "Nulstil demo" lige inden præsentationen.

## Næste skridt (udeladt i prototypen)

- Stramme databaseregler (RLS) og en rigtig DJ-/klub-login via Supabase Auth.
- Spotify-integration: forslag der matcher klubbens genre og DJ'ens setliste.
- Push-notifikationer, når ønsket bliver spillet.
- Rigtigt login for DJ's og klubber samt betaling (freemium: gratis for gæster, klubben betaler).
