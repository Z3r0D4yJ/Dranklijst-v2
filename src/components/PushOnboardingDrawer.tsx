import { useEffect, useState } from 'react'
import { Bell, CheckCircle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { Drawer, DrawerContent, DrawerClose, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer'
import { ActionPillButton, IconActionButton } from './ui/action-button'
import { IconChip } from './IconChip'

const STORAGE_PREFIX = 'push_onboarded_'

const HIGHLIGHTS: Array<{ icon: typeof CheckCircle; label: string }> = [
  { icon: CheckCircle, label: 'Periode afgesloten — bedrag voor jou' },
  { icon: CheckCircle, label: 'Betaling bevestigd door de kas' },
  { icon: CheckCircle, label: 'Aanvraag voor jouw groep (leiding)' },
]

export function PushOnboardingDrawer() {
  const { user } = useAuth()
  const push = usePushSubscription()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!push.supported) return
    if (push.subscribed) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return

    try {
      if (localStorage.getItem(`${STORAGE_PREFIX}${user.id}`)) return
    } catch {
      return
    }

    const timeout = window.setTimeout(() => setOpen(true), 1200)
    return () => window.clearTimeout(timeout)
  }, [user, push.supported, push.subscribed])

  function flagSeen(value: 'accepted' | 'declined') {
    if (!user) return
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, value)
    } catch {
      // ignore quota errors
    }
  }

  function handleDecline() {
    flagSeen('declined')
    setOpen(false)
  }

  async function handleAccept() {
    setBusy(true)
    const ok = await push.enable()
    setBusy(false)
    flagSeen(ok ? 'accepted' : 'declined')
    setOpen(false)
    if (ok) {
      toast.success('Meldingen ingeschakeld')
    }
  }

  if (!open) return null

  return (
    <Drawer open onOpenChange={(next: boolean) => { if (!next && !busy) handleDecline() }} dismissible={!busy}>
      <DrawerContent
        className="mx-auto w-full max-w-md rounded-t-[24px] px-0"
        style={{ background: 'var(--color-surface)' }}
      >
        <DrawerHeader className="flex items-start justify-between gap-3 border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>Meldingen aanzetten?</DrawerTitle>
            <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
              Krijg op tijd een seintje, niets meer en niets minder.
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <IconActionButton size="sm" variant="neutral" aria-label="Sluiten" disabled={busy}>
              <X size={16} color="currentColor" weight="bold" />
            </IconActionButton>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-5 py-5 space-y-4">
          <div className="flex flex-col items-center text-center gap-3 pt-2">
            <IconChip tone="primary" icon={Bell} size={56} />
            <p className="text-[14px] font-medium leading-[1.55] max-w-[280px]" style={{ color: 'var(--color-text-secondary)' }}>
              We sturen alleen een melding wanneer er iets gebeurt dat voor jou belangrijk is.
            </p>
          </div>

          <div
            className="rounded-card border overflow-hidden"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
          >
            {HIGHLIGHTS.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3.5 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}
                >
                  <Icon size={16} weight="fill" color="var(--color-success)" />
                  <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                    {item.label}
                  </p>
                </div>
              )
            })}
          </div>

          <p className="text-[11px] font-medium leading-[1.55] text-center" style={{ color: 'var(--color-text-muted)' }}>
            Je kan dit later altijd nog aanpassen via je profiel.
          </p>
        </div>

        <div className="border-t border-[var(--color-border)] px-5 py-3 grid grid-cols-2 gap-2">
          <ActionPillButton
            type="button"
            onClick={handleDecline}
            disabled={busy}
            variant="neutral"
            size="md"
            className="w-full"
          >
            Niet nu
          </ActionPillButton>
          <ActionPillButton
            type="button"
            onClick={handleAccept}
            disabled={busy}
            variant="accent"
            size="md"
            className="w-full"
          >
            <Bell size={16} weight="bold" color="currentColor" />
            {busy ? 'Bezig...' : 'Aanzetten'}
          </ActionPillButton>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
