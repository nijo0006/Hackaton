/**
 * Supabase-backend (valgfri). Aktiveres automatisk, når VITE_SUPABASE_URL og
 * VITE_SUPABASE_ANON_KEY er sat i .env.local – ellers bruger store.ts localStorage.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppState, DjSettings, Genre, SongRequest, Vote } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// ---------- Mapping mellem app (camelCase) og database (snake_case) ----------

interface RequestRow {
  id: string
  club_id: string
  event_id: string
  song_id: string
  title: string
  artist: string
  cover: string
  genre: string
  guest_id: string
  greeting: string
  status: SongRequest['status']
  created_at: number
  resolved_at: number | null
}

interface VoteRow {
  request_id: string
  guest_id: string
  created_at: number
}

interface SettingsRow {
  club_id: string
  accepting: boolean
  message: string
  allowed_genres: string[]
  seeded_for: string
}

const toRequestRow = (r: SongRequest): RequestRow => ({
  id: r.id,
  club_id: r.clubId,
  event_id: r.eventId,
  song_id: r.songId,
  title: r.title,
  artist: r.artist,
  cover: r.cover,
  genre: r.genre,
  guest_id: r.guestId,
  greeting: r.greeting,
  status: r.status,
  created_at: r.createdAt,
  resolved_at: r.resolvedAt ?? null,
})

const fromRequestRow = (r: RequestRow): SongRequest => ({
  id: r.id,
  clubId: r.club_id,
  eventId: r.event_id,
  songId: r.song_id,
  title: r.title,
  artist: r.artist,
  cover: r.cover,
  genre: r.genre as Genre,
  guestId: r.guest_id,
  greeting: r.greeting,
  status: r.status,
  createdAt: Number(r.created_at),
  resolvedAt: r.resolved_at == null ? undefined : Number(r.resolved_at),
})

const toVoteRow = (v: Vote): VoteRow => ({ request_id: v.requestId, guest_id: v.guestId, created_at: v.createdAt })
const fromVoteRow = (v: VoteRow): Vote => ({ requestId: v.request_id, guestId: v.guest_id, createdAt: Number(v.created_at) })

// ---------- Hjælpere ----------

/** Supabase returnerer maks. 1000 rækker pr. kald, så vi henter i sider. */
async function fetchAll<T>(db: SupabaseClient, table: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select('*').range(from, from + 999)
    if (error) throw error
    out.push(...(data as T[]))
    if (data.length < 1000) return out
  }
}

async function insertChunked(db: SupabaseClient, table: string, rows: object[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

function report(error: unknown) {
  console.error('[ønskekø] Supabase-fejl:', error)
}

// ---------- Offentlig API ----------

export interface Remote {
  start(base: AppState, createSeed: () => AppState, currentEventId: () => string, onState: (s: AppState) => void): void
  insertRequest(r: SongRequest, firstVote: Vote): void
  insertVote(v: Vote): void
  updateRequest(id: string, status: SongRequest['status'], resolvedAt: number | undefined): void
  upsertSettings(clubId: string, s: DjSettings): void
  reseed(seed: AppState): Promise<void>
}

function createRemote(db: SupabaseClient): Remote {
  let base: AppState
  let onState: (s: AppState) => void = () => {}
  let refetchTimer: ReturnType<typeof setTimeout> | null = null

  async function load(): Promise<{ state: AppState; seededFor: Record<string, string> }> {
    const [requests, votes, settings] = await Promise.all([
      fetchAll<RequestRow>(db, 'requests'),
      fetchAll<VoteRow>(db, 'votes'),
      fetchAll<SettingsRow>(db, 'dj_settings'),
    ])
    const seededFor: Record<string, string> = {}
    const settingsMap: Record<string, DjSettings> = { ...base.settings }
    for (const s of settings) {
      seededFor[s.club_id] = s.seeded_for
      settingsMap[s.club_id] = { accepting: s.accepting, message: s.message, allowedGenres: s.allowed_genres as Genre[] }
    }
    return {
      seededFor,
      state: { ...base, requests: requests.map(fromRequestRow), votes: votes.map(fromVoteRow), settings: settingsMap },
    }
  }

  async function refetch() {
    try {
      onState((await load()).state)
    } catch (e) {
      report(e)
    }
  }

  // Mange ændringer på én gang (fx "Simulér gæster" eller nulstil) samles til én genindlæsning.
  function scheduleRefetch() {
    if (refetchTimer) clearTimeout(refetchTimer)
    refetchTimer = setTimeout(refetch, 250)
  }

  const run = (p: PromiseLike<{ error: unknown }>) =>
    Promise.resolve(p).then(({ error }) => {
      if (error) {
        report(error)
        scheduleRefetch()
      }
    })

  async function reseed(seed: AppState) {
    for (const clubId of Object.keys(seed.clubs)) {
      const { error } = await db.from('requests').delete().eq('club_id', clubId)
      if (error) throw error
    }
    await insertChunked(db, 'requests', seed.requests.map(toRequestRow))
    await insertChunked(db, 'votes', seed.votes.map(toVoteRow))
    const settingsRows: SettingsRow[] = Object.entries(seed.settings).map(([clubId, s]) => ({
      club_id: clubId,
      accepting: s.accepting,
      message: s.message,
      allowed_genres: s.allowedGenres,
      seeded_for: seed.seededFor,
    }))
    const { error } = await db.from('dj_settings').upsert(settingsRows)
    if (error) throw error
  }

  return {
    start(initial, createSeed, currentEventId, listener) {
      base = { ...initial, requests: [], votes: [] }
      onState = listener
      onState(base)
      ;(async () => {
        try {
          const { state, seededFor } = await load()
          // Ny aften (eller tom database) → seed demo-data, så skærmene ser levende ud.
          if (Object.keys(base.clubs).some((id) => seededFor[id] !== currentEventId())) {
            const seed = createSeed()
            await reseed(seed)
            await refetch()
          } else onState(state)
        } catch (e) {
          report(e)
        }
      })()

      db.channel('onskeko')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, scheduleRefetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, scheduleRefetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dj_settings' }, scheduleRefetch)
        .subscribe()
    },

    insertRequest(r, firstVote) {
      // Ønsket skal findes, før stemmen kan pege på det.
      void run(db.from('requests').insert(toRequestRow(r))).then(() => run(db.from('votes').insert(toVoteRow(firstVote))))
    },

    insertVote(v) {
      void run(db.from('votes').upsert(toVoteRow(v), { ignoreDuplicates: true }))
    },

    updateRequest(id, status, resolvedAt) {
      void run(db.from('requests').update({ status, resolved_at: resolvedAt ?? null }).eq('id', id))
    },

    upsertSettings(clubId, s) {
      void run(
        db.from('dj_settings').upsert({ club_id: clubId, accepting: s.accepting, message: s.message, allowed_genres: s.allowedGenres }),
      )
    },

    async reseed(seed) {
      try {
        await reseed(seed)
      } catch (e) {
        report(e)
      }
      await refetch()
    },
  }
}

export const remote: Remote | null = url && key ? createRemote(createClient(url, key)) : null
