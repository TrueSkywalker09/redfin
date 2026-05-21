import type { ReactNode } from 'react'

interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
}

const variants = {
  default: 'bg-gray-100 text-text-muted',
  success: 'bg-green-100 text-success',
  warning: 'bg-amber-100 text-warning',
  danger: 'bg-red-100 text-danger',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
