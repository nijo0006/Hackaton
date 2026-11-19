import { formatCountdown } from '../../lib/time'
import type { DjSettings } from '../../lib/types'

/** Pause-banner, DJ'ens besked og nedtælling til næste ønske – delt mellem gæstesiderne. */
export function DjNotice({ settings }: { settings: DjSettings }) {
  if (!settings.accepting) {
    return (
      <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4">
        <p className="font-bold text-amber-300">⏸ DJ'en har sat ønsker på pause</p>
        {settings.message && <p className="mt-1 text-sm">“{settings.message}”</p>}
        <p className="mt-1 text-sm text-muted">Du kan stadig stemme på ønskerne i køen.</p>
      </div>
    )
  }
  if (settings.message || settings.allowedGenres.length > 0) {
    return (
      <div className="rounded-2xl border border-lime/30 bg-lime-dim p-4">
        <p className="text-xs font-semibold tracking-wide text-lime uppercase">Besked fra DJ'en</p>
        {settings.message && <p className="mt-1">“{settings.message}”</p>}
        {settings.allowedGenres.length > 0 && (
          <p className="mt-1 text-sm text-muted">Tager imod: {settings.allowedGenres.join(', ')}</p>
        )}
      </div>
    )
  }
  return null
}

export function CooldownNotice({ msLeft }: { msLeft: number }) {
  if (msLeft <= 0) return null
  return (
    <p className="rounded-xl bg-card px-4 py-3 text-center text-sm text-muted">
      Du kan ønske igen om <span className="font-bold text-white tabular-nums">{formatCountdown(msLeft)}</span> – men du kan altid stemme.
    </p>
  )
}
