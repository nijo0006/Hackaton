/**
 * Datalag for prototypen.
 *
 * Med Supabase-nøgler i .env.local synkroniseres alt via Supabase Realtime (se remote.ts),
 * så telefoner og DJ-skærm deler data. Uden nøgler ligger state i localStorage og
 * synkroniseres live mellem faner via BroadcastChannel (+ 'storage'-eventet som backup).
 * Alle sider bruger kun funktionerne herfra.
 */
import { useSyncExternalStore } from 'react'
import { remote } from './remote'
import { createSeed } from './seed'
import { songKey } from './songs'
import { MINUTE, currentEventId } from './time'
import type { AppState, DjSettings, Song, SongRequest, Vote } from './types'

const STORAGE_KEY = 'onskeko:state:v1'
export const COOLDOWN_MS = 15 * MINUTE
export const RECENTLY_PLAYED_MS = 60 * MINUTE
export const GREETING_MAX = 80

const channel = !remote && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('onskeko') : null
const listeners = new Set<() => void>()

function readStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppState) : null
  } catch {
    return null
  }
}

function writeStorage(s: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Fx privat browsing – appen virker stadig i den aktuelle fane.
  }
}

function initialState(): AppState {
  const stored = readStorage()
  // Seed automatisk på ny, når en ny aften starter, så demoen altid ser levende ud.
  if (stored && stored.seededFor === currentEventId()) return stored
  const seeded = createSeed()
  writeStorage(seeded)
  return seeded
}

let state: AppState = remote ? createSeed() : initialState()

function emit() {
  listeners.forEach((l) => l())
}

function reloadFromStorage() {
  const next = readStorage()
  if (next) {
    state = next
    emit()
  }
}

if (remote) {
  remote.start(state, createSeed, currentEventId, (next) => {
    state = next
    emit()
  })
} else {
  channel?.addEventListener('message', reloadFromStorage)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) reloadFromStorage()
  })
}

/** Opdaterer state lokalt med det samme (optimistisk); med Supabase sendes ændringen også dertil. */
function update(mutate: (draft: AppState) => void) {
  const draft = structuredClone(state)
  mutate(draft)
  state = draft
  if (!remote) {
    writeStorage(state)
    channel?.postMessage('update')
  }
  emit()
}

export const backend: 'supabase' | 'local' = remote ? 'supabase' : 'local'

