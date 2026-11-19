import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { Logo } from '../../components/ui'
import { isDjLoggedIn, setDjLoggedIn } from '../../lib/session'
import { settingsFor, updateSettings, useAppState } from '../../lib/store'
import NotFound from '../NotFound'

export default function DjLayout() {
  const { clubId = '' } = useParams()
  const state = useAppState()
  const [loggedIn, setLoggedIn] = useState(() => isDjLoggedIn(clubId))
  const club = state.clubs[clubId]

  if (!club) return <NotFound />
  if (!loggedIn) return <DjLogin clubId={clubId} onLogin={() => setLoggedIn(true)} />

  const settings = settingsFor(state, clubId)
  const tab = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-card-2 text-white' : 'text-muted hover:text-white'}`

  return (
    <div className="min-h-dvh px-6 py-4">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-4">
        <Logo suffix="DJ" to={`/dj/${clubId}`} />
        <nav className="flex gap-1">
          <NavLink to={`/dj/${clubId}`} end className={tab}>
            Ønsker
          </NavLink>
          <NavLink to={`/dj/${clubId}/recap`} className={tab}>
            Recap
          </NavLink>
        </nav>
        <p className="ml-auto text-sm text-muted">
          {club.name} · <span className="text-white">{club.djName}</span>
        </p>
        <button
          onClick={() => updateSettings(clubId, { accepting: !settings.accepting })}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
            settings.accepting ? 'bg-lime text-bg' : 'border border-amber-300/60 text-amber-300'
          }`}
          aria-pressed={settings.accepting}
        >
          <span className={`size-2 rounded-full ${settings.accepting ? 'bg-bg' : 'bg-amber-300'}`} />
          {settings.accepting ? 'Modtager ønsker' : 'Ønsker på pause'}
        </button>
        <button
          onClick={() => {
            setDjLoggedIn(null)
            setLoggedIn(false)
          }}
          className="text-sm text-muted hover:text-white"
        >
          Log ud
        </button>
      </header>
      <Outlet />
    </div>
  )
}

function DjLogin({ clubId, onLogin }: { clubId: string; onLogin: () => void }) {
  const state = useAppState()
  const club = state.clubs[clubId]
  const [user, setUser] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (user.trim().toLowerCase() === club.djUser && pin === club.djPin) {
      setDjLoggedIn(clubId)
      onLogin()
    } else setError(true)
  }

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-8">
        <Logo suffix="DJ" />
        <div>
          <h1 className="text-2xl font-bold">Log ind som DJ</h1>
          <p className="text-sm text-muted">{club.name}</p>
        </div>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Brugernavn"
          autoFocus
          autoComplete="username"
          className="h-12 w-full rounded-xl border border-line bg-card-2 px-4 outline-none focus:border-lime"
        />
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Kode"
          type="password"
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-line bg-card-2 px-4 outline-none focus:border-lime"
        />
        {error && <p className="text-sm text-danger">Forkert brugernavn eller kode.</p>}
        <button className="h-12 w-full rounded-xl bg-lime font-bold text-bg">Log ind</button>
        <p className="text-center text-xs text-muted">
          Demo: <span className="text-white">{club.djUser}</span> / <span className="text-white">{club.djPin}</span>
        </p>
      </form>
    </div>
  )
}
