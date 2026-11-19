import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Cover, GenreBars, GenreTag, UpArrow } from '../../components/ui'
import { eventRequests, markPlayed, rankedQueue, rejectRequest, restoreRequest, settingsFor, updateSettings, useAppState } from '../../lib/store'
import { minutesAgo, useNow } from '../../lib/time'
import { GENRES, type Genre, type SongRequest } from '../../lib/types'

export default function DjQueue() {
  const { clubId = '' } = useParams()
  const state = useAppState()
  const now = useNow(5000)
  const queue = rankedQueue(state, clubId)
  const settings = settingsFor(state, clubId)
  const [undo, setUndo] = useState<SongRequest | null>(null)

  useEffect(() => {
    if (!undo) return
    const id = setTimeout(() => setUndo(null), 6000)
    return () => clearTimeout(id)
  }, [undo])

  // Stemningen i rummet: aftenens ønsker (ekskl. afviste) fordelt på genrer.
  const genreCounts: Record<string, number> = {}
  for (const r of eventRequests(state, clubId)) if (r.status !== 'rejected') genreCounts[r.genre] = (genreCounts[r.genre] ?? 0) + 1

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Ønsker lige nu</h1>
          <p className="text-sm text-muted">Sorteret efter stemmer · {queue.length} aktive</p>
        </div>

        {queue.length === 0 ? (
          <Card className="py-16 text-center text-muted">Ingen ønsker i køen lige nu.</Card>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card">
            <table className="w-full text-left">
              <thead className="text-xs tracking-wide text-muted uppercase">
                <tr className="border-b border-line">
                  <th className="w-12 py-3 pl-4">#</th>
                  <th className="py-3">Sang</th>
                  <th className="hidden py-3 md:table-cell">Genre</th>
                  <th className="py-3">Stemmer</th>
                  <th className="hidden py-3 xl:table-cell">Ønsket</th>
                  <th className="py-3 pr-4 text-right">Handling</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id} className={`border-b border-line/60 last:border-0 ${now - r.createdAt < 15000 ? 'animate-flash' : ''}`}>
                    <td className="py-3 pl-4 text-lg font-bold text-muted tabular-nums">{r.rank}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Cover src={r.cover} title={r.title} size="size-11" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{r.title}</p>
                          <p className="truncate text-sm text-muted">{r.artist}</p>
                          {r.greeting && <p className="mt-0.5 truncate text-sm text-lime/90">💬 “{r.greeting}”</p>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-3 md:table-cell">
                      <GenreTag genre={r.genre} />
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1 text-lg font-bold text-lime tabular-nums">
                        <UpArrow /> {r.votes}
                      </span>
                    </td>
                    <td className="hidden py-3 text-sm text-muted xl:table-cell">{minutesAgo(r.createdAt, now)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => markPlayed(r.id)}
                          className="h-10 rounded-xl bg-lime px-4 text-sm font-bold text-bg transition hover:brightness-110 active:scale-95"
                        >
                          Spillet ✓
                        </button>
                        <button
                          onClick={() => {
                            rejectRequest(r.id)
                            setUndo(r)
                          }}
                          className="h-10 rounded-xl border border-line px-4 text-sm font-semibold text-muted transition hover:border-danger hover:text-danger active:scale-95"
                        >
                          Afvis
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <Card>
          <h2 className="font-bold">Stemningen i rummet</h2>
          <p className="mb-4 text-xs text-muted">Andel af aftenens ønsker pr. genre</p>
          <GenreBars counts={genreCounts} />
        </Card>

        <Card>
          <h2 className="font-bold">Tag imod ønsker inden for</h2>
          <p className="mb-3 text-xs text-muted">Ingen valgt = alle genrer</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.filter((g) => g !== 'Andet').map((g) => {
              const on = settings.allowedGenres.includes(g)
              return (
                <button
                  key={g}
                  aria-pressed={on}
                  onClick={() => {
                    const next: Genre[] = on ? settings.allowedGenres.filter((x) => x !== g) : [...settings.allowedGenres, g]
                    updateSettings(clubId, { allowedGenres: next })
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    on ? 'border-lime bg-lime-dim text-lime' : 'border-line text-muted hover:text-white'
                  }`}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </Card>

        <GuestMessage clubId={clubId} saved={settings.message} />
      </aside>

      {undo && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-pop-in items-center gap-4 rounded-2xl border border-line bg-card-2 px-5 py-3 shadow-2xl shadow-black/60">
          <span className="text-sm">
            Afvist: <span className="font-semibold">{undo.title}</span>
          </span>
          <button
            onClick={() => {
              restoreRequest(undo.id)
              setUndo(null)
            }}
            className="text-sm font-bold text-lime"
          >
            Fortryd
          </button>
        </div>
      )}
    </div>
  )
}

function GuestMessage({ clubId, saved }: { clubId: string; saved: string }) {
  const [draft, setDraft] = useState(saved)
  const dirty = draft.trim() !== saved

  return (
    <Card>
      <h2 className="font-bold">Besked til gæsterne</h2>
      <p className="mb-3 text-xs text-muted">Vises på gæsternes skærm</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={120}
        rows={3}
        placeholder="Fx “Kun house og disco efter kl. 01 – tak!”"
        className="w-full resize-none rounded-xl border border-line bg-card-2 p-3 text-sm outline-none focus:border-lime"
      />
      <div className="mt-2 flex gap-2">
        <button
          disabled={!dirty}
          onClick={() => updateSettings(clubId, { message: draft.trim() })}
          className="h-10 flex-1 rounded-xl bg-lime text-sm font-bold text-bg disabled:bg-card-2 disabled:text-muted"
        >
          {dirty ? 'Send besked' : saved ? 'Vises nu ✓' : 'Send besked'}
        </button>
        {saved && (
          <button
            onClick={() => {
              setDraft('')
              updateSettings(clubId, { message: '' })
            }}
            className="h-10 rounded-xl border border-line px-3 text-sm text-muted hover:text-white"
          >
            Fjern
          </button>
        )}
      </div>
    </Card>
  )
}
