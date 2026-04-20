import { useEffect } from 'react'
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: 'always',
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
