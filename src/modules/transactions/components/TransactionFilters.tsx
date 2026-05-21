import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import type { Category } from '@/lib/types'

interface TransactionFiltersProps {
  categories: Category[]
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  search: string
  type: '' | 'income' | 'expense'
  categoryId: string
  startDate: string
  endDate: string
}

export function TransactionFilters({
  categories,
  onFilterChange,
}: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  function updateFilters(partial: Partial<FilterState>) {
    const next = { ...filters, ...partial }
    setFilters(next)
    onFilterChange(next)
  }

  function clearFilters() {
    const cleared = {
      search: '',
      type: '' as const,
      categoryId: '',
      startDate: '',
      endDate: '',
    }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  const hasActiveFilters =
    filters.type || filters.categoryId || filters.startDate || filters.endDate

  return (
    <div className="mb-4 space-y-3">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Buscar por descrição..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-accent bg-accent-light text-accent'
              : 'border-border text-text-muted hover:bg-accent-light/50'
          }`}
          aria-label="Filtros"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                updateFilters({ type: e.target.value as FilterState['type'] })
              }
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">Todos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              De
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilters({ startDate: e.target.value })}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Até
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilters({ endDate: e.target.value })}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Categoria
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) =>
                updateFilters({ categoryId: e.target.value })
              }
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-text-muted hover:text-danger transition-colors"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
