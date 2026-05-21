import { useState, useEffect } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateShort } from '@/lib/format'
import type { FixedBill } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'

export function UpcomingBills() {
  const profile = useAuthStore((s) => s.profile)
  const [upcoming, setUpcoming] = useState<
    { bill: FixedBill; dueDate: Date }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      if (!profile?.household_id) return

      const today = new Date()
      const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const { data: bills } = await supabase
        .from('fixed_bills')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('is_active', true)

      if (!bills) {
        setLoading(false)
        return
      }

      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      const upcomingBills = bills
        .map((bill) => {
          let dueDate = new Date(currentYear, currentMonth, bill.due_day)
          if (dueDate < today) {
            dueDate = new Date(currentYear, currentMonth + 1, bill.due_day)
          }
          return { bill, dueDate }
        })
        .filter(({ dueDate }) => dueDate >= today && dueDate <= sevenDays)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

      setUpcoming(upcomingBills)
      setLoading(false)
    }

    fetch()
  }, [profile?.household_id])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-border/60" />
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded bg-border/40" />
          <div className="h-10 animate-pulse rounded bg-border/40" />
        </div>
      </div>
    )
  }

  if (upcoming.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">
          Próximos 7 dias
        </h3>
        <Badge variant="info">{upcoming.length} contas</Badge>
      </div>
      <div className="space-y-2">
        {upcoming.map(({ bill, dueDate }) => {
          const isToday =
            dueDate.toDateString() === new Date().toDateString()
          const isOverdue = dueDate < new Date()

          return (
            <div
              key={bill.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                isOverdue
                  ? 'bg-red-50'
                  : isToday
                    ? 'bg-amber-50'
                    : 'bg-bg'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex-shrink-0 text-xs font-mono font-medium ${
                    isOverdue
                      ? 'text-danger'
                      : isToday
                        ? 'text-warning'
                        : 'text-text-muted'
                  }`}
                >
                  {isToday
                    ? 'Hoje'
                    : formatDateShort(dueDate)}
                </span>
                <span className="text-sm text-text-primary truncate">
                  {bill.name}
                </span>
              </div>
              <span className="text-sm font-medium text-text-primary font-mono flex-shrink-0 ml-3">
                {formatCurrency(bill.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
