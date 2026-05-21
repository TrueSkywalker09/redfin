import { type ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
  variant?: 'default' | 'success' | 'danger' | 'warning'
}

const variantStyles = {
  default: 'bg-accent-light/50',
  success: 'bg-green-50',
  danger: 'bg-red-50',
  warning: 'bg-amber-50',
}

const iconStyles = {
  default: 'text-accent',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
}

export function StatCard({
  icon,
  label,
  value,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-semibold text-text-primary font-mono tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${variantStyles[variant]} ${iconStyles[variant]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
