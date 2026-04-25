import { useState } from 'react'
import { CloudSlash, ArrowsClockwise, Warning, CheckCircle, X, ArrowClockwise, Trash } from '@phosphor-icons/react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useOutbox } from '../hooks/useOutbox'
import { remove, retry } from '../lib/outbox'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer'
import { IconActionButton, ActionPillButton } from './ui/action-button'
import { IconChip } from './IconChip'
import type { IconChipTone } from './IconChip'

type Tone = 'warning' | 'info' | 'danger'

interface ToneConfig {
  bg: string
  border: string
  fg: string
  fgMuted: string
  chipTone: IconChipTone
}

const TONE: Record<Tone, ToneConfig> = {
  warning: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning-border)',
    fg: 'var(--color-warning)',
    fgMuted: 'color-mix(in oklch, var(--color-warning) 70%, transparent)',
    chipTone: 'warning',
  },
  info: {
    bg: 'var(--color-primary-pale)',
    border: 'var(--color-primary-border)',
    fg: 'var(--color-primary-on)',
    fgMuted: 'color-mix(in oklch, var(--color-primary-on) 65%, transparent)',
    chipTone: 'primary',
  },
  danger: {
    bg: 'var(--color-danger-bg)',
    border: 'var(--color-danger-border)',
    fg: 'var(--color-danger)',
    fgMuted: 'color-mix(in oklch, var(--color-danger) 70%, transparent)',
    chipTone: 'danger',
  },
}

export function OfflineBanner() {
  const online = useOnlineStatus()
  const { pending, rejected, syncing, syncNow } = useOutbox()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (online && !syncing && pending.length === 0 && rejected.length === 0) {
    return null
  }

  let tone: Tone
  let icon: typeof CloudSlash
  let label: string
  let detail: string
  let spin = false
  let action: 'open-drawer' | 'sync-now' | null = null

  if (rejected.length > 0) {
    tone = 'danger'
    icon = Warning
    label = 'Sync gefaald'
    detail = rejected.length === 1
      ? '1 transactie kon niet verstuurd worden'
      : `${rejected.length} transacties konden niet verstuurd worden`
    action = 'open-drawer'
  } else if (!online) {
    tone = 'warning'
    icon = CloudSlash
    label = 'Geen verbinding'
    detail = pending.length === 0
      ? 'Wijzigingen worden lokaal bewaard'
      : pending.length === 1
        ? '1 transactie wacht op sync'
        : `${pending.length} transacties wachten op sync`
  } else if (syncing) {
    tone = 'info'
    icon = ArrowsClockwise
    label = 'Synchroniseren'
    detail = 'Even geduld…'
    spin = true
  } else {
    tone = 'info'
    icon = ArrowsClockwise
    label = 'Klaar voor sync'
    detail = pending.length === 1
      ? '1 transactie wacht — tap om te versturen'
      : `${pending.length} transacties wachten — tap om te versturen`
    action = 'sync-now'
  }

  const colors = TONE[tone]
  const Icon = icon

  const inner = (
    <div
      className="flex items-center gap-3 px-5 py-2.5"
      style={{
        background: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'color-mix(in oklch, var(--color-surface) 55%, transparent)',
          border: `1px solid ${colors.border}`,
        }}
      >
        <Icon size={16} weight="bold" color={colors.fg} className={spin ? 'animate-spin' : undefined} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-extrabold uppercase tracking-[1.2px] leading-none"
          style={{ color: colors.fg }}
        >
          {label}
        </p>
        <p
          className="text-[12px] font-semibold mt-0.5 leading-tight truncate"
          style={{ color: colors.fgMuted }}
        >
          {detail}
        </p>
      </div>
      {action === 'open-drawer' && (
        <span
          className="text-[11px] font-extrabold uppercase tracking-[1px] shrink-0"
          style={{ color: colors.fg }}
        >
          Bekijk
        </span>
      )}
      {action === 'sync-now' && (
        <span
          className="text-[11px] font-extrabold uppercase tracking-[1px] shrink-0"
          style={{ color: colors.fg }}
        >
          Sync
        </span>
      )}
    </div>
  )

  return (
    <>
      <div className="sticky top-0 z-40">
        {action ? (
          <button
            type="button"
            onClick={() => {
              if (action === 'open-drawer') setDrawerOpen(true)
              else if (action === 'sync-now') void syncNow()
            }}
            className="block w-full text-left active:opacity-80 transition-opacity"
          >
            {inner}
          </button>
        ) : (
          inner
        )}
      </div>

      {drawerOpen && (
        <RejectedDrawer
          onClose={() => setDrawerOpen(false)}
          onRetryAll={() => { void syncNow() }}
        />
      )}
    </>
  )
}

