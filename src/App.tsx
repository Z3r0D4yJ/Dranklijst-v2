import { useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import { BottomNav } from './components/BottomNav'
import { AdminLayout } from './components/AdminLayout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { JoinGroup } from './pages/auth/JoinGroup'
import { JoinViaCode } from './pages/auth/JoinViaCode'
import { Home } from './pages/user/Home'
import { Transactions } from './pages/user/Transactions'
import { Leaderboard } from './pages/user/Leaderboard'
import { Profile } from './pages/user/Profile'
import { GroupManagement } from './pages/leiding/GroupManagement'
import { GroupTransactions } from './pages/leiding/GroupTransactions'
import { Periods } from './pages/admin/Periods'
import { Finance } from './pages/admin/Finance'
import { Consumptions } from './pages/admin/Consumptions'
import { Users } from './pages/admin/Users'
import { Dashboard } from './pages/admin/Dashboard'
import { AllTransactions } from './pages/admin/AllTransactions'
import { Groups } from './pages/admin/Groups'
import { PWAGate } from './components/PWAGate'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnMount: true,
    },
  },
})

function SonnerToaster() {
  const { mode } = useTheme()
  const isDark = mode === 'dark' || (mode === 'system' && document.documentElement.classList.contains('dark'))
  return (
    <Toaster
      theme={isDark ? 'dark' : 'light'}
      position="top-center"
      offset={16}
      gap={8}
      toastOptions={{
        classNames: {
          toast:   'dl-toast',
          error:   'dl-toast-error',
          success: 'dl-toast-success',
          warning: 'dl-toast-warning',
        },
      }}
    />
  )
}

function scrollWindowToTop() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const scrollRoot = document.scrollingElement ?? document.documentElement
  scrollRoot.scrollTop = 0
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

function clampWindowScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const scrollRoot = document.scrollingElement ?? document.documentElement
  const maxScroll = Math.max(0, scrollRoot.scrollHeight - window.innerHeight)

  if (maxScroll <= 1) {
    scrollWindowToTop()
    return
  }

  if (window.scrollY > maxScroll) {
    window.scrollTo({ top: maxScroll, left: 0, behavior: 'auto' })
  }
}

function scheduleScrollSync(mode: 'top' | 'clamp') {
  const sync = mode === 'top' ? scrollWindowToTop : clampWindowScroll

  sync()
  requestAnimationFrame(sync)
  window.setTimeout(sync, 80)
  window.setTimeout(sync, 240)
}

function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return

    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useLayoutEffect(() => {
    scheduleScrollSync('top')
  }, [pathname, search])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) scheduleScrollSync('top')
      else scheduleScrollSync('clamp')
    }

    const handleViewportChange = () => {
      scheduleScrollSync('clamp')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleScrollSync('clamp')
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleViewportChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleViewportChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('scroll', handleViewportChange)
    }
  }, [])

  return null
}

function PendingInviteHandler() {
  const { session } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!session) return
    const code = sessionStorage.getItem('pendingInviteCode')
    if (!code) return
    sessionStorage.removeItem('pendingInviteCode')
    navigate(`/join/${code}`, { replace: true })
  }, [session])
  return null
}

function AppLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PWAGate>
          <SonnerToaster />
          <ScrollToTop />
          <PendingInviteHandler />
          <Routes>
            {/* Publieke routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Join via invite link — public, handles auth state internally */}
            <Route path="/join/:code" element={<JoinViaCode />} />

            {/* Join group via code input */}
            <Route element={<ProtectedRoute />}>
              <Route path="/join-group" element={<JoinGroup />} />
            </Route>

            {/* Gebruiker routes met bottom nav */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Leiding routes */}
            <Route element={<ProtectedRoute minRole="leiding" />}>
              <Route element={<AppLayout />}>
                <Route path="/leiding/groep" element={<GroupManagement />} />
                <Route path="/leiding/transacties" element={<GroupTransactions />} />
              </Route>
            </Route>

            {/* Kas routes */}
            <Route element={<ProtectedRoute minRole="kas" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="transacties" element={<AllTransactions />} />
                <Route path="groepen" element={<Groups />} />
                <Route path="periodes" element={<Periods />} />
                <Route path="financieel" element={<Finance />} />
                <Route path="consumpties" element={<Consumptions />} />
                <Route path="gebruikers" element={<Users />} />
              </Route>
            </Route>
          </Routes>
          </PWAGate>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
