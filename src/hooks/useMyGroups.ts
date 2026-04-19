import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface GroupInfo {
  id: string
  name: string
}

export function useMyGroups() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['my-groups', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(id, name)')
        .eq('user_id', user!.id)

      if (error) throw error

      return (data as unknown as Array<{ groups: GroupInfo | null }>)
        .map(m => m.groups)
        .filter((g): g is GroupInfo => !!g)
    },
  })
}
