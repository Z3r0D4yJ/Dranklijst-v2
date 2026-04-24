import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../lib/database.types'
import { Spinner } from './ui/spinner'

const ROLE_RANK: Record<string, number> = {
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Spinner className="size-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />

  const currentRank = ROLE_RANK[profile.role] ?? 0
  const requiredRank = ROLE_RANK[minRole] ?? 0

  if (currentRank < requiredRank) return <Navigate to="/" replace />

  return <Outlet />
}
