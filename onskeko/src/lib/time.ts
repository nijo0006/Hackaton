import { useEffect, useState } from 'react'

export const MINUTE = 60_000

/** En klubaften løber over midnat, så før kl. 08 hører man til gårsdagens aften. */
export function eventIdFor(ts: number): string {
  const d = new Date(ts - 8 * 60 * MINUTE)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function currentEventId(): string {
  return eventIdFor(Date.now())
}

export function formatEventDate(eventId: string): string {
  const [y, m, d] = eventId.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

export function minutesAgo(ts: number, now: number): string {
  const min = Math.max(0, Math.round((now - ts) / MINUTE))
  if (min < 1) return 'lige nu'
  if (min < 60) return `${min} min. siden`
  const h = Math.floor(min / 60)
  return `${h} t. ${min % 60} min. siden`
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Re-render med jævne mellemrum (til nedtællinger og "x min. siden"). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
