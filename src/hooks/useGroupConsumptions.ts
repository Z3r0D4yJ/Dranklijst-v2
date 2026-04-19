import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ConsumptionCategory } from '../lib/database.types'

export interface GroupConsumptionItem {
  id: string
  consumption_id: string
  name: string
  price: number
  category: ConsumptionCategory
  is_visible: boolean
}

export function useGroupConsumptions(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-consumptions', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_consumptions')
        .select('id, consumption_id, is_visible, custom_price, consumptions(name, price, category, is_active)')
        .eq('group_id', groupId!)
        .eq('is_visible', true)

      if (error) throw error

      return (data as unknown as Array<{
        id: string
        consumption_id: string
        is_visible: boolean
        custom_price: number | null
        consumptions: { name: string; price: number; category: ConsumptionCategory; is_active: boolean } | null
      }>)
        .filter(item => item.consumptions?.is_active)
        .map(item => ({
          id: item.id,
          consumption_id: item.consumption_id,
          name: item.consumptions!.name,
          price: item.custom_price ?? item.consumptions!.price,
          category: item.consumptions!.category,
          is_visible: item.is_visible,
        })) as GroupConsumptionItem[]
    },
  })
}
