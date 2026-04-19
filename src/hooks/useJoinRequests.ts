import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface JoinRequestWithProfile {
  id: string
  user_id: string
  group_id: string
  status: string
  created_at: string
  profiles: { full_name: string } | null
}

export function useJoinRequests(groupId: string | null | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['join-requests', groupId],
    enabled: !!user && !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_requests')
        .select('*, profiles(full_name)')
        .eq('group_id', groupId!)
        .eq('status', 'pending')
        .order('created_at')

      if (error) throw error
      return (data ?? []) as unknown as JoinRequestWithProfile[]
    },
  })
}
