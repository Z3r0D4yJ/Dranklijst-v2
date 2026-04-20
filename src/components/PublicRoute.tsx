import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui/spinner'

export function PublicRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Spinner className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (session) return <Navigate to="/" replace />

  return <Outlet />
}
