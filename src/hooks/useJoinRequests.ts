import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface JoinRequestWithProfile {
  id: string
  user_id: string
  group_id: string
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
  groups: { name: string } | null
}

export function useJoinRequests(groupId: string | null | undefined) {
  const { user, profile } = useAuth()
  const canReadWithoutGroup = profile?.role === 'kas'

  return useQuery({
    queryKey: ['join-requests', user?.id, groupId, profile?.role],
    enabled: !!user && (!!groupId || canReadWithoutGroup),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_manageable_join_requests', {
        p_group_id: canReadWithoutGroup ? null : groupId,
      })

      if (error) {
        let query = supabase
          .from('join_requests')
          .select('id, user_id, group_id, status, created_at, profiles(full_name, avatar_url), groups(name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })

        if (!canReadWithoutGroup && groupId) {
          query = query.eq('group_id', groupId)
        }

        const { data: fallbackData, error: fallbackError } = await query
        if (fallbackError) throw error

        return ((fallbackData ?? []) as unknown as Array<{
          id: string
          user_id: string
          group_id: string
          status: string
          created_at: string
          profiles: { full_name: string | null; avatar_url: string | null } | null
          groups: { name: string | null } | null
        }>).map((request) => ({
          id: request.id,
          user_id: request.user_id,
          group_id: request.group_id,
          status: request.status,
          created_at: request.created_at,
          profiles: {
            full_name: request.profiles?.full_name ?? 'Onbekend',
            avatar_url: request.profiles?.avatar_url ?? null,
          },
          groups: request.groups?.name ? { name: request.groups.name } : null,
        })) satisfies JoinRequestWithProfile[]
      }

      return ((data ?? []) as Array<{
        id: string
        user_id: string
        group_id: string
        status: string
        created_at: string
        full_name: string | null
        avatar_url: string | null
        group_name: string | null
      }>).map((request) => ({
        id: request.id,
        user_id: request.user_id,
        group_id: request.group_id,
        status: request.status,
        created_at: request.created_at,
        profiles: {
          full_name: request.full_name ?? 'Onbekend',
          avatar_url: request.avatar_url,
        },
        groups: request.group_name ? { name: request.group_name } : null,
      })) satisfies JoinRequestWithProfile[]
    },
  })
}
