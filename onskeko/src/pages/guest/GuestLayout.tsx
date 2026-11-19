import { useCallback, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Toast } from '../../components/ui'
import { getGuestId, getSeenNotifications, markNotificationSeen } from '../../lib/session'
import { eventRequests, useAppState } from '../../lib/store'
import NotFound from '../NotFound'

/** Fælles ramme for gæstesiderne: mobilbredde + besked når gæstens ønske er spillet/afvist. */
export default function GuestLayout() {
  const { clubId = '' } = useParams()
  const state = useAppState()
  const guestId = getGuestId()
  const [seen, setSeen] = useState(getSeenNotifications)

  const pending = eventRequests(state, clubId).find((r) => r.guestId === guestId && r.status !== 'active' && !seen.includes(r.id))
  const dismiss = useCallback(() => {
    if (!pending) return
    markNotificationSeen(pending.id)
    setSeen((s) => [...s, pending.id])
  }, [pending])

  if (!state.clubs[clubId]) return <NotFound />

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-4">
      {pending && (
        <Toast key={pending.id} onClose={dismiss} tone={pending.status === 'played' ? 'lime' : 'neutral'}>
          {pending.status === 'played' ? (
            <>
              <p className="font-bold text-lime">🎉 Dit ønske bliver spillet nu!</p>
              <p className="mt-0.5">
                {pending.title} – {pending.artist}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold">DJ'en har valgt ikke at spille dit ønske i aften – prøv et andet!</p>
              <p className="mt-0.5 text-muted">
                {pending.title} – {pending.artist}. Du kan ønske en ny sang med det samme.
              </p>
            </>
          )}
        </Toast>
      )}
      <Outlet />
    </div>
  )
}
