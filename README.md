# ønskekø 🎵

Gæster på en natklub ønsker sange til DJ'en fra telefonen – uden at gå op til pulten og forstyrre. Hackathon-prototype.

## De tre views

| View | URL | Til |
|---|---|---|
| 🙋 **Gæst** | http://localhost:5173/club/nova | Mobil – søg, ønsk og stem op (intet login) |
| 🎧 **DJ** | http://localhost:5173/dj/nova | Tablet/laptop – login: **mira** / **1234** |
| 🏢 **Klub** | http://localhost:5173/venue/nova | Desktop – dashboard og QR-kode |

Forsiden http://localhost:5173 har links til alle tre plus knapperne "Simulér gæster" og "Nulstil demo".

**På telefonen:** Start med `npm run dev:host`, og erstat `localhost` med den **Network**-adresse, Vite viser (fx `http://10.136.130.184:5173/club/nova`). Telefonen skal være på samme wifi som computeren.

## Kom i gang

```bash
cd onskeko
npm install
npm run dev
```

Vil du bruge den fælles Supabase-database (live på tværs af enheder), skal du lave filen `onskeko/.env.local` med URL og nøgle – spørg holdet. Uden den kører appen med lokal data.

Se [onskeko/README.md](onskeko/README.md) for opsætning af Supabase, regler i appen og demo-guide til præsentationen.
