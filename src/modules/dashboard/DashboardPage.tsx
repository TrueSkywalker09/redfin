import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Transaction, FixedBill, Installment, Project } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { MonthSelector } from './components/MonthSelector'
import { SummaryCards } from './components/SummaryCards'
import { IncomeExpenseChart } from './components/IncomeExpenseChart'
import { CategoryPieChart } from './components/CategoryPieChart'
import { UpcomingBills } from './components/UpcomingBills'
import { MONTHS } from '@/lib/constants'
import { useRealtimeSubscription } from '@/lib/useRealtime'

export function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<FixedBill[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])

  const fetchData = useCallback(async () => {
    if (!profile?.household_id) return

    setLoading(true)

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-31`

    const [transResult, allTransResult, billsResult, cardsResult, projectsResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('household_id', profile.household_id)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase
        .from('transactions')
        .select('*')
        .eq('household_id', profile.household_id)
        .gte('date', `${year - 1}-${String(month + 1).padStart(2, '0')}-01`)
        .lte('date', monthEnd)
        .order('date'),
      supabase
        .from('fixed_bills')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('is_active', true),
      supabase
        .from('credit_cards')
        .select('id')
        .eq('household_id', profile.household_id),
      supabase
        .from('projects')
        .select('*')
        .eq('household_id', profile.household_id)
        .in('status', ['active', 'paused']),
    ])

    if (transResult.data) setTransactions(transResult.data)
    if (allTransResult.data) {
      setTransactions(transResult.data || [])
      setAllTransactions(allTransResult.data)
    }
    if (billsResult.data) setBills(billsResult.data)
    if (projectsResult.data) setProjects(projectsResult.data)

    if (cardsResult.data && cardsResult.data.length > 0) {
      const cardIds = cardsResult.data.map(c => c.id)
      const { data: instData } = await supabase
        .from('installments')
        .select('*')
        .in('card_id', cardIds)
      if (instData) setInstallments(instData)
    } else {
      setInstallments([])
    }

    setLoading(false)
  }, [profile?.household_id, year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeSubscription('transactions', profile?.household_id ?? null, fetchData)
  useRealtimeSubscription('fixed_bills', profile?.household_id ?? null, fetchData)

  // Summary calculations
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Committed: fixed bills + installments for this month
  const fixedCommitted = bills.reduce((sum, b) => sum + Number(b.amount), 0)
  const installmentCommitted = installments
    .filter((inst) => {
      const firstCharge = new Date(inst.first_charge_date)
      const monthsSinceFirst =
        (year - firstCharge.getFullYear()) * 12 +
        (month - firstCharge.getMonth())
      return monthsSinceFirst >= 0 && monthsSinceFirst < inst.total_installments
    })
    .reduce((sum, inst) => sum + inst.total_amount / inst.total_installments, 0)

  const committed = fixedCommitted + installmentCommitted

  // Chart data: last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 5 + i, 1)
    const label = `${MONTHS[d.getMonth()].slice(0, 3)}/${d.getFullYear()}`
    const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const mEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-31`

    const monthTx = allTransactions.filter(
      (t) => t.date >= mStart && t.date <= mEnd
    )
    const inc = monthTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)
    const exp = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)

    return { month: label, income: inc, expense: exp }
  })

  // Category data for pie chart
  const [catMap, setCatMap] = useState<Record<string, { name: string; color: string }>>({})

  useEffect(() => {
    if (!profile?.household_id) return
    supabase
      .from('categories')
      .select('id, name, color')
      .eq('household_id', profile.household_id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, { name: string; color: string }> = {}
          data.forEach((c) => {
            map[c.id] = {
              name: c.name,
              color: c.color || '#7A7875',
            }
          })
          setCatMap(map)
        }
      })
  }, [profile?.household_id])

  const expenseByCategory: Record<
    string,
    { name: string; value: number; color: string }
  > = {}

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const catInfo = catMap[t.category_id || ''] || { name: 'Sem categoria', color: '#7A7875' }
      if (!expenseByCategory[t.category_id || '']) {
        expenseByCategory[t.category_id || ''] = {
          name: catInfo.name,
          value: 0,
          color: catInfo.color,
        }
      }
      expenseByCategory[t.category_id || ''].value += Number(t.amount)
    })

  const categoryData = Object.values(expenseByCategory).sort(
    (a, b) => b.value - a.value
  )

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumo financeiro do período"
      />

      <div className="mb-6">
        <MonthSelector currentDate={currentDate} onChange={setCurrentDate} />
      </div>

      <div className="mb-6">
        <SummaryCards
          data={{ income, expense, committed }}
          loading={loading}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart data={chartData} />
        <CategoryPieChart data={categoryData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingBills />
        {/* Projects progress */}
        {projects.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Projetos em andamento
            </h3>
            <div className="space-y-3">
              {projects.map((project) => {
                const progress =
                  project.target_amount > 0
                    ? Math.min(
                        (Number(project.current_amount) /
                          Number(project.target_amount)) *
                          100,
                        100
                      )
                    : 0
                return (
                  <div key={project.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-text-primary truncate">
                        {project.name}
                      </span>
                      <span className="text-text-muted font-mono text-xs">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent-light">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


