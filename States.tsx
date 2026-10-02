import type { ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { errorMessage } from '@/api/client'
import { Button } from './Button'
import { Skeleton, Spinner } from './Primitives'

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, title = 'Something went wrong', onRetry }: { error?: unknown; title?: string; onRetry?: () => void }) {
  return (
    <div className="empty empty--error" role="alert">
      <div className="empty__icon"><AlertTriangle size={22} aria-hidden /></div>
      <h3>{title}</h3>
      <p className="muted">{error ? errorMessage(error) : 'Please try again.'}</p>
      {onRetry && (
        <div className="empty__action">
          <Button icon={<RotateCcw size={15} />} onClick={onRetry}>Retry</Button>
        </div>
      )}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="stack" aria-busy="true">
      <Skeleton height={34} width="40%" />
      <Skeleton height={16} width="60%" />
      <div className="grid grid--3">
        <Skeleton height={140} radius={18} />
        <Skeleton height={140} radius={18} />
        <Skeleton height={140} radius={18} />
      </div>
    </div>
  )
}

export function SplashScreen() {
  return (
    <div className="splash"><Spinner label="Loading QuantumLearn" /></div>
  )
}
