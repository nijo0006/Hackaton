import type { Genre } from './types'

/** Mapper iTunes' primaryGenreName til vores simple kategorier. */
export function mapGenre(raw: string | undefined): Genre {
  const g = (raw ?? '').toLowerCase()
  if (g.includes('house')) return 'House'
  if (g.includes('techno') || g.includes('trance')) return 'Techno'
  if (g.includes('disco') || g.includes('funk') || g.includes('soul') || g.includes('r&b')) return 'Disco'
  if (g.includes('hip') || g.includes('rap')) return 'Hip hop'
  if (g.includes('dance') || g.includes('electronic')) return 'House'
  if (g.includes('rock') || g.includes('alternative') || g.includes('metal') || g.includes('punk')) return 'Rock'
  if (g.includes('pop')) return 'Pop'
  return 'Andet'
}
