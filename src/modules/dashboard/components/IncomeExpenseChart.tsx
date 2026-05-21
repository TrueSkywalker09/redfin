import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface IncomeExpenseChartProps {
  data: MonthlyData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
        <p className="mb-2 text-xs font-medium text-text-muted">{label}</p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            className="text-sm font-medium"
            style={{ color: entry.color }}
          >
            {entry.name === 'income' ? 'Entradas' : 'Saídas'}:{' '}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-surface">
        <p className="text-sm text-text-muted">
          Nenhum dado disponível para o período.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Entradas vs. Saídas
      </h3>
      <div role="img" aria-label="Gráfico de barras comparando entradas e saídas mensais" className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#7A7875' }}
            axisLine={{ stroke: '#E2E0DC' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#7A7875' }}
            axisLine={{ stroke: '#E2E0DC' }}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) =>
              value === 'income' ? 'Entradas' : 'Saídas'
            }
          />
          <Bar
            dataKey="income"
            fill="#2E7D5E"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="expense"
            fill="#C0392B"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
