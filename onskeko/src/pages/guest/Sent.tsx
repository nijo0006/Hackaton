import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckIcon, Cover, Logo } from '../../components/ui'
import { shareOrigin } from '../../lib/links'
import { rankedQueue, useAppState, voteCount } from '../../lib/store'

export default function Sent() {
  const { clubId = '', requestId = '' } = useParams()
  const state = useAppState()
  const [shared, setShared] = useState(false)
  const request = state.requests.find((r) => r.id === requestId)
  const ranked = rankedQueue(state, clubId).find((r) => r.id === requestId)

  if (!request) {
    return (
      <p className="mt-20 text-center text-muted">
        Ønsket blev ikke fundet. <Link to={`/club/${clubId}`} className="text-lime underline">Tilbage</Link>
      </p>
    )
  }

  async function share() {
    const url = `${shareOrigin}/club/${clubId}`
    const text = `Stem på “${request!.title}” på ønskekø 🎶`
    try {
      if (navigator.share) await navigator.share({ title: 'ønskekø', text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        setShared(true)
      }
    } catch {
      // Brugeren lukkede delingsdialogen.
    }
  }

  const statusText =
    request.status === 'played' ? 'Spilles nu 🎉' : request.status === 'rejected' ? 'Ikke i aften' : null

  return (
    <div className="flex min-h-[calc(100dvh-1rem)] flex-col pb-6">
      <header>
        <Logo to={`/club/${clubId}`} />
      </header>

      <div className="mt-10 flex flex-col items-center text-center">
        <div className="grid size-20 animate-pop-in place-items-center rounded-full bg-lime text-bg">
          <CheckIcon className="size-10" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Dit ønske er sendt</h1>
        <p className="mt-2 max-w-xs text-muted">DJ'en ser det på sin skærm. Du behøver ikke gå op til pulten.</p>
      </div>

      <div className="mt-8 rounded-2xl bg-card p-4">
        <div className="flex items-center gap-3">
          <Cover src={request.cover} title={request.title} size="size-14" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{request.title}</p>
            <p className="truncate text-muted">{request.artist}</p>
          </div>
        </div>
        {request.greeting && <p className="mt-3 rounded-xl bg-card-2 px-3 py-2 text-sm">“{request.greeting}”</p>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card-2 p-3">
            <p className="text-xs text-muted">Plads i køen</p>
            <p className="text-3xl font-extrabold text-lime tabular-nums">{statusText ? '–' : `#${ranked?.rank ?? '–'}`}</p>
          </div>
          <div className="rounded-xl bg-card-2 p-3">
            <p className="text-xs text-muted">Stemmer</p>
            <p className="text-3xl font-extrabold tabular-nums">{voteCount(state, request.id)}</p>
          </div>
        </div>
        {statusText && <p className="mt-3 text-center font-semibold">{statusText}</p>}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Jo flere der stemmer dit ønske op, jo højere kommer det på DJ'ens liste. Vi giver besked, når sangen bliver spillet.
      </p>

      <div className="mt-auto space-y-3 pt-8">
        <Link to={`/club/${clubId}`} className="flex h-14 items-center justify-center rounded-2xl bg-lime text-lg font-bold text-bg">
          Se alle ønsker
        </Link>
        <button onClick={share} className="h-12 w-full rounded-2xl font-semibold">
          {shared ? 'Link kopieret ✓' : 'Del med dine venner, så de kan stemme'}
        </button>
      </div>
    </div>
  )
}
