import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Cover, UpArrow, CheckIcon } from '../../components/ui'
import { getGuestId } from '../../lib/session'
import { LOCAL_SONGS, searchSongs } from '../../lib/songs'
import { GREETING_MAX, cooldownUntil, hasVoted, requestSong, settingsFor, songAvailability, useAppState, vote } from '../../lib/store'
import { minutesAgo, useNow } from '../../lib/time'
import type { Song } from '../../lib/types'
import { CooldownNotice, DjNotice } from './GuestStatus'

const SUGGESTIONS = LOCAL_SONGS.slice(0, 15)

export default function Search() {
  const { clubId = '' } = useParams()
  const navigate = useNavigate()
  const state = useAppState()
  const now = useNow()
  const guestId = getGuestId()
  const settings = settingsFor(state, clubId)
  const msLeft = cooldownUntil(state, clubId, guestId) - now
  const canRequest = settings.accepting && msLeft <= 0

  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Song[] | null>(null)
  const [source, setSource] = useState<'itunes' | 'local'>('itunes')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Song | null>(null)
  const [greeting, setGreeting] = useState('')
  const [error, setError] = useState('')

  // Debounce 300 ms, og afbryd gamle søgninger, når der tastes videre.
  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) return
    const ctrl = new AbortController()
    const id = setTimeout(() => {
      searchSongs(q, ctrl.signal)
        .then((r) => {
          setResults(r.songs)
          setSource(r.source)
          setLoading(false)
        })
        .catch(() => {})
    }, 300)
    return () => {
      clearTimeout(id)
      ctrl.abort()
    }
  }, [term])

  function send() {
    if (!selected) return
    const res = requestSong(clubId, selected, guestId, greeting)
    if (res.ok) navigate(`/club/${clubId}/sent/${res.requestId}`)
    else setError(res.error)
  }

  const shown = term.trim().length >= 2 ? results : null
  const list = shown ?? SUGGESTIONS

  return (
    <div className={selected ? 'pb-72' : 'pb-8'}>
      <header className="flex items-center gap-3">
        <Link to={`/club/${clubId}`} className="grid size-10 place-items-center rounded-xl bg-card text-xl" aria-label="Tilbage">
          ‹
        </Link>
        <h1 className="text-xl font-bold">Ønsk en sang</h1>
      </header>

      <label className="mt-6 block text-xs text-muted" htmlFor="search">
        Søg
      </label>
      <div className="mt-1 flex h-14 items-center gap-3 rounded-2xl border-2 border-lime bg-card px-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5 text-muted" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id="search"
          autoFocus
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setLoading(e.target.value.trim().length >= 2)
          }}
          placeholder="Sang eller kunstner"
          className="h-full flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
          autoComplete="off"
        />
        {term && (
          <button
            onClick={() => {
              setTerm('')
              setLoading(false)
            }}
            className="text-muted"
            aria-label="Ryd søgning"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <DjNotice settings={settings} />
        <CooldownNotice msLeft={settings.accepting ? msLeft : 0} />
      </div>

      <div className="mt-6 mb-2 flex items-baseline justify-between text-xs text-muted">
        <span>{shown ? 'Resultater' : 'Forslag'}</span>
        {loading && <span>Søger …</span>}
        {!loading && shown && source === 'local' && <span>Offline-katalog</span>}
      </div>

      {!loading && shown?.length === 0 && <p className="rounded-2xl bg-card p-6 text-center text-muted">Ingen sange fundet for “{term}”.</p>}

      <ul className="space-y-2">
        {list.map((song) => {
          const a = songAvailability(state, clubId, song, now)
          const disabled = a.kind === 'played' || a.kind === 'rejected' || a.kind === 'genre-blocked'
          const isSelected = selected?.id === song.id
          return (
            <li
              key={song.id}
              className={`flex items-center gap-3 rounded-2xl p-3 transition ${isSelected ? 'bg-card ring-2 ring-lime' : 'bg-card'} ${disabled ? 'opacity-45' : ''}`}
            >
              <Cover src={song.cover} title={song.title} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{song.title}</p>
                {a.kind === 'requested' ? (
                  <p className="truncate text-sm text-lime">
                    Allerede ønsket · {a.votes} {a.votes === 1 ? 'stemme' : 'stemmer'}
                  </p>
                ) : a.kind === 'played' ? (
                  <p className="truncate text-sm text-muted">Spillet {minutesAgo(a.playedAt, now) === 'lige nu' ? 'lige nu' : `for ${minutesAgo(a.playedAt, now)}`}</p>
                ) : a.kind === 'rejected' ? (
                  <p className="truncate text-sm text-muted">DJ'en spiller ikke denne i aften</p>
                ) : a.kind === 'genre-blocked' ? (
                  <p className="truncate text-sm text-muted">DJ'en tager ikke imod {song.genre} lige nu</p>
                ) : (
                  <p className="truncate text-sm text-muted">
                    {song.artist} · {song.genre}
                  </p>
                )}
              </div>
              {a.kind === 'requested' ? (
                hasVoted(state, a.request.id, guestId) ? (
                  <span className="flex h-10 items-center gap-1 rounded-xl border border-lime/40 bg-lime-dim px-3 text-sm font-bold text-lime">
                    <CheckIcon /> Stemt
                  </span>
                ) : (
                  <button
                    onClick={() => vote(a.request.id, guestId)}
                    className="flex h-10 items-center gap-1 rounded-xl border border-lime px-3 text-sm font-bold text-lime active:scale-95"
                  >
                    <UpArrow /> Stem op
                  </button>
                )
              ) : (
                !disabled && (
                  <button
                    disabled={!canRequest}
                    onClick={() => {
                      setSelected(isSelected ? null : song)
                      setError('')
                    }}
                    className="h-10 rounded-xl bg-lime px-4 text-sm font-bold text-bg transition active:scale-95 disabled:bg-card-2 disabled:text-muted"
                  >
                    {isSelected ? 'Valgt' : 'Ønsk'}
                  </button>
                )
              )}
            </li>
          )
        })}
      </ul>

      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-pop-in border-t border-line bg-bg/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center gap-3">
              <Cover src={selected.cover} title={selected.title} size="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{selected.title}</p>
                <p className="truncate text-sm text-muted">{selected.artist}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-muted" aria-label="Fortryd">
                ✕
              </button>
            </div>
            <div>
              <label htmlFor="greeting" className="flex justify-between text-xs text-muted">
                <span>Hilsen til DJ'en (valgfri)</span>
                <span className="tabular-nums">
                  {greeting.length}/{GREETING_MAX}
                </span>
              </label>
              <input
                id="greeting"
                value={greeting}
                maxLength={GREETING_MAX}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Fx “Det er min fødselsdag!”"
                className="mt-1 h-12 w-full rounded-xl border border-line bg-card px-4 outline-none placeholder:text-muted focus:border-lime"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              onClick={send}
              disabled={!canRequest}
              className="h-14 w-full rounded-2xl bg-lime text-lg font-bold text-bg transition active:scale-[0.98] disabled:opacity-40"
            >
              Send ønske
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
