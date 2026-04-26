import type { Period } from './database.types'

export type ScopedPeriod = Period & { group_ids: string[] }

export function pickActivePeriodForUser(
  periods: ScopedPeriod[],
  userGroupIds: string[],
): ScopedPeriod | null {
  const userSet = new Set(userGroupIds)

  const matches = periods.filter(p => {
    if (!p.is_active) return false
    if (p.group_ids.length === 0) return true
    return p.group_ids.some(g => userSet.has(g))
  })

  if (matches.length === 0) return null

  matches.sort((a, b) => {
    const aScoped = a.group_ids.length > 0 ? 1 : 0
    const bScoped = b.group_ids.length > 0 ? 1 : 0
    if (aScoped !== bScoped) return bScoped - aScoped
    return b.started_at.localeCompare(a.started_at)
  })

  return matches[0]
}

export function scopesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every(id => setA.has(id))
}
