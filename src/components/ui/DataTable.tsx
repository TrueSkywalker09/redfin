import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  sortable?: boolean
  className?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onSort?: (key: string) => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'Nenhum registro encontrado.',
  loading,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-border/60" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-lg bg-border/40"
          />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-12 text-center">
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface" role="region" aria-label="Tabela de dados">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent-light/50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                tabIndex={col.sortable ? 0 : undefined}
                role="columnheader"
                aria-sort={
                  col.sortable && sortKey === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted ${
                  col.sortable ? 'cursor-pointer select-none hover:text-text-primary' : ''
                } ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className || ''}`}
                onClick={() => {
                  if (col.sortable && onSort) onSort(col.key)
                }}
                onKeyDown={(e) => {
                  if (col.sortable && (e.key === 'Enter' || e.key === ' ') && onSort) {
                    e.preventDefault()
                    onSort(col.key)
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex flex-col">
                      {sortKey === col.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item) => (
            <tr
              key={item.id}
              className="transition-colors hover:bg-accent-light/30"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className || ''}`}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
