import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useMyGroup() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['my-group', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name)')
        .eq('user_id', user!.id)

      if (error) throw error

      const memberships = data as unknown as Array<{
        group_id: string
        groups: { id: string; name: string } | null
      }>

      // Return first non-Leiding group
      const main = memberships.find(m => m.groups?.name !== 'Leiding')
      return main?.groups ?? null
    },
  })
}
