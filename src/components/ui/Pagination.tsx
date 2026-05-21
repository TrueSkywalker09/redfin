import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-accent-light/50 hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>
      <span className="text-sm text-text-muted">
        Página {page} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-accent-light/50 hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Próximo
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
