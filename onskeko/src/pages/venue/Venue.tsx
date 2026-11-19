import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Cover, GenreBars, Logo } from '../../components/ui'
import { shareOrigin } from '../../lib/links'
import { useAppState } from '../../lib/store'
import { MINUTE, currentEventId, formatEventDate } from '../../lib/time'
import type { SongRequest } from '../../lib/types'
import NotFound from '../NotFound'

const HOUR = 60 * MINUTE

export default function Venue() {
  const { clubId = '' } = useParams()
  const state = useAppState()
  const club = state.clubs[clubId]
  const tonight = currentEventId()
  const eventIds = [...new Set(state.requests.filter((r) => r.clubId === clubId).map((r) => r.eventId))].sort().reverse()
  const [eventId, setEventId] = useState(tonight)

  if (!club) return <NotFound />

  const requests = state.requests.filter((r) => r.clubId === clubId && r.eventId === eventId)
  const ids = new Set(requests.map((r) => r.id))
  const votes = state.votes.filter((v) => ids.has(v.requestId))
  const guests = new Set([...requests.map((r) => r.guestId), ...votes.map((v) => v.guestId)])
  const votesByRequest = new Map<string, number>()
  for (const v of votes) votesByRequest.set(v.requestId, (votesByRequest.get(v.requestId) ?? 0) + 1)

  const played = requests.filter((r) => r.status === 'played').length
  const rejected = requests.filter((r) => r.status === 'rejected').length
  const pct = (n: number) => (requests.length ? Math.round((n / requests.length) * 100) : 0)

  const genreCounts: Record<string, number> = {}
  for (const r of requests) genreCounts[r.genre] = (genreCounts[r.genre] ?? 0) + 1

  const top10 = [...requests].sort((a, b) => (votesByRequest.get(b.id) ?? 0) - (votesByRequest.get(a.id) ?? 0)).slice(0, 10)
  const guestUrl = `${shareOrigin}/club/${clubId}`

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="flex flex-wrap items-center gap-4 border-b border-line pb-4">
        <Logo suffix="Klub" />
        <p className="ml-auto text-sm text-muted">{club.name}</p>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="h-10 rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-lime"
          aria-label="Vælg aften"
        >
          {eventIds.map((id) => (
            <option key={id} value={id}>
              {id === tonight ? 'I aften (live)' : formatEventDate(id)}
            </option>
          ))}
        </select>
      </header>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight first-letter:uppercase">{eventId === tonight ? 'I aften' : formatEventDate(eventId)}</h1>
      <p className="text-muted">Indsigt i gæsternes musiksmag – til bedre setlister og DJ-bookinger.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Ønsker" value={requests.length} />
        <Stat label="Stemmer" value={votes.length} />
        <Stat label="Unikke gæster" value={guests.size} />
        <Stat label="Spillet" value={`${pct(played)} %`} sub={`${rejected} afvist (${pct(rejected)} %) · ${requests.length - played - rejected} ikke nået`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-bold">Ønsker over tid</h2>
          <p className="mb-4 text-xs text-muted">Antal nye ønsker pr. time</p>
          <HourChart requests={requests} />
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">Genrefordeling</h2>
          <GenreBars counts={genreCounts} />
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-bold">Top 10 mest ønskede</h2>
          {top10.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Ingen ønsker denne aften.</p>
          ) : (
            <ol className="grid gap-x-6 md:grid-cols-2">
              {top10.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3 border-b border-line/60 py-2.5">
                  <span className="w-5 text-sm font-bold text-muted tabular-nums">{i + 1}</span>
                  <Cover src={r.cover} title={r.title} size="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="truncate text-xs text-muted">
                      {r.artist} · {r.genre}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-lime tabular-nums">↑{votesByRequest.get(r.id) ?? 0}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="flex flex-col items-center text-center">
          <h2 className="font-bold">Klubbens QR-kode</h2>
          <p className="mb-4 text-xs text-muted">Sæt den på baren og bordene</p>
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG value={guestUrl} size={180} bgColor="#ffffff" fgColor="#0e0e10" />
          </div>
          <a href={guestUrl} target="_blank" rel="noreferrer" className="mt-3 text-sm break-all text-lime underline">
            {guestUrl}
          </a>
          {shareOrigin.includes('localhost') && (
            <p className="mt-3 text-xs text-amber-300">
              Peger på localhost og virker ikke fra en telefon. Start med <code>npm run dev:host</code>.
            </p>
          )}
          <button onClick={() => window.print()} className="mt-4 h-10 rounded-xl border border-line px-4 text-sm font-semibold hover:border-lime">
            Print
          </button>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-4xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  )
}

function HourChart({ requests }: { requests: SongRequest[] }) {
  if (requests.length === 0) return <p className="py-12 text-center text-sm text-muted">Ingen data endnu.</p>
  const first = Math.floor(Math.min(...requests.map((r) => r.createdAt)) / HOUR)
  const last = Math.floor(Math.max(...requests.map((r) => r.createdAt)) / HOUR)
  const buckets = Array.from({ length: last - first + 1 }, (_, i) => ({ hour: first + i, count: 0 }))
  for (const r of requests) buckets[Math.floor(r.createdAt / HOUR) - first].count++
  const max = Math.max(...buckets.map((b) => b.count))

  return (
    <div className="flex h-56 items-end gap-2 border-b border-line">
      {buckets.map((b) => {
        const label = `${String(new Date(b.hour * HOUR).getHours()).padStart(2, '0')}`
        return (
          <div key={b.hour} className="group relative flex h-full flex-1 flex-col justify-end" title={`Kl. ${label}: ${b.count} ønsker`}>
            <span className="mb-1 text-center text-xs font-semibold tabular-nums opacity-0 transition group-hover:opacity-100">{b.count}</span>
            <div
              className="mx-auto w-full max-w-14 rounded-t bg-lime transition-all duration-500 group-hover:brightness-110"
              style={{ height: `${(b.count / max) * 85}%`, minHeight: b.count ? 2 : 0 }}
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted tabular-nums">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
