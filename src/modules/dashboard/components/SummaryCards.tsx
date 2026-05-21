import { ArrowUpCircle, ArrowDownCircle, Wallet, Lock, Unlock } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency } from '@/lib/format'

interface SummaryData {
  income: number
  expense: number
  committed: number
}

interface SummaryCardsProps {
  data: SummaryData
  loading?: boolean
}

export function SummaryCards({ data, loading }: SummaryCardsProps) {
  const available = data.income - data.expense
  const free = available - data.committed

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-border/60"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={<ArrowUpCircle className="h-5 w-5" />}
        label="Entradas"
        value={formatCurrency(data.income)}
        variant="success"
      />
      <StatCard
        icon={<ArrowDownCircle className="h-5 w-5" />}
        label="Saídas"
        value={formatCurrency(data.expense)}
        variant="danger"
      />
      <StatCard
        icon={<Wallet className="h-5 w-5" />}
        label="Saldo disponível"
        value={formatCurrency(available)}
        variant={available >= 0 ? 'success' : 'danger'}
      />
      <StatCard
        icon={<Lock className="h-5 w-5" />}
        label="Comprometido"
        value={formatCurrency(data.committed)}
        variant="warning"
      />
      <StatCard
        icon={<Unlock className="h-5 w-5" />}
        label="Saldo livre"
        value={formatCurrency(free)}
        variant={free >= 0 ? 'default' : 'danger'}
      />
    </div>
  )
}
