import { useNavigate } from 'react-router-dom'
import type { FC } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import { Bell, CheckCircle, Users, CurrencyEur, Warning } from '@phosphor-icons/react'
import { IconChip, type IconChipTone } from './IconChip'
import { useNotifications, type AppNotification } from '../hooks/useNotifications'
import { Spinner } from './ui/spinner'
import { ActionPillButton } from './ui/action-button'
import { AdminFormDrawer } from './AdminFormDrawer'
import { EmptyState } from './AdminThemePrimitives'

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

function notifChipProps(title: string): { tone: IconChipTone; icon: FC<IconProps> } {
  const t = title.toLowerCase()
  if (t.includes('aanvraag') || t.includes('toegevoegd')) return { tone: 'primary', icon: Users }
  if (t.includes('betaling') || t.includes('periode')) return { tone: 'success', icon: CurrencyEur }
  if (t.includes('afgekeurd')) return { tone: 'danger', icon: Warning }
  return { tone: 'neutral', icon: Bell }
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
      <IconChip {...notifChipProps(n.title)} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
            {n.title}
          </p>
          <span className="mt-0.5 shrink-0 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
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

  const hasNotifications = (notifications ?? []).length > 0

  return (
    <AdminFormDrawer
      open
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Meldingen"
      description={unreadCount > 0 ? `${unreadCount} ongelezen` : undefined}
      maxHeight="var(--drawer-max-height-compact)"
      bodyClassName="px-0 py-0"
      footer={
        unreadCount > 0 ? (
          <ActionPillButton
            onClick={markAllRead}
            variant="primary-soft"
            size="md"
            className="w-full"
          >
            <CheckCircle size={14} color="currentColor" weight="fill" />
            Alles gelezen
          </ActionPillButton>
        ) : undefined
      }
    >
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="size-6" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {!isLoading && !hasNotifications && (
        <div className="px-5 py-5">
          <EmptyState
            icon={Bell}
            tone="neutral"
            title="Geen meldingen"
            description="Je hebt nog geen meldingen ontvangen."
          />
        </div>
      )}

      {hasNotifications && (notifications ?? []).map((notification) => (
        <NotifItem key={notification.id} n={notification} onTap={handleTap} />
      ))}
    </AdminFormDrawer>
  )
}
