import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthYear } from '@/lib/format'

interface MonthSelectorProps {
  currentDate: Date
  onChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onChange }: MonthSelectorProps) {
  function navigate(delta: number) {
    onChange(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + delta,
        1
      )
    )
  }

  function goToCurrent() {
    onChange(new Date())
  }

  const isCurrent =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear()

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-text-primary transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-text-primary">
          {formatMonthYear(currentDate)}
        </h2>
        <button
          onClick={() => navigate(1)}
          className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-text-primary transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      {!isCurrent && (
        <button
          onClick={goToCurrent}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors"
        >
          Mês atual
        </button>
      )}
    </div>
  )
}
