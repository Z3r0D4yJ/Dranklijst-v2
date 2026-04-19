import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarBlank, Play, Stop, Plus, X, CheckCircle, Users, CurrencyEur } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyPeriodClosed } from '../../lib/notifications'
import type { Period } from '../../lib/database.types'

interface PeriodStats {
  period: Period
  user_count: number
  total: number
}

export function Periods() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [closing, setClosing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['period-stats'],
    queryFn: async () => {
      const { data: periods } = await supabase
        .from('periods')
        .select('*')
        .order('started_at', { ascending: false })

      if (!periods) return []

      const result: PeriodStats[] = await Promise.all(
        (periods as Period[]).map(async p => {
          const { data } = await supabase
            .from('transactions')
            .select('user_id, total_price')
            .eq('period_id', p.id)

          const rows = (data ?? []) as { user_id: string; total_price: number }[]
          const userCount = new Set(rows.map(r => r.user_id)).size
          const total = rows.reduce((s, r) => s + r.total_price, 0)
          return { period: p, user_count: userCount, total }
        })
      )
      return result
    },
  })

  async function startPeriod() {
    if (!newName.trim() || !user) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('periods').insert({
      name: newName.trim(),
      is_active: true,
      created_by: user.id,
    })

    if (error) {
      setError('Kon periode niet starten.')
      setLoading(false)
    } else {
      await queryClient.invalidateQueries({ queryKey: ['period-stats'] })
      queryClient.invalidateQueries({ queryKey: ['active-period'] })
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      setNewName('')
      setShowNew(false)
      setLoading(false)
    }
  }

  async function closePeriod(periodId: string, periodName: string) {
    setClosing(periodId)
    setError(null)

    const { error } = await supabase.rpc('close_period', { p_period_id: periodId })

    if (error) {
      setError('Kon periode niet afsluiten.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['period-stats'] })
      queryClient.invalidateQueries({ queryKey: ['active-period'] })
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      notifyPeriodClosed(periodId, periodName)
      navigate('/admin/financieel')
    }
    setClosing(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="px-4 space-y-4">
      {!showNew ? (
        <button
          onClick={() => setShowNew(true)}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Nieuwe periode starten
        </button>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Nieuwe periode</p>
            <button onClick={() => { setShowNew(false); setNewName('') }}>
              <X size={18} color="#94A3B8" />
            </button>
          </div>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="bv. Zomerkamp 2025"
            className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && startPeriod()}
            autoFocus
          />
          {error && <p className="text-xs text-[#EF4444]">{error}</p>}
          <button
            onClick={startPeriod}
            disabled={!newName.trim() || loading}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Play size={16} weight="fill" />
            {loading ? 'Bezig…' : 'Starten'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {(stats ?? []).map(({ period, user_count, total }) => (
        <div key={period.id} className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${period.is_active ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#F8FAFC] dark:bg-[#334155]'}`}>
                <CalendarBlank size={17} color={period.is_active ? '#10B981' : '#94A3B8'} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">{period.name}</p>
                <p className="text-xs text-[#94A3B8]">
                  {formatDate(period.started_at)}
                  {period.ended_at ? ` → ${formatDate(period.ended_at)}` : ' · Actief'}
                </p>
              </div>
            </div>
            {period.is_active && (
              <button
                onClick={() => closePeriod(period.id, period.name)}
                disabled={closing === period.id}
                className="flex items-center gap-1.5 bg-[#FEF2F2] dark:bg-[#450A0A] text-[#EF4444] text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50 shrink-0"
              >
                <Stop size={13} weight="fill" />
                {closing === period.id ? 'Bezig…' : 'Afsluiten'}
              </button>
            )}
            {!period.is_active && (
              <span className="flex items-center gap-1 text-xs text-[#10B981] font-semibold shrink-0">
                <CheckCircle size={14} weight="fill" />
                Gesloten
              </span>
            )}
          </div>

          <div className="flex gap-3 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#334155]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                <Users size={12} color="#2563EB" />
              </div>
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{user_count} leden</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                <CurrencyEur size={12} color="#2563EB" />
              </div>
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">€{total.toFixed(2)} totaal</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
