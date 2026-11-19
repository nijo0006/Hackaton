import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Cover, GenreTag } from '../../components/ui'
import { eventRequests, restoreRequest, useAppState, voteCount } from '../../lib/store'
import { formatClock } from '../../lib/time'
import type { SongRequest } from '../../lib/types'

export default function DjRecap() {
  const { clubId = '' } = useParams()
  const state = useAppState()
  const tonight = eventRequests(state, clubId)
  const byResolved = (a: SongRequest, b: SongRequest) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0)
  const played = tonight.filter((r) => r.status === 'played').sort(byResolved)
  const rejected = tonight.filter((r) => r.status === 'rejected').sort(byResolved)
  const active = tonight.filter((r) => r.status === 'active')
  const votesOf = (r: SongRequest) => voteCount(state, r.id)
  const totalVotes = tonight.reduce((n, r) => n + voteCount(state, r.id), 0)

  const stats = [
    ['Spillet', played.length],
    ['Afvist', rejected.length],
    ['I køen', active.length],
    ['Stemmer i alt', totalVotes],
  ] as const

  return (
    <div className="mt-6 space-y-6">
      <h1 className="text-2xl font-bold">Aftenens recap</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="text-4xl font-extrabold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecapList title="Spillet" items={played} votesOf={votesOf} empty="Ingen sange spillet endnu." />
        <RecapList
          title="Afvist"
          items={rejected}
          votesOf={votesOf}
          empty="Ingen afviste ønsker."
          note="Afviste sange kan ikke ønskes igen i aften."
          action={(r) => (
            <button onClick={() => restoreRequest(r.id)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-white">
              Fortryd
            </button>
          )}
        />
      </div>
    </div>
  )
}

interface RecapListProps {
  title: string
  items: SongRequest[]
  votesOf: (r: SongRequest) => number
  empty: string
  note?: string
  action?: (r: SongRequest) => ReactNode
}

function RecapList({ title, items, votesOf, empty, note, action }: RecapListProps) {
  return (
    <Card>
      <h2 className="font-bold">
        {title} <span className="text-muted">({items.length})</span>
      </h2>
      {note && <p className="text-xs text-muted">{note}</p>}
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line/60">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className="w-12 text-sm text-muted tabular-nums">{r.resolvedAt ? formatClock(r.resolvedAt) : ''}</span>
              <Cover src={r.cover} title={r.title} size="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.title}</p>
                <p className="truncate text-sm text-muted">{r.artist}</p>
              </div>
              <GenreTag genre={r.genre} />
              <span className="w-10 text-right text-sm font-bold text-lime tabular-nums">↑{votesOf(r)}</span>
              {action?.(r)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
