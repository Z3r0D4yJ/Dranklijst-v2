import { useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { CalendarBlank, CurrencyEur, Package, Users, ChartBar, Receipt, Rows } from '@phosphor-icons/react'
import { useThemeColor } from '../hooks/useThemeColor'
import { useAuth } from '../context/AuthContext'
import { useSwipe } from '../hooks/useSwipe'
import { BottomNav } from './BottomNav'

export function AdminLayout() {
  useThemeColor('--color-surface')
  const { profile } = useAuth()
  const role = profile?.role as string | undefined
  const canManageAdminTabs = role === 'kas' || role === 'groepsleiding' || role === 'admin'

  const navigate = useNavigate()
  const location = useLocation()
  const tabBarRef = useRef<HTMLDivElement>(null)

  const tabs = [
    { to: '/admin/dashboard' },
    { to: '/admin/transacties' },
    { to: '/admin/groepen' },
    { to: '/admin/periodes' },
    { to: '/admin/financieel' },
    ...(canManageAdminTabs ? [{ to: '/admin/consumpties' }, { to: '/admin/gebruikers' }] : []),
  ]

  const currentIndex = tabs.findIndex(t => location.pathname.startsWith(t.to))

  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (currentIndex < tabs.length - 1) navigate(tabs[currentIndex + 1].to)
    },
    onSwipeRight: () => {
      if (currentIndex > 0) navigate(tabs[currentIndex - 1].to)
    },
  })

  useEffect(() => {
    const bar = tabBarRef.current
    if (!bar) return
    const active = bar.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [location.pathname])

  const base = 'flex items-center gap-1.5 px-1 pb-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors'
  const activeStyle = { color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }
  const inactiveStyle = { color: 'var(--color-text-muted)', borderBottom: '2px solid transparent' }

  return (
    <div
      className="min-h-screen pb-8"
      style={{ background: 'var(--color-bg)' }}
      {...swipe}
    >
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 0' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] pb-4" style={{ color: 'var(--color-text-primary)' }}>Beheer</h1>
        <div ref={tabBarRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-0">
          <NavLink to="/admin/dashboard" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <ChartBar size={16} />Dashboard
          </NavLink>
          <NavLink to="/admin/transacties" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <Receipt size={16} />Transacties
          </NavLink>
          <NavLink to="/admin/groepen" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <Rows size={16} />Groepen
          </NavLink>
          <NavLink to="/admin/periodes" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <CalendarBlank size={16} />Periodes
          </NavLink>
          <NavLink to="/admin/financieel" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <CurrencyEur size={16} />Financieel
          </NavLink>
          {canManageAdminTabs && (
            <NavLink to="/admin/consumpties" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <Package size={16} />Consumpties
            </NavLink>
          )}
          {canManageAdminTabs && (
            <NavLink to="/admin/gebruikers" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <Users size={16} />Gebruikers
            </NavLink>
          )}
        </div>
      </div>
      <div className="mt-5 pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
