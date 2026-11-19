export const GENRES = ['House', 'Disco', 'Pop', 'Hip hop', 'Techno', 'Rock', 'Andet'] as const
export type Genre = (typeof GENRES)[number]

export interface Song {
  id: string // iTunes trackId (eller lokalt id)
  title: string
  artist: string
  cover: string
  genre: Genre
}

export interface Club {
  id: string
  name: string
  djName: string
  djUser: string
  djPin: string
}

export type RequestStatus = 'active' | 'played' | 'rejected'

export interface SongRequest {
  id: string
  clubId: string
  eventId: string // aftenens dato, fx "2026-11-19"
  songId: string
  title: string
  artist: string
  cover: string
  genre: Genre
  guestId: string
  greeting: string
  status: RequestStatus
  createdAt: number
  resolvedAt?: number
}

export interface Vote {
  requestId: string
  guestId: string
  createdAt: number
}

export interface DjSettings {
  accepting: boolean
  message: string
  allowedGenres: Genre[] // tom liste = alle genrer
}

export interface AppState {
  seededFor: string
  clubs: Record<string, Club>
  requests: SongRequest[]
  votes: Vote[]
  settings: Record<string, DjSettings>
}
