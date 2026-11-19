/** "Simulér gæster": tilføjer løbende ønsker og stemmer, så live-opdateringen kan vises under demoen. */
import { DEMO_CLUB_ID } from './seed'
import { LOCAL_SONGS } from './songs'
import { getState, rankedQueue, requestSong, settingsFor, songAvailability, vote } from './store'

const GREETINGS = ['', '', '', 'Skru op! 🔊', 'Polterabend her 🥂', 'Til bord 7 ❤️', 'Den er til dig, Sofie!']

let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<(running: boolean) => void>()

function fakeGuest() {
  return `sim-${Math.random().toString(36).slice(2, 9)}`
}

function tick() {
  const s = getState()
  const queue = rankedQueue(s, DEMO_CLUB_ID)
  const accepting = settingsFor(s, DEMO_CLUB_ID).accepting

  if (accepting && (Math.random() < 0.3 || queue.length < 3)) {
    const candidates = LOCAL_SONGS.filter((song) => songAvailability(s, DEMO_CLUB_ID, song).kind === 'free')
    const song = candidates[Math.floor(Math.random() * candidates.length)]
    if (song) {
      requestSong(DEMO_CLUB_ID, song, fakeGuest(), GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
      return
    }
  }
  if (queue.length === 0) return
  // Populære sange får oftere flere stemmer.
  const target = queue[Math.floor(Math.pow(Math.random(), 1.5) * queue.length)]
  vote(target.id, fakeGuest())
}

export function isSimulating() {
  return timer !== null
}

export function setSimulating(on: boolean) {
  if (on && !timer) timer = setInterval(tick, 2000)
  if (!on && timer) {
    clearInterval(timer)
    timer = null
  }
  listeners.forEach((l) => l(on))
}

export function onSimulatingChange(l: (running: boolean) => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
