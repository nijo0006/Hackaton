# ønskekø 🎵

Gæster på en natklub ønsker sange til DJ'en fra telefonen – uden at gå op til pulten og forstyrre. Hackathon-prototype.

## 🔗 Prøv appen – virker for alle, på alle enheder

| View | Link | Til |
|---|---|---|
| 🙋 **Gæst** | https://nijo0006.github.io/Hackaton/club/nova | Mobil – søg, ønsk og stem op (intet login) |
| 🎧 **DJ** | https://nijo0006.github.io/Hackaton/dj/nova | Tablet/laptop – login: **mira** / **1234** |
| 🏢 **Klub** | https://nijo0006.github.io/Hackaton/venue/nova | Desktop – dashboard og QR-kode |

Forsiden https://nijo0006.github.io/Hackaton/ har links til alle tre plus "Simulér gæster" og "Nulstil demo". Alle enheder deler data live via Supabase. Siden opdateres automatisk ved hvert push til `main`.

## Kør appen lokalt (til udvikling)

**⚠️ `localhost` virker kun på den computer, der kører appen.** Åbner man fx `http://localhost:5173/dj/nova` på en anden computer, prøver den at finde appen på *sin egen* maskine – og får en fejl.

- **På computeren der kører appen:** http://localhost:5173/club/nova, http://localhost:5173/dj/nova, http://localhost:5173/venue/nova
- **På alle andre computere og telefoner (samme wifi):** brug computerens netværksadresse i stedet for `localhost`, fx `http://10.136.130.184:5173/dj/nova`. Start appen med `npm run dev:host` – så står de rigtige links under **"Links til holdet"** på forsiden, klar til at kopiere.
- **Eller kør appen selv:** klon repo'et og følg "Kom i gang" nedenfor – så virker `localhost` på din egen computer.

## Kom i gang

```bash
cd onskeko
npm install
npm run dev
```

Vil du bruge den fælles Supabase-database (live på tværs af enheder), skal du lave filen `onskeko/.env.local` med URL og nøgle – spørg holdet. Uden den kører appen med lokal data.

Se [onskeko/README.md](onskeko/README.md) for opsætning af Supabase, regler i appen og demo-guide til præsentationen.
