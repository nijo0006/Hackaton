import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Genre } from '../lib/types'

export function NoteIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M9 18.5a3 3 0 1 1-2-2.83V5.5l12-2.5v12.5a3 3 0 1 1-2-2.83V7.3L9 8.97z" />
    </svg>
  )
}

export function Logo({ suffix, to = '/' }: { suffix?: string; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-lime text-bg">
        <NoteIcon />
      </span>
      <span>ønskekø</span>
      {suffix && <span className="font-medium text-muted">· {suffix}</span>}
    </Link>
  )
}

export function LiveBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-lime">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-lime" />
      </span>
      Live
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-300">
      <span className="size-2 rounded-full bg-amber-300" />
      Pause
    </span>
  )
}

const GRADIENTS = [
  'from-fuchsia-500 to-indigo-600',
  'from-amber-400 to-rose-600',
  'from-emerald-400 to-cyan-600',
  'from-sky-400 to-violet-600',
  'from-lime-300 to-emerald-600',
  'from-orange-400 to-pink-600',
]

/** Albumcover, med farvet placeholder hvis der ikke er et billede. */
export function Cover({ src, title, size = 'size-12' }: { src: string; title: string; size?: string }) {
  if (src) return <img src={src} alt="" loading="lazy" className={`${size} shrink-0 rounded-lg bg-card-2 object-cover`} />
  const hash = [...title].reduce((h, c) => h + c.charCodeAt(0), 0)
  return (
    <div className={`${size} grid shrink-0 place-items-center rounded-lg bg-gradient-to-br text-sm font-bold ${GRADIENTS[hash % GRADIENTS.length]}`}>
      {title.slice(0, 1)}
    </div>
  )
}

export function UpArrow({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

export function CheckIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function GenreTag({ genre }: { genre: Genre }) {
  return <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{genre}</span>
}

/** Vandrette bjælker med procent, fx "Stemningen i rummet". */
export function GenreBars({ counts, emptyText = 'Ingen ønsker endnu' }: { counts: Record<string, number>; emptyText?: string }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const rows = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
  if (total === 0) return <p className="text-sm text-muted">{emptyText}</p>
  return (
    <ul className="space-y-3">
      {rows.map(([genre, n]) => {
        const pct = Math.round((n / total) * 100)
        return (
          <li key={genre} title={`${genre}: ${n} ønsker (${pct} %)`}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{genre}</span>
              <span className="tabular-nums text-muted">{pct} %</span>
            </div>
            <div className="h-2 rounded-full bg-card-2">
              <div className="h-2 rounded-full bg-lime transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card p-4 ${className}`}>{children}</div>
}

export function Toast({ children, onClose, tone = 'lime' }: { children: ReactNode; onClose: () => void; tone?: 'lime' | 'neutral' }) {
  useEffect(() => {
    const id = setTimeout(onClose, 7000)
    return () => clearTimeout(id)
  }, [onClose])
  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md animate-pop-in">
      <div
        role="status"
        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl shadow-black/60 ${
          tone === 'lime' ? 'border-lime/40 bg-[#1f2410]' : 'border-line bg-card-2'
        }`}
      >
        <div className="flex-1 text-sm leading-snug">{children}</div>
        <button onClick={onClose} className="-m-1 p-1 text-muted hover:text-white" aria-label="Luk">
          ✕
        </button>
      </div>
    </div>
  )
}
