/** Anonym gæste-id og DJ-"login" – kun gemt i browseren (prototype, ingen rigtig auth). */

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ignorer
  }
}

let memoryGuestId: string | null = null

export function getGuestId(): string {
  const stored = safeGet('onskeko:guestId')
  if (stored) return stored
  // Ikke crypto.randomUUID(): den findes kun på https/localhost, og telefoner åbner via http://<ip>.
  memoryGuestId ??= `guest-${Math.random().toString(36).slice(2, 10)}`
  safeSet('onskeko:guestId', memoryGuestId)
  return memoryGuestId
}

const seenKey = () => `onskeko:seen:${getGuestId()}`

export function getSeenNotifications(): string[] {
  try {
    return JSON.parse(safeGet(seenKey()) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function markNotificationSeen(requestId: string) {
  safeSet(seenKey(), JSON.stringify([...getSeenNotifications(), requestId]))
}

export function isDjLoggedIn(clubId: string): boolean {
  return safeGet('onskeko:dj') === clubId
}

export function setDjLoggedIn(clubId: string | null) {
  safeSet('onskeko:dj', clubId)
}
