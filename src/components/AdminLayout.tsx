import { Outlet, NavLink } from 'react-router-dom'
import { CalendarBlank, CurrencyEur, Package, Users, ChartBar, Receipt, Rows } from '@phosphor-icons/react'
import { useThemeColor } from '../hooks/useThemeColor'
import { BottomNav } from './BottomNav'

export function AdminLayout() {
  useThemeColor('--color-surface')

  const base = 'flex items-center gap-1.5 px-1 pb-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors'
  const activeStyle = { color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }
  const inactiveStyle = { color: 'var(--color-text-muted)', borderBottom: '2px solid transparent' }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg)' }}>
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 0' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] pb-4" style={{ color: 'var(--color-text-primary)' }}>Beheer</h1>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-0">
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
          <NavLink to="/admin/consumpties" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <Package size={16} />Consumpties
          </NavLink>
          <NavLink to="/admin/gebruikers" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
            <Users size={16} />Gebruikers
          </NavLink>
        </div>
      </div>
      <div className="mt-5 pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
