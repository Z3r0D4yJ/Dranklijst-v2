import { NavLink, useNavigate } from 'react-router-dom'
import { House, Receipt, Trophy, User, Plus } from '@phosphor-icons/react'

export function BottomNav() {
  const navigate = useNavigate()

  const navItem = (to: string, end: boolean, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center px-2 pb-safe h-[72px]">
      {navItem('/', true,           <House size={22} />,   'Home')}
      {navItem('/transactions', false, <Receipt size={22} />, 'Transacties')}

      {/* FAB — centre slot */}
      <div className="flex flex-col items-center flex-1">
        <button
          onClick={() => navigate('/')}
          className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center active:scale-95 transition-transform -mt-[22px]"
          style={{ boxShadow: 'var(--shadow-fab)' }}
          aria-label="Kopen"
        >
          <Plus size={22} color="white" weight="bold" />
        </button>
      </div>

      {navItem('/leaderboard', false, <Trophy size={22} />, 'Top')}
      {navItem('/profile', false,     <User size={22} />,   'Profiel')}
    </nav>
  )
}
