import { Link, useParams } from 'react-router-dom'
import { Cover, LiveBadge, Logo, VoteButton } from '../../components/ui'
import { getGuestId } from '../../lib/session'
import { cooldownUntil, hasVoted, rankedQueue, settingsFor, useAppState, vote } from '../../lib/store'
import { useNow } from '../../lib/time'
import { CooldownNotice, DjNotice } from './GuestStatus'

export default function GuestHome() {
  const { clubId = '' } = useParams()
  const state = useAppState()
  const now = useNow()
  const guestId = getGuestId()
  const club = state.clubs[clubId]
  const settings = settingsFor(state, clubId)
  const queue = rankedQueue(state, clubId)
  const mine = queue.filter((r) => r.guestId === guestId)
  const msLeft = cooldownUntil(state, clubId, guestId) - now

  return (
    <>
      <header className="flex items-center justify-between">
        <Logo to={`/club/${clubId}`} />
        <LiveBadge live={settings.accepting} />
      </header>

      <section className="mt-8">
        <p className="text-sm text-muted">Du er på</p>
        <h1 className="text-4xl font-extrabold tracking-tight">{club.name}</h1>
        <p className="mt-1 text-sm text-muted">
          DJ i aften: <span className="font-semibold text-white">{club.djName}</span>
        </p>
      </section>

      <Link
        to="search"
        className="mt-6 flex h-14 items-center gap-3 rounded-2xl border border-line bg-card px-4 text-muted transition hover:border-lime/50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        Søg efter sang eller kunstner
      </Link>

      <div className="mt-4 space-y-3">
        <DjNotice settings={settings} />
        {mine.map((r) => (
          <Link key={r.id} to={`sent/${r.id}`} className="flex items-center gap-3 rounded-2xl border border-lime/30 bg-card p-3">
            <Cover src={r.cover} title={r.title} size="size-10" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-lime">Dit ønske</p>
              <p className="truncate font-semibold">{r.title}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Plads</p>
              <p className="text-xl font-extrabold text-lime tabular-nums">#{r.rank}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-6 flex-1 pb-48">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">Populære ønsker lige nu</h2>
          <span className="text-xs text-muted">Stem op ↑</span>
        </div>
        {queue.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted">Ingen ønsker endnu – vær den første!</p>
        ) : (
          <ol className="space-y-2">
            {queue.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                <span className="w-5 text-center text-sm font-bold text-muted tabular-nums">{r.rank}</span>
                <Cover src={r.cover} title={r.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="truncate text-sm text-muted">{r.artist}</p>
                </div>
                <VoteButton votes={r.votes} voted={hasVoted(state, r.id, guestId)} onVote={() => vote(r.id, guestId)} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="fixed inset-x-0 bottom-0">
        <div className="h-8 bg-gradient-to-t from-bg to-transparent" />
        <div className="mx-auto max-w-md space-y-3 bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <CooldownNotice msLeft={msLeft} />
          <p className="text-center text-xs text-muted">Ingen app – det kører i browseren. Maks. 1 ønske pr. 15 min.</p>
          <Link
            to="search"
            className="flex h-14 items-center justify-center rounded-2xl bg-lime text-lg font-bold text-bg transition active:scale-[0.98]"
          >
            {settings.accepting ? 'Ønsk en sang' : 'Søg og stem'}
          </Link>
        </div>
      </footer>
    </>
  )
}
