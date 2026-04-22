import { useNavigate } from 'react-router-dom'
import { X, Bell, CheckCircle, Users, CurrencyEur, Warning } from '@phosphor-icons/react'
import { useNotifications, type AppNotification } from '../hooks/useNotifications'
import { Spinner } from './ui/spinner'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Zojuist'
  if (m < 60) return `${m}m geleden`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}u geleden`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d geleden`
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
}

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase()
  const size = 18
  if (t.includes('aanvraag') || t.includes('toegevoegd')) {
    return <Users size={size} color="var(--color-primary)" weight="bold" />
  }
  if (t.includes('betaling') || t.includes('periode')) {
    return <CurrencyEur size={size} color="var(--color-success)" weight="bold" />
  }
  if (t.includes('afgekeurd')) {
    return <Warning size={size} color="var(--color-danger)" weight="bold" />
  }
  return <Bell size={size} color="var(--color-text-muted)" weight="bold" />
}

function notifIconBg(title: string) {
  const t = title.toLowerCase()
  if (t.includes('aanvraag') || t.includes('toegevoegd')) return 'var(--color-primary-pale)'
  if (t.includes('betaling') || t.includes('periode')) return 'var(--color-success-bg)'
  if (t.includes('afgekeurd')) return 'var(--color-danger-bg)'
  return 'var(--color-surface-alt)'
}

function NotifItem({ n, onTap }: { n: AppNotification; onTap: (n: AppNotification) => void }) {
  return (
    <button
      onClick={() => onTap(n)}
      className="w-full flex items-start gap-3 px-5 py-3.5 text-left active:opacity-70 transition-opacity"
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: n.is_read ? 'transparent' : 'var(--color-primary-pale)',
      }}
    >
      <div
        className="mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
        style={{ background: notifIconBg(n.title) }}
      >
        <NotifIcon title={n.title} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
            {n.title}
          </p>
          <span className="mt-0.5 shrink-0 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] font-medium leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
          {n.body}
        </p>
      </div>
      {!n.is_read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--color-primary)' }} />
      )}
    </button>
  )
}

interface Props {
  onClose: () => void
}

export function NotificationsSheet({ onClose }: Props) {
  const navigate = useNavigate()
  const { data: notifications, isLoading, unreadCount, markAllRead, markRead } = useNotifications()

  async function handleTap(notification: AppNotification) {
    await markRead(notification.id)
    onClose()
    if (notification.url && notification.url !== '/') {
      navigate(notification.url)
    }
  }

  return (
    <Drawer open onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DrawerContent
        className="rounded-t-[24px] px-0"
        style={{ background: 'var(--color-surface)', maxHeight: 'var(--drawer-max-height-compact)' }}
      >
        <DrawerHeader className="flex items-center justify-between border-b border-[var(--color-border)] pb-3.5">
          <div>
            <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>Meldingen</DrawerTitle>
            {unreadCount > 0 && (
              <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
                {unreadCount} ongelezen
              </DrawerDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-bold active:scale-95 transition-transform"
                style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}
              >
                <CheckCircle size={13} weight="fill" />
                Alles gelezen
              </button>
            )}
            <DrawerClose asChild>
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ background: 'var(--color-surface-alt)' }}
              >
                <X size={16} color="var(--color-text-secondary)" weight="bold" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="size-6" style={{ color: 'var(--color-primary)' }} />
            </div>
          )}

          {!isLoading && (notifications ?? []).length === 0 && (
            <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
              <div
                className="mb-3 h-14 w-14 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-surface-alt)' }}
              >
                <Bell size={24} color="var(--color-text-muted)" />
              </div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Geen meldingen
              </p>
              <p className="mt-1 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Je hebt nog geen meldingen ontvangen.
              </p>
            </div>
          )}

          {(notifications ?? []).map((notification) => (
            <NotifItem key={notification.id} n={notification} onTap={handleTap} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
