import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../lib/database.types'

const ROLE_RANK: Record<Role, number> = {
  lid: 1,
  leiding: 2,
  kas: 3,
}

interface Props {
  minRole?: Role
}

export function ProtectedRoute({ minRole = 'lid' }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (profile && ROLE_RANK[profile.role] < ROLE_RANK[minRole]) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
