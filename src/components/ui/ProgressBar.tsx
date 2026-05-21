interface ProgressBarProps {
  value: number
  max: number
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function ProgressBar({
  value,
  max,
  size = 'md',
  showLabel = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div
          className={`w-full overflow-hidden rounded-full bg-accent-light ${
            size === 'sm' ? 'h-1.5' : 'h-2.5'
          }`}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {showLabel && (
        <span className="flex-shrink-0 text-xs font-medium text-text-muted font-mono">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
