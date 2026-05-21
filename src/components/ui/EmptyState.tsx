import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
        {icon || <Inbox className="h-6 w-6 text-accent" />}
      </div>
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
