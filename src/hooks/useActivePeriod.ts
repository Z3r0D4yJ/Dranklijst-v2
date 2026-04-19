import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Period } from '../lib/database.types'

export function useActivePeriod() {
  return useQuery({
    queryKey: ['active-period'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periods')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()
      if (error) throw error
      return data as Period | null
    },
  })
}
