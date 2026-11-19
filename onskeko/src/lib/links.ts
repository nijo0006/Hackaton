declare const __LAN_HOST__: string

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

/**
 * Adressen andre enheder kan bruge. Åbnes appen via localhost, skiftes der til
 * computerens netværksadresse (kræver `npm run dev:host`), så links og QR-kode virker på andre enheder.
 */
const origin = isLocalhost && __LAN_HOST__ ? `${window.location.protocol}//${__LAN_HOST__}:${window.location.port}` : window.location.origin

/** Inkl. base-stien, fx "https://nijo0006.github.io/Hackaton" på GitHub Pages. */
export const shareOrigin = origin + import.meta.env.BASE_URL.replace(/\/$/, '')
