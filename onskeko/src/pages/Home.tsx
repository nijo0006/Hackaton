import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/ui'
import { DEMO_CLUB_ID } from '../lib/seed'
import { isSimulating, onSimulatingChange, setSimulating } from '../lib/simulator'
import { shareOrigin } from '../lib/links'
import { backend, rankedQueue, resetDemo, useAppState } from '../lib/store'

const VIEWS = [
  { n: 1, title: 'Gæsten', to: `/club/${DEMO_CLUB_ID}`, text: 'Scanner QR-koden, søger og ønsker – eller stemmer andres ønsker op. Åbn på mobil eller i smal fane.' },
  { n: 2, title: "DJ'en", to: `/dj/${DEMO_CLUB_ID}`, text: 'Ser alle ønsker samlet og rangeret efter stemmer. Spiller det, der passer – og afviser resten. Login: mira / 1234' },
  { n: 3, title: 'Klubben', to: `/venue/${DEMO_CLUB_ID}`, text: 'Får indsigt i gæsternes musiksmag til bedre setlister og events. Henter QR-koden her.' },
]

export default function Home() {
  const state = useAppState()
  const [simulating, setSim] = useState(isSimulating)
  useEffect(() => onSimulatingChange(setSim), [])
  const queue = rankedQueue(state, DEMO_CLUB_ID)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <span className="text-xs text-muted">Prototype · hackathon 2026</span>
      </header>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Ønsk en sang –<br />
            uden at forstyrre <span className="text-lime">DJ'en.</span>
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Gæsterne ønsker sange fra telefonen i stedet for at stå bag pulten. DJ'en får ro og et samlet overblik – og klubben får data om, hvad publikum faktisk vil høre.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-card p-4 text-sm">
            <span className="text-danger">●</span>
            <p>
              <span className="font-semibold">Problemet i dag:</span> <span className="text-muted">gæster står bag skranken og afbryder DJ'en midt i mixet.</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {VIEWS.map((v) => (
            <Link key={v.n} to={v.to} className="group flex gap-4 rounded-2xl border border-line bg-card p-5 transition hover:border-lime">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime font-bold text-bg">{v.n}</span>
              <div>
                <p className="font-bold group-hover:text-lime">{v.title} →</p>
                <p className="mt-1 text-sm text-muted">{v.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <h2 className="font-bold">Demo-værktøjer</h2>
            <p className="text-sm text-muted">
              Club Nova · {queue.length} aktive ønsker ·{' '}
              {backend === 'supabase' ? (
                <span className="text-lime">Supabase: live på tværs af enheder</span>
              ) : (
                <span>Lokal data: live mellem faner i samme browser</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setSimulating(!simulating)}
            className={`h-11 rounded-xl px-5 font-bold transition ${simulating ? 'border border-lime text-lime' : 'bg-lime text-bg'}`}
          >
            {simulating ? '■ Stop simulering' : '▶ Simulér gæster'}
          </button>
          <button
            onClick={() => {
              if (confirm('Nulstil alle ønsker og stemmer til demo-data?')) resetDemo()
            }}
            className="h-11 rounded-xl border border-line px-5 font-semibold text-muted hover:text-white"
          >
            Nulstil demo
          </button>
        </div>
        {simulating && <p className="mt-3 text-xs text-lime">Simulerer gæster – hold denne fane åben. Nye ønsker og stemmer tilføjes hvert 2. sekund.</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-bold">Links til holdet</h2>
        <p className="text-sm text-muted">Virker på andre computere og telefoner på samme wifi, så længe denne computer kører appen.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {VIEWS.map((v) => {
            const url = `${shareOrigin}${v.to}`
            return (
              <li key={v.n} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-16 text-muted">{v.title}</span>
                <code className="rounded-lg bg-card-2 px-2 py-1 break-all text-lime">{url}</code>
                <CopyButton text={url} />
              </li>
            )
          })}
        </ul>
        {shareOrigin.includes('localhost') && (
          <p className="mt-3 text-xs text-amber-300">Start appen med <code>npm run dev:host</code> for at få links, andre kan åbne.</p>
        )}
      </section>

      <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-xs text-muted">
        <span className="font-semibold tracking-wide uppercase">Hvorfor klubben betaler</span>
        <span>✓ Gladere DJ – ingen afbrydelser</span>
        <span>✓ Indsigt i publikums smag</span>
        <span>✓ Bedre setlister næste gang</span>
      </footer>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => {})
      }}
      className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:text-white"
    >
      {copied ? 'Kopieret ✓' : 'Kopiér'}
    </button>
  )
}
