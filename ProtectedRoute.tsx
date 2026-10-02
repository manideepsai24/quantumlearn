import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { ErrorState, SplashScreen } from '@/components/ui/States'
import { Button } from '@/components/ui/Button'
import type { Role } from '@/types'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const status = useAuth((s) => s.status)
  const user = useAuth((s) => s.user)
  const restore = useAuth((s) => s.restore)
  const location = useLocation()

  useEffect(() => {
    if (status === 'idle') void restore()
  }, [status, restore])

  if (status === 'idle' || status === 'loading') return <SplashScreen />
  if (status === 'offline') {
    return (
      <div className="splash">
        <ErrorState
          title="Can’t reach QuantumLearn"
          error={new Error('offline')}
          onRetry={() => void restore()}
        />
      </div>
    )
  }
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page">
        <div className="empty">
          <h3>You don’t have access to this page</h3>
          <p className="muted">This area is for {roles.join(' / ')} accounts. The server enforces this too.</p>
          <div className="empty__action"><Button onClick={() => history.back()}>Go back</Button></div>
        </div>
      </div>
    )
  }
  return <Outlet />
}

export function PublicOnly() {
  const status = useAuth((s) => s.status)
  const restore = useAuth((s) => s.restore)
  useEffect(() => {
    if (status === 'idle') void restore()
  }, [status, restore])
  if (status === 'idle' || status === 'loading') return <SplashScreen />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
