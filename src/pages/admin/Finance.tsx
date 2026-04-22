import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CaretRight, CheckCircle, Clock, CurrencyEur, Export, User } from '@phosphor-icons/react'
import { AdminEmptyState, AdminOverviewCard, AdminStatTile } from '../../components/AdminThemePrimitives'
import { IconChip } from '../../components/IconChip'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/spinner'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../context/AuthContext'
import { notifyPaymentConfirmed } from '../../lib/notifications'
import { CustomSelect } from '../../components/CustomSelect'
import { Pagination } from '../../components/Pagination'
import { AdminFormDrawer } from '../../components/AdminFormDrawer'
import { ActionPillButton } from '../../components/ui/action-button'
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
  unpaid: { label: 'Te betalen', variant: 'secondary' },
  pending: { label: 'Betaald (?)', variant: 'warning' },
  paid: { label: 'Bevestigd', variant: 'success' },
} as const

function getStatusTone(status: string) {
  if (status === 'paid') return 'success' as const
  if (status === 'pending') return 'warning' as const
  return 'danger' as const
}

function getStatusHint(status: string, paidAt: string | null) {
  if (status === 'paid' && paidAt) {
    return `Bevestigd op ${new Date(paidAt).toLocaleDateString('nl-BE')}`
  }

  if (status === 'pending') {
    return 'Wacht op bevestiging door de kas'
  }

  return null
}

function PaymentDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-3"
      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-[11px] font-extrabold uppercase tracking-[1.2px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-[13px] font-bold text-right" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

export function Finance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
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
          setIsLoading(false)
          return
        }

        const rows = (data ?? []) as unknown as Array<{
          id: string
          user_id: string
          period_id: string
          amount_due: number
          amount_paid: number
          status: string
          paid_at: string | null
          profiles: { full_name: string }[] | { full_name: string } | null
        }>

        setPayments(
          rows.map((payment) => {
            const profile = Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles
            return { ...payment, full_name: profile?.full_name ?? 'Onbekend' }
          }),
        )
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPeriod])

  async function confirmPayment(paymentId: string) {
    if (!user) return

    setConfirming(paymentId)
    const payment = payments.find((row) => row.id === paymentId)
    if (!payment) {
      setConfirming(null)
      return
    }

    const paidAt = new Date().toISOString()
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        amount_paid: payment.amount_due,
        paid_at: paidAt,
        confirmed_by: user.id,
      })
      .eq('id', paymentId)

    if (error) {
      setConfirming(null)
      toast.error('Betaling kon niet worden bevestigd.')
      return
    }

    const periodName = periods?.find((period) => period.id === selectedPeriod)?.name ?? 'de periode'
    notifyPaymentConfirmed(payment.user_id, periodName)

    setPayments((current) =>
      current.map((row) =>
        row.id === paymentId
          ? { ...row, status: 'paid', amount_paid: payment.amount_due, paid_at: paidAt }
          : row,
      ),
    )

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['payments'] }),
      queryClient.invalidateQueries({ queryKey: ['open-payments'] }),
    ])

    setSelectedPaymentId(null)
    setConfirming(null)
    toast.success(`Betaling van ${payment.full_name} bevestigd.`)
  }

  function exportCsv() {
    if (!payments.length) return

    const periodName = periods?.find((period) => period.id === selectedPeriod)?.name ?? 'periode'
    const rows = [
      ['Naam', 'Verschuldigd', 'Betaald', 'Status'],
      ...payments.map((payment) => [
        payment.full_name,
        payment.amount_due.toFixed(2),
        payment.amount_paid.toFixed(2),
        payment.status === 'paid' ? 'Bevestigd' : payment.status === 'pending' ? 'Betaald (?)' : 'Te betalen',
      ]),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `betalingen-${periodName.replace(/\s+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const unpaidTotal = payments.filter((payment) => payment.status !== 'paid').reduce((sum, payment) => sum + Number(payment.amount_due), 0)
  const paidTotal = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount_paid), 0)
  const totalAll = payments.reduce((sum, payment) => sum + Number(payment.amount_due), 0)
  const paidPct = totalAll > 0 ? Math.round((paidTotal / totalAll) * 100) : 0
  const currentPeriod = (periods ?? []).find((period) => period.id === selectedPeriod)
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) ?? null
  const { slice: pagePayments, page, totalPages, onPage } = usePagination(payments, 25)

  return (
    <div className="px-4 space-y-3 pb-content-end-comfort">
      {currentPeriod && (
        <AdminOverviewCard
          icon={CurrencyEur}
          tone="primary"
          eyebrow="Financieel overzicht"
          title={currentPeriod.name}
          description="Volg hier de openstaande, gemarkeerde en bevestigde betalingen per periode."
          badge={<Badge variant={currentPeriod.is_active ? 'success' : 'secondary'}>{currentPeriod.is_active ? 'Actief' : 'Afgesloten'}</Badge>}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <AdminStatTile
              label="Openstaand"
              value={`EUR ${unpaidTotal.toFixed(2)}`}
              icon={Clock}
              tone="danger"
              valueTone="danger"
            />
            <AdminStatTile
              label="Ontvangen"
              value={`EUR ${paidTotal.toFixed(2)}`}
              icon={CheckCircle}
              tone="success"
              valueTone="success"
            />
          </div>

          <div
            className="mt-2.5 rounded-[12px] border px-3.5 py-3"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Voortgang
              </span>
              <span className="text-[12px] font-extrabold" style={{ color: 'var(--color-success)' }}>
                {paidPct}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
              <div
                style={{
                  width: `${paidPct}%`,
                  height: '100%',
                  background: 'var(--color-success)',
                  borderRadius: 99,
                  transition: 'width 600ms',
                }}
              />
            </div>
          </div>
        </AdminOverviewCard>
      )}

      {(periods ?? []).length > 0 && (
        <div
          className="rounded-card border p-3.5"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p
            className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Periode
          </p>
          <div className="mt-2">
            <CustomSelect
              value={selectedPeriod}
              onChange={(value) => {
                manuallySelected.current = true
                setSelectedPeriod(value)
                setSelectedPaymentId(null)
              }}
              options={(periods ?? []).map((period) => ({
                value: period.id,
                label: period.name,
                badge: period.is_active ? 'Actief' : undefined,
                badgeTone: 'success',
              }))}
              icon={
                <div
                  className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-primary-pale)' }}
                >
                  <CurrencyEur size={13} color="var(--color-primary)" />
                </div>
              }
            />
          </div>
          {payments.length > 0 && (
            <ActionPillButton
              type="button"
              onClick={exportCsv}
              variant="neutral"
              size="md"
              className="mt-2.5 w-full"
            >
              <Export size={15} color="currentColor" />
              Exporteer CSV
            </ActionPillButton>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Spinner className="size-7" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {!isLoading && payments.length === 0 && selectedPeriod && (
        <AdminEmptyState
          icon={CurrencyEur}
          title="Geen betalingen voor deze periode"
          description={
            currentPeriod?.is_active
              ? 'Sluit de periode af om automatisch betalingen aan te maken.'
              : 'Voor deze periode zijn nog geen betaalrecords beschikbaar.'
          }
        />
      )}

      {payments.length > 0 && (
        <p
          className="m-0 text-[11px] font-extrabold uppercase tracking-[1.2px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Betalingen
        </p>
      )}

      <div className="flex flex-col gap-2">
        {pagePayments.map((payment) => {
          const config = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unpaid
          const tone = getStatusTone(payment.status)
          const statusHint = getStatusHint(payment.status, payment.paid_at)

          return (
            <button
              key={payment.id}
              type="button"
              onClick={() => setSelectedPaymentId(payment.id)}
              className="w-full rounded-card p-3.5 text-left active:scale-[0.99] transition-transform"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
            >
              <div className="flex items-start gap-3">
                <IconChip tone={tone} icon={payment.status === 'paid' ? CheckCircle : payment.status === 'pending' ? Clock : User} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {payment.full_name}
                      </p>
                      {statusHint && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="muted" size="sm">
                            {statusHint}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="m-0 text-[16px] font-extrabold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                          EUR {Number(payment.amount_due).toFixed(2)}
                        </p>
                        <div className="mt-1">
                          <Badge variant={config.variant} size="sm" className="shrink-0">
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      <CaretRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />

      <AdminFormDrawer
        open={!!selectedPayment}
        onOpenChange={(open) => {
          if (!open) setSelectedPaymentId(null)
        }}
        title={selectedPayment?.full_name ?? 'Betalingsdetail'}
        description={currentPeriod ? `Periode: ${currentPeriod.name}` : 'Betalingsdetail'}
        dismissible={confirming !== selectedPayment?.id}
        disableClose={confirming === selectedPayment?.id}
        bodyClassName="space-y-4"
        scrollBody={false}
        footer={
          selectedPayment?.status === 'pending' ? (
            <button
              type="button"
              onClick={() => void confirmPayment(selectedPayment.id)}
              disabled={confirming === selectedPayment.id}
              className="w-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                padding: '12px',
                borderRadius: 12,
                border: '1px solid var(--color-success-border)',
                fontFamily: 'inherit',
              }}
            >
              <CheckCircle size={15} color="var(--color-success)" weight="bold" />
              {confirming === selectedPayment.id ? 'Bevestigen...' : 'Betaling bevestigen'}
            </button>
          ) : undefined
        }
      >
        {selectedPayment && (
          <>
            <AdminOverviewCard
              icon={selectedPayment.status === 'paid' ? CheckCircle : selectedPayment.status === 'pending' ? Clock : User}
              tone={getStatusTone(selectedPayment.status)}
              eyebrow="Betalingsstatus"
              title={STATUS_CONFIG[selectedPayment.status as keyof typeof STATUS_CONFIG]?.label ?? 'Te betalen'}
              description={
                selectedPayment.status === 'pending'
                  ? 'Deze gebruiker gaf aan betaald te hebben. Controleer en bevestig hieronder.'
                  : selectedPayment.status === 'paid'
                    ? 'Deze betaling is al bevestigd in de kas.'
                    : 'Deze gebruiker heeft nog geen betaling gemarkeerd.'
              }
              badge={
                <Badge
                  variant={
                    STATUS_CONFIG[selectedPayment.status as keyof typeof STATUS_CONFIG]?.variant ??
                    STATUS_CONFIG.unpaid.variant
                  }
                >
                  {STATUS_CONFIG[selectedPayment.status as keyof typeof STATUS_CONFIG]?.label ?? 'Te betalen'}
                </Badge>
              }
            />

            <div className="grid grid-cols-2 gap-2.5">
              <AdminStatTile
                label="Verschuldigd"
                value={`EUR ${Number(selectedPayment.amount_due).toFixed(2)}`}
                icon={Clock}
                tone="danger"
              />
              <AdminStatTile
                label="Ontvangen"
                value={`EUR ${Number(selectedPayment.amount_paid).toFixed(2)}`}
                icon={CheckCircle}
                tone="success"
                valueTone="success"
              />
            </div>

            <div className="space-y-2">
              <PaymentDetailRow label="Naam" value={selectedPayment.full_name} />
              <PaymentDetailRow label="Periode" value={currentPeriod?.name ?? 'Onbekend'} />
              <PaymentDetailRow
                label="Bevestigd op"
                value={selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleDateString('nl-BE') : 'Nog niet bevestigd'}
              />
            </div>
          </>
        )}
      </AdminFormDrawer>
    </div>
  )
}
