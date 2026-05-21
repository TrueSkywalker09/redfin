interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-border/60 ${className}`}
        />
      ))}
    </>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-7 w-28" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
