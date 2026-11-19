import { LOCAL_SONGS } from './songs'
import { MINUTE, currentEventId, eventIdFor } from './time'
import type { AppState, RequestStatus, Song, SongRequest, Vote } from './types'

export const DEMO_CLUB_ID = 'nova'

function song(title: string): Song {
  const s = LOCAL_SONGS.find((x) => x.title === title)
  if (!s) throw new Error(`Seed-sang mangler: ${title}`)
  return s
}

// Lille deterministisk tilfældighedsgenerator, så historikken ser ens ud hver gang.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

let counter = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

function makeRequest(s: Song, eventId: string, guestId: string, createdAt: number, status: RequestStatus, greeting = '', resolvedAt?: number): SongRequest {
  return {
    id: uid('req'),
    clubId: DEMO_CLUB_ID,
    eventId,
    songId: s.id,
    title: s.title,
    artist: s.artist,
    cover: s.cover,
    genre: s.genre,
    guestId,
    greeting,
    status,
    createdAt,
    resolvedAt,
  }
}

function addVotes(votes: Vote[], req: SongRequest, count: number, guestPool: string[], rand: () => number) {
  // Den, der ønskede sangen, tæller som første stemme.
  votes.push({ requestId: req.id, guestId: req.guestId, createdAt: req.createdAt })
  const used = new Set([req.guestId])
  for (let i = 1; i < count; i++) {
    let g = guestPool[Math.floor(rand() * guestPool.length)]
    while (used.has(g)) g = `${g}x`
    used.add(g)
    votes.push({ requestId: req.id, guestId: g, createdAt: req.createdAt + Math.floor(rand() * 20 * MINUTE) })
  }
}

export function createSeed(): AppState {
  const now = Date.now()
  const tonight = currentEventId()
  const rand = rng(42)
  const requests: SongRequest[] = []
  const votes: Vote[] = []
  const tonightGuests = Array.from({ length: 60 }, (_, i) => `seed-guest-${i}`)

  // Aftenens aktive ønsker: [sang, stemmer, minutter siden, hilsen]
  const active: [string, number, number, string?][] = [
    ['One More Time', 24, 52],
    ['Mr. Brightside', 17, 47],
    ['Levels', 11, 38],
    ['Get Lucky', 9, 31, 'Det er min fødselsdag! 🎂'],
    ['Hung Up', 7, 24],
    ['Show Me Love', 5, 18, 'Til pigerne ved bar 2 💃'],
    ['September', 3, 9],
    ['Blinding Lights', 2, 4],
  ]
  active.forEach(([title, count, ago, greeting], i) => {
    const req = makeRequest(song(title), tonight, tonightGuests[i], now - ago * MINUTE, 'active', greeting)
    requests.push(req)
    addVotes(votes, req, count, tonightGuests, rand)
  })

  const played = makeRequest(song('Harder, Better, Faster, Stronger'), tonight, tonightGuests[20], now - 70 * MINUTE, 'played', '', now - 20 * MINUTE)
  const played2 = makeRequest(song('Titanium'), tonight, tonightGuests[21], now - 90 * MINUTE, 'played', '', now - 45 * MINUTE)
  const rejected = makeRequest(song('Gangnam Style'), tonight, tonightGuests[22], now - 60 * MINUTE, 'rejected', 'SPIL DEN!!!', now - 55 * MINUTE)
  for (const [req, n] of [[played, 14], [played2, 8], [rejected, 2]] as const) {
    requests.push(req)
    addVotes(votes, req, n, tonightGuests, rand)
  }

  // Tidligere aftener til klub-dashboardet.
  for (const daysAgo of [1, 7, 8]) {
    const start = new Date(now - daysAgo * 24 * 60 * MINUTE)
    start.setHours(22, 0, 0, 0)
    const eventId = eventIdFor(start.getTime())
    const pool = Array.from({ length: 90 + Math.floor(rand() * 60) }, (_, i) => `hist-${daysAgo}-${i}`)
    const n = 35 + Math.floor(rand() * 25)
    for (let i = 0; i < n; i++) {
      // Flere ønsker omkring kl. 00-01 end i starten og slutningen af aftenen.
      const t = start.getTime() + Math.floor(((rand() + rand() + rand()) / 3) * 5.5 * 60 * MINUTE)
      // Vægt mod house/disco, så genrefordelingen ligner en klub.
      const idx = Math.floor(Math.pow(rand(), 1.6) * LOCAL_SONGS.length)
      const r = rand()
      const status: RequestStatus = r < 0.55 ? 'played' : r < 0.75 ? 'rejected' : 'active'
      const req = makeRequest(LOCAL_SONGS[idx], eventId, pool[i % pool.length], t, status, '', status === 'active' ? undefined : t + Math.floor(rand() * 40 * MINUTE))
      requests.push(req)
      addVotes(votes, req, 1 + Math.floor(rand() * 14), pool, rand)
    }
  }

  return {
    seededFor: tonight,
    clubs: {
      [DEMO_CLUB_ID]: { id: DEMO_CLUB_ID, name: 'Club Nova', djName: 'DJ Mira', djUser: 'mira', djPin: '1234' },
    },
    requests,
    votes,
    settings: {
      [DEMO_CLUB_ID]: { accepting: true, message: '', allowedGenres: [] },
    },
  }
}
