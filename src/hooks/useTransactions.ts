import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAll as getAllOutbox, subscribe as subscribeOutbox } from '../lib/outbox'
import type { OutboxEntry } from '../lib/db'
import type { ConsumptionCategory } from '../lib/database.types'

export interface TransactionItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  consumption_name: string
  category: ConsumptionCategory | null
  icon: string | null
  color: string | null
  period_id: string
  _pending?: boolean
  _rejected?: boolean
  _outboxId?: string
  _lastError?: string | null
}

function entryToTx(entry: OutboxEntry): TransactionItem {
  const p = entry.payload
  return {
    id: `outbox_${entry.id}`,
    quantity: p.quantity,
    unit_price: p.unit_price,
    total_price: p.quantity * p.unit_price,
    created_at: entry.createdAt,
    period_id: p.period_id,
    consumption_name: p.consumption_name,
    category: (p.category as ConsumptionCategory | null) ?? null,
    icon: p.icon,
    color: p.color,
    _pending: entry.status === 'pending',
    _rejected: entry.status === 'rejected',
    _outboxId: entry.id,
    _lastError: entry.lastError,
  }
}

export function useTransactions(periodId: string | undefined) {
  const { user } = useAuth()
  const [outboxEntries, setOutboxEntries] = useState<OutboxEntry[]>([])

  useEffect(() => {
    let mounted = true
    const refresh = () => {
      getAllOutbox().then(list => { if (mounted) setOutboxEntries(list) })
    }
    refresh()
    const unsub = subscribeOutbox(refresh)
    return () => { mounted = false; unsub() }
  }, [])

  const query = useQuery({
    queryKey: ['transactions', user?.id, periodId],
    enabled: !!user && !!periodId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, quantity, unit_price, total_price, created_at, period_id, consumptions(name, category, icon, color)')
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
        consumptions: { name: string; category: ConsumptionCategory | null; icon: string | null; color: string | null } | null
      }>).map(t => ({
        id: t.id,
        quantity: t.quantity,
        unit_price: t.unit_price,
        total_price: t.total_price,
        created_at: t.created_at,
        period_id: t.period_id,
        consumption_name: t.consumptions?.name ?? 'Onbekend',
        category: t.consumptions?.category ?? null,
        icon: t.consumptions?.icon ?? null,
        color: t.consumptions?.color ?? null,
      })) as TransactionItem[]
    },
  })

  const merged = useMemo(() => {
    const server = query.data ?? []
    if (!periodId || !user) return server
    const local = outboxEntries
      .filter(e => e.payload.period_id === periodId && e.payload.user_id === user.id)
      .map(entryToTx)
    return [...local, ...server].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [query.data, outboxEntries, periodId, user])

  return { ...query, data: merged }
}
