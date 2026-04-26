import { useEffect, useState, type FC } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import { Bank, CheckCircle, CurrencyEur, Hash, X, Copy, QrCode } from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerClose, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer'
import { ActionPillButton, IconActionButton } from './ui/action-button'
import { Spinner } from './ui/spinner'
import { IconChip } from './IconChip'
import { buildEpcQrPayload, formatIban, formatStructuredCommunication } from '../lib/ogm'
import { KAS_BENEFICIARY_NAME, KAS_IBAN } from '../lib/payment-config'

interface Props {
  paymentId: string
  amountDue: number
  periodName: string
  status: 'unpaid' | 'pending'
  isMarkingPaid: boolean
  onMarkAsPaid: () => void
  onClose: () => void
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy fallback
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function PaymentDrawer({ paymentId, amountDue, periodName, status, isMarkingPaid, onMarkAsPaid, onClose }: Props) {
  const ogm = formatStructuredCommunication(paymentId)
  const formattedIban = formatIban(KAS_IBAN)
  const amountText = amountDue.toFixed(2).replace('.', ',')

  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    let cancelled = false
    const payload = buildEpcQrPayload({
      amount: amountDue,
      structuredCommunication: ogm,
    })
    QRCode.toString(payload, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
      .then((svg) => { if (!cancelled) setQrSvg(svg) })
      .catch(() => { if (!cancelled) setQrSvg(null) })
    return () => { cancelled = true }
  }, [amountDue, ogm])

  async function handleCopy(label: string, value: string) {
    const ok = await copyToClipboard(value)
    if (ok) toast.success(`${label} gekopieerd`)
    else toast.error('Kopiëren mislukt')
  }

  return (
    <Drawer
      open
      onOpenChange={(next: boolean) => {
        if (next) return
        if (isMarkingPaid) return
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
        onClose()
      }}
      dismissible={!isMarkingPaid}
    >
      <DrawerContent
        className="mx-auto w-full max-w-md rounded-t-[24px] px-0"
        style={{ background: 'var(--color-surface)', maxHeight: 'var(--drawer-max-height)' }}
      >
        <DrawerHeader className="flex items-start justify-between gap-3 border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>Betalen</DrawerTitle>
            <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
              {periodName}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <IconActionButton size="sm" variant="neutral" aria-label="Sluiten" disabled={isMarkingPaid}>
              <X size={16} color="currentColor" weight="bold" />
            </IconActionButton>
          </DrawerClose>
        </DrawerHeader>

        <div
          className="flex-1 overflow-y-auto px-5 py-5 space-y-3"
          style={{ background: 'var(--color-bg)' }}
        >
          <div
            className="rounded-card border p-4 text-center"
            style={{ background: 'var(--color-primary-pale)', borderColor: 'var(--color-primary-border)' }}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[1.2px] leading-none" style={{ color: 'var(--color-primary-on)' }}>
              Te betalen
            </p>
            <p className="text-[34px] font-extrabold tracking-[-0.7px] tabular-nums mt-1.5 leading-none" style={{ color: 'var(--color-primary)' }}>
              € {amountText}
            </p>
          </div>

          <CopyField
            icon={Bank}
            label="IBAN"
            display={formattedIban}
            copyValue={KAS_IBAN.replace(/\s+/g, '')}
            onCopy={handleCopy}
          />
          <CopyField
            icon={CurrencyEur}
            label="Bedrag"
            display={`€ ${amountText}`}
            copyValue={amountDue.toFixed(2)}
            onCopy={handleCopy}
          />
          <CopyField
            icon={Hash}
            label="Mededeling"
            display={ogm}
            copyValue={ogm}
            onCopy={handleCopy}
            mono
          />
          <CopyField
            icon={CheckCircle}
            label="Begunstigde"
            display={KAS_BENEFICIARY_NAME}
            copyValue={KAS_BENEFICIARY_NAME}
            onCopy={handleCopy}
          />

          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className="w-full flex items-center gap-3 rounded-card border px-3.5 py-3 text-left active:opacity-70 transition-opacity"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <IconChip tone="neutral" icon={QrCode} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[1.2px] leading-none" style={{ color: 'var(--color-text-muted)' }}>
                QR-code
              </p>
              <p className="text-[13px] font-bold mt-1 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {showQr ? 'Verberg QR' : 'Scan vanaf ander toestel'}
              </p>
            </div>
          </button>

          {showQr && qrSvg && (
            <div
              className="rounded-card border p-4 flex items-center justify-center"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}

          <div
            className="rounded-card border p-4 space-y-2"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[1.2px] leading-none" style={{ color: 'var(--color-text-muted)' }}>
              Hoe betalen
            </p>
            <ol className="space-y-1.5 list-decimal list-inside">
              {[
                'Tik op een veld om het te kopiëren',
                'Open je bankapp',
                'Plak in een nieuwe overschrijving',
                'Markeer hieronder als betaald',
              ].map((step, i) => (
                <li key={i} className="text-[12px] font-medium leading-[1.5]" style={{ color: 'var(--color-text-secondary)' }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {status === 'pending' && (
            <div
              className="rounded-card border p-3.5"
              style={{ background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning-border)' }}
            >
              <p className="text-[12px] font-medium leading-[1.55]" style={{ color: 'var(--color-warning)' }}>
                De kas controleert je betaling. Je krijgt bevestiging zodra alles klopt.
              </p>
            </div>
          )}
        </div>

        {status === 'unpaid' && (
          <div className="border-t border-[var(--color-border)] px-5 py-3">
            <ActionPillButton
              type="button"
              onClick={onMarkAsPaid}
              disabled={isMarkingPaid}
              variant="accent"
              size="md"
              className="w-full"
            >
              {isMarkingPaid
                ? <Spinner className="size-[18px]" style={{ color: 'var(--color-white)' }} />
                : <CheckCircle size={16} weight="bold" color="currentColor" />}
              {isMarkingPaid ? 'Bezig...' : 'Ik heb betaald'}
            </ActionPillButton>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function CopyField({
  icon: Icon,
  label,
  display,
  copyValue,
  onCopy,
  mono,
}: {
  icon: FC<IconProps>
  label: string
  display: string
  copyValue: string
  onCopy: (label: string, value: string) => void
  mono?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(label, copyValue)}
      className="w-full flex items-center gap-3 rounded-card border px-3.5 py-3 text-left active:scale-[0.98] transition-transform"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <IconChip tone="primary" icon={Icon} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[1.2px] leading-none" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p
          className={`text-[14px] font-bold mt-1 leading-tight truncate ${mono ? 'tabular-nums' : ''}`}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {display}
        </p>
      </div>
      <Copy size={16} color="var(--color-text-muted)" weight="bold" />
    </button>
  )
}
