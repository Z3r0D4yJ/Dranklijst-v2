import { Outlet, NavLink } from 'react-router-dom'
import { CalendarBlank, CurrencyEur, Package, Users, ChartBar, Receipt, Rows } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useThemeColor } from '../hooks/useThemeColor'
import { BottomNav } from './BottomNav'

export function AdminLayout() {
  useThemeColor('--color-bg')
  const { profile } = useAuth()
  const role = profile?.role ?? ''
  const isAdmin = role === 'admin'
  const isKas = role === 'kas' || isAdmin
  const isGroepsleiding = role === 'groepsleiding' || isAdmin
  const canSeeAll = isKas || isGroepsleiding

  const base = 'flex items-center gap-1.5 px-1 pb-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors'
  const activeStyle = { color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }
  const inactiveStyle = { color: 'var(--color-text-muted)', borderBottom: '2px solid transparent' }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg)' }}>
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '14px 20px 0' }}>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] pb-4" style={{ color: 'var(--color-text-primary)' }}>Beheer</h1>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-0">
          {canSeeAll && (
            <NavLink to="/admin/dashboard" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <ChartBar size={16} />Dashboard
            </NavLink>
          )}
          {canSeeAll && (
            <NavLink to="/admin/transacties" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <Receipt size={16} />Transacties
            </NavLink>
          )}
          {canSeeAll && (
            <NavLink to="/admin/groepen" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <Rows size={16} />Groepen
            </NavLink>
          )}
          {isKas && (
            <NavLink to="/admin/periodes" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <CalendarBlank size={16} />Periodes
            </NavLink>
          )}
          {isKas && (
            <NavLink to="/admin/financieel" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <CurrencyEur size={16} />Financieel
            </NavLink>
          )}
          {(isAdmin || isGroepsleiding) && (
            <NavLink to="/admin/consumpties" className={base} style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <Package size={16} />Consumpties
            </NavLink>
          )}
          {(isAdmin || isGroepsleiding) && (
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
