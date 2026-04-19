import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface LeaderboardEntry {
  user_id: string
  full_name: string
  group_id: string
  group_name: string
  total: number
  rank: number
}

export interface LeaderboardGroup {
  group_id: string
  group_name: string
  entries: LeaderboardEntry[]
}

export function useLeaderboard(periodId: string | undefined, groupId?: string | null) {
  return useQuery({
    queryKey: ['leaderboard', periodId, groupId],
    // Don't run until groupId is resolved: null = intentional (see all), string = filtered, undefined = still loading
    enabled: !!periodId && groupId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_period_id: periodId!,
        p_group_id: groupId ?? null,
      })

      if (error) throw error

      const rows = (data ?? []) as Omit<LeaderboardEntry, 'rank'>[]

      // Rank per groep
      const grouped: Record<string, LeaderboardGroup> = {}
      for (const row of rows) {
        if (!grouped[row.group_id]) {
          grouped[row.group_id] = { group_id: row.group_id, group_name: row.group_name, entries: [] }
        }
        grouped[row.group_id].entries.push({ ...row, rank: grouped[row.group_id].entries.length + 1 })
      }

      return Object.values(grouped).sort((a, b) => a.group_name.localeCompare(b.group_name))
    },
  })
}
