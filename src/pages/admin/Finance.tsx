import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, CurrencyEur, User, Export } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyPaymentConfirmed } from '../../lib/notifications'
import { CustomSelect } from '../../components/CustomSelect'
import { Pagination } from '../../components/Pagination'
import { usePagination } from '../../hooks/usePagination'
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
  unpaid:  { label: 'Te betalen',  bg: 'var(--color-surface-alt)',  text: 'var(--color-text-muted)' },
  pending: { label: 'Betaald (?)', bg: 'var(--color-warning-bg)',   text: 'var(--color-warning)'    },
  paid:    { label: 'Bevestigd',   bg: 'var(--color-success-bg)',   text: 'var(--color-success)'    },
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
        if (error) { setIsLoading(false); return }
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
  const totalAll    = payments.reduce((s, p) => s + Number(p.amount_due), 0)
  const paidPct     = totalAll > 0 ? Math.round((paidTotal / totalAll) * 100) : 0
  const currentPeriod = (periods ?? []).find(p => p.id === selectedPeriod)
  const { slice: pagePayments, page, totalPages, onPage } = usePagination(payments, 25)

  return (
    <div className="px-4 space-y-3">
      {/* Period selector */}
      {(periods ?? []).length > 0 && (
        <CustomSelect
          value={selectedPeriod}
          onChange={v => { manuallySelected.current = true; setSelectedPeriod(v) }}
          options={(periods ?? []).map(p => ({ value: p.id, label: p.name + (p.is_active ? ' (actief)' : '') }))}
          icon={<CurrencyEur size={14} color="var(--color-text-muted)" />}
        />
      )}

      {/* Totals */}
      {payments.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] p-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.8px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>Openstaand</p>
              <p className="text-[20px] font-extrabold m-0 tabular-nums" style={{ color: 'var(--color-danger)' }}>€{unpaidTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-[14px] p-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.8px] m-0 mb-1" style={{ color: 'var(--color-text-muted)' }}>Ontvangen</p>
              <p className="text-[20px] font-extrabold m-0 tabular-nums" style={{ color: 'var(--color-success)' }}>€{paidTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-[14px] px-3.5 py-2.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Betaald</span>
              <span className="text-[12px] font-extrabold" style={{ color: 'var(--color-success)' }}>{paidPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
              <div style={{ width: `${paidPct}%`, height: '100%', background: 'var(--color-success)', borderRadius: 99, transition: 'width 600ms' }} />
            </div>
          </div>

          {/* Export */}
          <button
            onClick={exportCsv}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-bold active:scale-[0.98] transition-transform"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 10,
              color: 'var(--color-text-secondary)',
              fontFamily: 'inherit',
            }}
          >
            <Export size={15} color="var(--color-text-muted)" />
            Exporteer CSV
          </button>
        </>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && payments.length === 0 && selectedPeriod && (
        <div className="rounded-[14px] px-4 py-8 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>Geen betalingen voor deze periode.</p>
          {currentPeriod?.is_active && (
            <p className="text-[12px] m-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>Sluit de periode af om betalingen aan te maken.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pagePayments.map(payment => {
          const cfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unpaid
          return (
            <div key={payment.id} className="rounded-[14px] p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-pale)' }}>
                  <User size={15} color="var(--color-primary)" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>{payment.full_name}</p>
                  <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Verschuldigd: <strong style={{ color: 'var(--color-text-primary)' }}>€{Number(payment.amount_due).toFixed(2)}</strong>
                  </p>
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded-[6px] shrink-0"
                  style={{ background: cfg.bg, color: cfg.text }}
                >
                  {cfg.label}
                </span>
              </div>

              {payment.status === 'pending' && (
                <button
                  onClick={() => confirmPayment(payment.id)}
                  disabled={confirming === payment.id}
                  className="mt-2.5 w-full text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{
                    background: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    padding: 9,
                    borderRadius: 10,
                    border: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <CheckCircle size={14} color="var(--color-success)" />
                  {confirming === payment.id ? 'Bezig…' : 'Betaling bevestigen'}
                </button>
              )}

              {payment.status === 'paid' && payment.paid_at && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Clock size={12} color="var(--color-text-muted)" />
                  <p className="text-[12px] m-0" style={{ color: 'var(--color-text-muted)' }}>
                    Betaald op {new Date(payment.paid_at).toLocaleDateString('nl-BE')}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  )
}