function RejectedDrawer({ onClose, onRetryAll }: { onClose: () => void; onRetryAll: () => void }) {
  const { rejected } = useOutbox()
  const [busy, setBusy] = useState<string | null>(null)

  async function handleRetry(id: string) {
    setBusy(id)
    await retry(id)
    setBusy(null)
  }

  async function handleRemove(id: string) {
    setBusy(id)
    await remove(id)
    setBusy(null)
  }

  const allClear = rejected.length === 0

  return (
    <Drawer open onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DrawerContent
        className="rounded-t-[20px] px-0"
        style={{ background: 'var(--color-surface)', maxHeight: 'var(--drawer-max-height-compact)' }}
      >
        <DrawerHeader className="flex items-start justify-between gap-3 border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>Sync gefaald</DrawerTitle>
            <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
              Deze transacties zijn niet geaccepteerd door de server. Probeer opnieuw of verwijder ze.
            </DrawerDescription>
          </div>
          <IconActionButton size="sm" variant="neutral" aria-label="Sluiten" onClick={onClose}>
            <X size={16} color="currentColor" weight="bold" />
          </IconActionButton>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {allClear && (
            <div className="rounded-card border px-4 py-10 flex flex-col items-center text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <IconChip tone="success" icon={CheckCircle} size={48} />
              <p className="mt-3 text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Alles is opgelost
              </p>
              <p className="mt-1 text-[13px] leading-[1.55]" style={{ color: 'var(--color-text-muted)' }}>
                Geen openstaande sync-fouten meer.
              </p>
            </div>
          )}

          {rejected.map(entry => (
            <div
              key={entry.id}
              className="rounded-card border p-3.5"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start gap-3">
                <IconChip
                  tone={(entry.payload.category as IconChipTone) ?? 'danger'}
                  iconName={entry.payload.icon ?? undefined}
                  colorName={entry.payload.color ?? undefined}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="m-0 text-[10px] font-extrabold uppercase tracking-[1.2px]"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Niet gelukt
                  </p>
                  <p
                    className="mt-0.5 text-[14px] font-bold leading-tight truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {entry.payload.quantity}× {entry.payload.consumption_name}
                  </p>
                  <p
                    className="mt-1 text-[13px] font-extrabold tabular-nums"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    € {(entry.payload.unit_price * entry.payload.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {entry.lastError && (
                <div
                  className="mt-3 rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-danger-bg)',
                    border: '1px solid var(--color-danger-border)',
                  }}
                >
                  <p className="text-[12px] font-medium leading-snug" style={{ color: 'var(--color-danger)' }}>
                    {entry.lastError}
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <ActionPillButton
                  size="md"
                  variant="primary-soft"
                  className="flex-1"
                  disabled={busy === entry.id}
                  onClick={() => handleRetry(entry.id)}
                >
                  <ArrowClockwise size={14} weight="bold" color="currentColor" />
                  Opnieuw
                </ActionPillButton>
                <ActionPillButton
                  size="md"
                  variant="danger-soft"
                  className="flex-1"
                  disabled={busy === entry.id}
                  onClick={() => handleRemove(entry.id)}
                >
                  <Trash size={14} weight="bold" color="currentColor" />
                  Verwijderen
                </ActionPillButton>
              </div>
            </div>
          ))}
        </div>

        {rejected.length > 1 && (
          <div className="border-t border-[var(--color-border)] px-5 py-3">
            <ActionPillButton
              size="md"
              variant="accent"
              className="w-full"
              onClick={onRetryAll}
            >
              <ArrowClockwise size={16} weight="bold" color="currentColor" />
              Probeer alles opnieuw
            </ActionPillButton>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
