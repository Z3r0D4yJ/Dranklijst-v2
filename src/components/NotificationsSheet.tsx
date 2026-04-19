import { useNavigate } from 'react-router-dom'
import { X, Bell, CheckCircle, Users, CurrencyEur, Warning } from '@phosphor-icons/react'
import { useNotifications, type AppNotification } from '../hooks/useNotifications'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Zojuist'
  if (m < 60) return `${m}m geleden`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}u geleden`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d geleden`
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
}

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase()
  const size = 18
  if (t.includes('aanvraag') || t.includes('toegevoegd'))
    return <Users size={size} color="var(--color-primary)" weight="bold" />
  if (t.includes('betaling') || t.includes('periode'))
    return <CurrencyEur size={size} color="var(--color-success)" weight="bold" />
  if (t.includes('afgekeurd'))
    return <Warning size={size} color="var(--color-danger)" weight="bold" />
  return <Bell size={size} color="var(--color-text-muted)" weight="bold" />
}

function NotifIconBg({ title }: { title: string }) {
  const t = title.toLowerCase()
  if (t.includes('aanvraag') || t.includes('toegevoegd')) return 'var(--color-primary-pale)'
  if (t.includes('betaling') || t.includes('periode'))    return 'var(--color-success-bg)'
  if (t.includes('afgekeurd'))                            return 'var(--color-danger-bg)'
  return 'var(--color-surface-alt)'
}

function NotifItem({ n, onTap }: { n: AppNotification; onTap: (n: AppNotification) => void }) {
  return (
    <button
      onClick={() => onTap(n)}
      className="w-full flex items-start gap-3 px-5 py-3.5 text-left active:opacity-70 transition-opacity"
      style={{ borderBottom: '1px solid var(--color-border)', background: n.is_read ? 'transparent' : 'var(--color-primary-pale)' }}
    >
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: NotifIconBg({ title: n.title }) }}
      >
        <NotifIcon title={n.title} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
          <span className="text-[11px] shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(n.created_at)}</span>
        </div>
        <p className="text-[12px] font-medium mt-0.5 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{n.body}</p>
      </div>
      {!n.is_read && (
        <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--color-primary)' }} />
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

  async function handleTap(n: AppNotification) {
    await markRead(n.id)
    onClose()
    if (n.url && n.url !== '/') navigate(n.url)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{
          background: 'var(--color-surface)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-border-mid)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3.5 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-[-0.3px]" style={{ color: 'var(--color-text-primary)' }}>Meldingen</h2>
            {unreadCount > 0 && (
              <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{unreadCount} ongelezen</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold active:scale-95 transition-transform"
                style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}
              >
                <CheckCircle size={13} weight="fill" />
                Alles gelezen
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'var(--color-surface-alt)' }}
            >
              <X size={16} color="var(--color-text-secondary)" weight="bold" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!isLoading && (notifications ?? []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-surface-alt)' }}>
                <Bell size={24} color="var(--color-text-muted)" />
              </div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Geen meldingen</p>
              <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>Je hebt nog geen meldingen ontvangen.</p>
            </div>
          )}

          {(notifications ?? []).map(n => (
            <NotifItem key={n.id} n={n} onTap={handleTap} />
          ))}
        </div>
      </div>
    </>
  )
}
