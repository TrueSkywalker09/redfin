import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

interface CategoryData {
  name: string
  value: number
  color: string
}

interface CategoryPieChartProps {
  data: CategoryData[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
        <p className="text-sm font-medium" style={{ color: payload[0].payload.color }}>
          {payload[0].name}
        </p>
        <p className="text-sm font-semibold text-text-primary">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-xs text-text-muted">
          {(
            (payload[0].value / payload[0].payload.total) *
            100
          ).toFixed(1)}
          %
        </p>
      </div>
    )
  }
  return null
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithTotal = data.map((item) => ({ ...item, total }))

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-surface">
        <p className="text-sm text-text-muted">
          Nenhum gasto no período.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Gastos por categoria
      </h3>
      <div role="img" aria-label="Gráfico de pizza mostrando gastos por categoria">
        <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-text-muted">{value}</span>
            )}
          />
        </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
