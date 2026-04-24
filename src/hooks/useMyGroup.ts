import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useMyGroup() {
  const { user, profile } = useAuth()

  return useQuery({
    queryKey: ['my-group', user?.id, profile?.role],
    enabled: !!user && !!profile,
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

      // kas and leiding buy in the Leiding group context
      if (profile?.role === 'leiding' || profile?.role === 'kas') {
        const leiding = memberships.find(m => m.groups?.name === 'Leiding')
        if (leiding?.groups) return leiding.groups
      }

      return memberships.find(m => m.groups?.name !== 'Leiding')?.groups ?? null
    },
  })
}
