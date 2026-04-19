import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface TransactionItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  consumption_name: string
  period_id: string
}

export function useTransactions(periodId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', user?.id, periodId],
    enabled: !!user && !!periodId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, quantity, unit_price, total_price, created_at, period_id, consumptions(name)')
        .eq('user_id', user!.id)
        .eq('period_id', periodId!)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data as unknown as Array<{
        id: string
        quantity: number
        unit_price: number
        total_price: number
        created_at: string
        period_id: string
        consumptions: { name: string } | null
      }>).map(t => ({
        id: t.id,
        quantity: t.quantity,
        unit_price: t.unit_price,
        total_price: t.total_price,
        created_at: t.created_at,
        period_id: t.period_id,
        consumption_name: t.consumptions?.name ?? 'Onbekend',
      })) as TransactionItem[]
    },
  })
}
