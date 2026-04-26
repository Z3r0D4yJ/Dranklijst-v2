import { NavLink, useNavigate } from 'react-router-dom'
import { House, Receipt, Trophy, User, Plus } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

export function BottomNav() {
  const navigate = useNavigate()

  const navItem = (to: string, end: boolean, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-full flex-1 flex-col items-center justify-start gap-1 pt-3 pb-4 transition-colors ${
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)]'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </NavLink>
  )

  if (typeof document === 'undefined') return null

  return createPortal(
    <nav
      className="fixed left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-stretch px-2"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) * -1)',
        height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {navItem('/', true,           <House size={22} />,   'Home')}
      {navItem('/transactions', false, <Receipt size={22} />, 'Transacties')}

      {/* FAB — centre slot */}
      <div className="flex h-full flex-col items-center justify-start flex-1 pt-1">
        <button
          onClick={() => navigate('/')}
          className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center active:scale-95 transition-transform -mt-[25px]"
          style={{ boxShadow: 'var(--shadow-fab)' }}
          aria-label="Kopen"
        >
          <Plus size={22} color="white" weight="bold" />
        </button>
      </div>

      {navItem('/leaderboard', false, <Trophy size={22} />, 'Top')}
      {navItem('/profile', false,     <User size={22} />,   'Profiel')}
    </nav>,
    document.body,
  )
}