export function getState() {
  return state
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

// ---------- Selectors ----------

export interface RankedRequest extends SongRequest {
  votes: number
  rank: number
}

export function voteCount(s: AppState, requestId: string): number {
  return s.votes.filter((v) => v.requestId === requestId).length
}

export function hasVoted(s: AppState, requestId: string, guestId: string): boolean {
  return s.votes.some((v) => v.requestId === requestId && v.guestId === guestId)
}

export function eventRequests(s: AppState, clubId: string, eventId = currentEventId()): SongRequest[] {
  return s.requests.filter((r) => r.clubId === clubId && r.eventId === eventId)
}

/** Aktive ønsker sorteret efter stemmer (flest først), ved lighed det ældste ønske først. */
export function rankedQueue(s: AppState, clubId: string): RankedRequest[] {
  const counts = new Map<string, number>()
  for (const v of s.votes) counts.set(v.requestId, (counts.get(v.requestId) ?? 0) + 1)
  return eventRequests(s, clubId)
    .filter((r) => r.status === 'active')
    .map((r) => ({ ...r, votes: counts.get(r.id) ?? 0, rank: 0 }))
    .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export type SongAvailability =
  | { kind: 'free' }
  | { kind: 'requested'; request: SongRequest; votes: number }
  | { kind: 'played'; playedAt: number }
  | { kind: 'rejected' }
  | { kind: 'genre-blocked' }

export function songAvailability(s: AppState, clubId: string, song: Song, now = Date.now()): SongAvailability {
  const key = songKey(song.title, song.artist)
  const matches = eventRequests(s, clubId).filter((r) => r.songId === song.id || songKey(r.title, r.artist) === key)

  const active = matches.find((r) => r.status === 'active')
  if (active) return { kind: 'requested', request: active, votes: voteCount(s, active.id) }
  if (matches.some((r) => r.status === 'rejected')) return { kind: 'rejected' }
  const played = matches
    .filter((r) => r.status === 'played' && r.resolvedAt && now - r.resolvedAt < RECENTLY_PLAYED_MS)
    .sort((a, b) => b.resolvedAt! - a.resolvedAt!)[0]
  if (played) return { kind: 'played', playedAt: played.resolvedAt! }

  const allowed = settingsFor(s, clubId).allowedGenres
  if (allowed.length > 0 && !allowed.includes(song.genre)) return { kind: 'genre-blocked' }
  return { kind: 'free' }
}

/** Tidspunkt hvor gæsten må ønske igen. Afviste ønsker tæller ikke (ventetiden nulstilles). */
export function cooldownUntil(s: AppState, clubId: string, guestId: string): number {
  const last = eventRequests(s, clubId)
    .filter((r) => r.guestId === guestId && r.status !== 'rejected')
    .reduce((max, r) => Math.max(max, r.createdAt), 0)
  return last ? last + COOLDOWN_MS : 0
}

export function settingsFor(s: AppState, clubId: string): DjSettings {
  return s.settings[clubId] ?? { accepting: true, message: '', allowedGenres: [] }
}

// ---------- Actions ----------

export type RequestResult = { ok: true; requestId: string } | { ok: false; error: string }

export function requestSong(clubId: string, song: Song, guestId: string, greeting: string): RequestResult {
  const now = Date.now()
  if (!settingsFor(state, clubId).accepting) return { ok: false, error: 'DJ\'en har sat ønsker på pause.' }

  const availability = songAvailability(state, clubId, song, now)
  if (availability.kind === 'requested') {
    vote(availability.request.id, guestId)
    return { ok: true, requestId: availability.request.id }
  }
  if (availability.kind !== 'free') return { ok: false, error: 'Denne sang kan ikke ønskes lige nu.' }
  if (cooldownUntil(state, clubId, guestId) > now) return { ok: false, error: 'Du har allerede ønsket en sang for nylig.' }

  const id = `req-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const request: SongRequest = {
    id,
    clubId,
    eventId: currentEventId(),
    songId: song.id,
    title: song.title,
    artist: song.artist,
    cover: song.cover,
    genre: song.genre,
    guestId,
    greeting: greeting.trim().slice(0, GREETING_MAX),
    status: 'active',
    createdAt: now,
  }
  const firstVote: Vote = { requestId: id, guestId, createdAt: now }
  update((d) => {
    d.requests.push(request)
    d.votes.push(firstVote)
  })
  remote?.insertRequest(request, firstVote)
  return { ok: true, requestId: id }
}

export function vote(requestId: string, guestId: string) {
  if (hasVoted(state, requestId, guestId)) return
  const v: Vote = { requestId, guestId, createdAt: Date.now() }
  update((d) => {
    d.votes.push(v)
  })
  remote?.insertVote(v)
}

function setStatus(requestId: string, status: SongRequest['status']) {
  const resolvedAt = status === 'active' ? undefined : Date.now()
  update((d) => {
    const r = d.requests.find((x) => x.id === requestId)
    if (!r) return
    r.status = status
    r.resolvedAt = resolvedAt
  })
  remote?.updateRequest(requestId, status, resolvedAt)
}

export const markPlayed = (id: string) => setStatus(id, 'played')
export const rejectRequest = (id: string) => setStatus(id, 'rejected')
export const restoreRequest = (id: string) => setStatus(id, 'active')

export function updateSettings(clubId: string, patch: Partial<DjSettings>) {
  const next = { ...settingsFor(state, clubId), ...patch }
  update((d) => {
    d.settings[clubId] = next
  })
  remote?.upsertSettings(clubId, next)
}

export function resetDemo() {
  state = createSeed()
  emit()
  if (remote) {
    void remote.reseed(state)
    return
  }
  writeStorage(state)
  channel?.postMessage('update')
}
