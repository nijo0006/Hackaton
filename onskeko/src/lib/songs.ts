import songsData from '../data/songs.json'
import { mapGenre } from './genres'
import type { Song } from './types'

/** Lokal fallback-liste, bruges hvis iTunes API'et fejler (fx ingen internet under demoen). */
export const LOCAL_SONGS = songsData as Song[]

/** Normaliseret nøgle, så samme sang matches på tværs af iTunes og den lokale liste. */
export function songKey(title: string, artist: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/\(.*?\)|\[.*?\]/g, '')
      .replace(/feat\..*$/, '')
      .replace(/[^a-z0-9æøå]+/g, '')
  return `${clean(title)}|${clean(artist.split(/,|&| x /i)[0])}`
}

export function findLocalSong(title: string, artist: string): Song | undefined {
  const key = songKey(title, artist)
  return LOCAL_SONGS.find((s) => songKey(s.title, s.artist) === key)
}

function searchLocal(term: string): Song[] {
  const t = term.toLowerCase().trim()
  return LOCAL_SONGS.filter(
    (s) => s.title.toLowerCase().includes(t) || s.artist.toLowerCase().includes(t) || s.genre.toLowerCase().includes(t),
  ).slice(0, 15)
}

interface ItunesTrack {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100?: string
  primaryGenreName?: string
}

export async function searchSongs(term: string, signal?: AbortSignal): Promise<{ songs: Song[]; source: 'itunes' | 'local' }> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&country=dk&limit=15`
  try {
    // Timeout på 4 sek. – lavet manuelt, da AbortSignal.any/timeout mangler i ældre Safari.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    signal?.addEventListener('abort', () => ctrl.abort())
    const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { results: ItunesTrack[] }
    const songs = json.results.map((t) => {
      // Brug vores egen genre, hvis sangen findes i den lokale liste (mere præcis end iTunes' "Dance"/"Pop").
      const local = findLocalSong(t.trackName, t.artistName)
      return {
        id: String(t.trackId),
        title: t.trackName,
        artist: t.artistName,
        cover: t.artworkUrl100?.replace('100x100bb', '300x300bb') ?? '',
        genre: local?.genre ?? mapGenre(t.primaryGenreName),
      }
    })
    return { songs, source: 'itunes' }
  } catch (err) {
    if (signal?.aborted) throw err
    return { songs: searchLocal(term), source: 'local' }
  }
}
