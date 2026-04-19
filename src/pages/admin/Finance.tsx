import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, CurrencyEur, User, Export } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyPaymentConfirmed } from '../../lib/notifications'
import type { Period } from '../../lib/database.types'

interface PaymentRow {
  id: string
  user_id: string
  period_id: string
  amount_due: number
  amount_paid: number
  status: string
  paid_at: string | null
  full_name: string
}

const STATUS_CONFIG = {
  unpaid:  { label: 'Te betalen',  bg: 'bg-[#F8FAFC] dark:bg-[#334155]',  text: 'text-[#94A3B8]' },
  pending: { label: 'Betaald (?)', bg: 'bg-[#FFFBEB] dark:bg-[#44250A]',  text: 'text-[#F59E0B]' },
  paid:    { label: 'Bevestigd',   bg: 'bg-[#ECFDF5] dark:bg-[#064E3B]',  text: 'text-[#10B981]' },
}

export function Finance() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const manuallySelected = useRef(false)

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data } = await supabase
        .from('periods')
        .select('*')
        .order('started_at', { ascending: false })
      return (data ?? []) as Period[]
    },
    staleTime: 0,
  })

  useEffect(() => {
    if (!periods?.length || manuallySelected.current) return
    setSelectedPeriod(periods[0].id)
  }, [periods])

  useEffect(() => {
    if (!selectedPeriod) return

    let cancelled = false
    setIsLoading(true)
    setPayments([])

    supabase
      .from('payments')
      .select('id, user_id, period_id, amount_due, amount_paid, status, paid_at, profiles!payments_user_id_fkey(full_name)')
      .eq('period_id', selectedPeriod)
      .order('status')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Finance payments error:', error)
          setIsLoading(false)
          return
        }
        const rows = (data ?? []) as unknown as Array<{
          id: string; user_id: string; period_id: string
          amount_due: number; amount_paid: number; status: string
          paid_at: string | null; profiles: { full_name: string } | null
        }>
        setPayments(rows.map(p => ({ ...p, full_name: p.profiles?.full_name ?? 'Onbekend' })))
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedPeriod])

  async function confirmPayment(paymentId: string) {
    if (!user) return
    setConfirming(paymentId)

    const payment = payments.find(p => p.id === paymentId)
    if (!payment) { setConfirming(null); return }

    await supabase.from('payments').update({
      status: 'paid',
      amount_paid: payment.amount_due,
      paid_at: new Date().toISOString(),
      confirmed_by: user.id,
    }).eq('id', paymentId)

    const periodName = periods?.find(p => p.id === selectedPeriod)?.name ?? 'de periode'
    notifyPaymentConfirmed(payment.user_id, periodName)

    setPayments(prev => prev.map(p =>
      p.id === paymentId
        ? { ...p, status: 'paid', amount_paid: payment.amount_due, paid_at: new Date().toISOString() }
        : p
    ))
    setConfirming(null)
  }

  function exportCsv() {
    if (!payments.length) return
    const periodName = periods?.find(p => p.id === selectedPeriod)?.name ?? 'periode'
    const rows = [
      ['Naam', 'Verschuldigd', 'Betaald', 'Status'],
      ...payments.map(p => [
        p.full_name,
        p.amount_due.toFixed(2),
        p.amount_paid.toFixed(2),
        p.status === 'paid' ? 'Bevestigd' : p.status === 'pending' ? 'Betaald (?)' : 'Te betalen',
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `betalingen-${periodName.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const unpaidTotal = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount_due), 0)
  const paidTotal   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount_paid), 0)
  const currentPeriod = (periods ?? []).find(p => p.id === selectedPeriod)

  return (
    <div className="px-4 space-y-4">
      {(periods ?? []).length > 0 && (
        <select
          value={selectedPeriod}
          onChange={e => { manuallySelected.current = true; setSelectedPeriod(e.target.value) }}
          className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-primary"
        >
          {(periods ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.is_active ? ' (actief)' : ''}</option>
          ))}
        </select>
      )}

      {payments.length > 0 && (
        <button
          onClick={exportCsv}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2.5 text-sm font-semibold text-[#64748B] dark:text-[#94A3B8] active:scale-[0.98] transition-transform"
        >
          <Export size={16} />
          Exporteer CSV
        </button>
      )}

      {payments.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-3">
            <p className="text-xs text-[#94A3B8] font-medium">Openstaand</p>
            <p className="text-xl font-extrabold text-[#EF4444] mt-0.5">€{unpaidTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-3">
            <p className="text-xs text-[#94A3B8] font-medium">Ontvangen</p>
            <p className="text-xl font-extrabold text-[#10B981] mt-0.5">€{paidTotal.toFixed(2)}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && payments.length === 0 && selectedPeriod && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-8 text-center">
          <p className="text-sm text-[#94A3B8]">Geen betalingen voor deze periode.</p>
          {currentPeriod?.is_active && (
            <p className="text-xs text-[#94A3B8] mt-1">Sluit de periode af om betalingen aan te maken.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {payments.map(payment => {
          const cfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unpaid
          return (
            <div key={payment.id} className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-full flex items-center justify-center shrink-0">
                    <User size={16} color="#2563EB" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{payment.full_name}</p>
                    <p className="text-xs text-[#94A3B8]">
                      Verschuldigd: <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">€{Number(payment.amount_due).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>

              {payment.status === 'pending' && (
                <button
                  onClick={() => confirmPayment(payment.id)}
                  disabled={confirming === payment.id}
                  className="mt-3 w-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#10B981] font-semibold py-2 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} weight="fill" />
                  {confirming === payment.id ? 'Bezig…' : 'Betaling bevestigen'}
                </button>
              )}

              {payment.status === 'paid' && payment.paid_at && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Clock size={12} color="#94A3B8" />
                  <p className="text-xs text-[#94A3B8]">
                    Betaald op {new Date(payment.paid_at).toLocaleDateString('nl-BE')}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {payments.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] rounded-[14px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#EFF6FF] dark:bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <CurrencyEur size={14} color="#2563EB" />
            </div>
            <span className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Totaal periode</span>
          </div>
          <span className="text-base font-extrabold text-[#0F172A] dark:text-[#F1F5F9]">
            €{payments.reduce((s, p) => s + Number(p.amount_due), 0).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
