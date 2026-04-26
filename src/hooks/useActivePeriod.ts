import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMyGroups } from './useMyGroups'
import { pickActivePeriodForUser, type ScopedPeriod } from '../lib/period-resolver'
import type { Period } from '../lib/database.types'

interface PeriodRow extends Period {
  period_groups: { group_id: string }[] | null
}

export function useActivePeriod() {
  const { user } = useAuth()
  const { data: myGroups } = useMyGroups()

  const groupIds = (myGroups ?? []).map(g => g.id)
  const groupKey = [...groupIds].sort().join(',')

  return useQuery({
    queryKey: ['active-period', user?.id, groupKey],
    enabled: !!user && !!myGroups,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periods')
        .select('id, name, started_at, ended_at, is_active, created_by, period_groups(group_id)')
        .eq('is_active', true)
      if (error) throw error

      const rows = (data ?? []) as unknown as PeriodRow[]
      const periods: ScopedPeriod[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        started_at: row.started_at,
        ended_at: row.ended_at,
        is_active: row.is_active,
        created_by: row.created_by,
        group_ids: (row.period_groups ?? []).map(pg => pg.group_id),
      }))

      return pickActivePeriodForUser(periods, groupIds)
    },
  })
}
