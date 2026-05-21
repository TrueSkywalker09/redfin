import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import type { FixedBill, FixedBillPayment, Category } from '@/lib/types'
import { FixedBillCard } from './FixedBillCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

interface MonthlyFixedPanelProps {
  bills: FixedBill[]
  categories: Category[]
  onAdd: () => void
}

export function MonthlyFixedPanel({
  bills,
  categories,
  onAdd,
}: MonthlyFixedPanelProps) {
  const profile = useAuthStore((s) => s.profile)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [payments, setPayments] = useState<FixedBillPayment[]>([])
  const [loading, setLoading] = useState(false)

  const referenceMonth = currentMonth.toISOString().split('T')[0]

  const fetchPayments = useCallback(async () => {
    if (!profile?.household_id) return
    setLoading(true)

    const { data } = await supabase
      .from('fixed_bill_payments')
      .select('*')
      .eq('reference_month', referenceMonth)

    if (data) setPayments(data)
    setLoading(false)
  }, [profile?.household_id, referenceMonth])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  function getPaymentStatus(
    bill: FixedBill
  ): 'paid' | 'pending' | 'overdue' {
    const payment = payments.find((p) => p.fixed_bill_id === bill.id)
    if (payment?.paid_at) return 'paid'

    const today = new Date()
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

    if (bill.start_date) {
      const billStart = new Date(bill.start_date)
      if (billStart > monthStart) return 'pending'
    }

    const dueDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      bill.due_day
    )
    if (dueDate < today) return 'overdue'
    return 'pending'
  }

  function navigateMonth(delta: number) {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1)
    )
  }

  function shouldShowBill(bill: FixedBill): boolean {
    if (!bill.is_active) return false
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    if (bill.start_date) {
      const billStart = new Date(bill.start_date)
      if (billStart > monthStart) return false
    }
    return true
  }

  const activeBills = bills.filter(shouldShowBill)
  const totalMonth = activeBills.reduce((sum, b) => sum + Number(b.amount), 0)
  const paidTotal = activeBills
    .filter((b) => getPaymentStatus(b) === 'paid')
    .reduce((sum, b) => sum + Number(b.amount), 0)

  return (
    <div className="space-y-4">
      {/* Month navigation + total */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-text-primary transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">
            {formatMonthYear(currentMonth)}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-text-primary transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Total do mês</p>
          <p className="text-lg font-semibold text-text-primary font-mono">
            {formatCurrency(totalMonth)}
          </p>
          {paidTotal > 0 && (
            <p className="text-xs text-success">
              {formatCurrency(paidTotal)} pagos
            </p>
          )}
        </div>
      </div>

      {/* Bills list */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" count={3} />
        </div>
      ) : activeBills.length === 0 ? (
        <EmptyState
          title="Nenhuma conta fixa"
          description="Adicione contas recorrentes como aluguel, internet, etc."
          action={
            <button
              onClick={onAdd}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar conta
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {activeBills.map((bill) => (
            <FixedBillCard
              key={bill.id}
              bill={bill}
              category={categories.find((c) => c.id === bill.category_id)}
              paymentStatus={getPaymentStatus(bill)}
              referenceMonth={referenceMonth}
              onUpdate={fetchPayments}
            />
          ))}
        </div>
      )}

      {/* Inactive bills */}
      {bills.filter((b) => !b.is_active).length > 0 && (
        <details className="rounded-xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-text-muted hover:text-text-primary">
            Contas inativas ({bills.filter((b) => !b.is_active).length})
          </summary>
          <div className="mt-3 space-y-2">
            {bills
              .filter((b) => !b.is_active)
              .map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 opacity-60"
                >
                  <div>
                    <p className="text-sm text-text-primary">{bill.name}</p>
                    <p className="text-xs text-text-muted">
                      Vencimento dia {bill.due_day}
                    </p>
                  </div>
                  <p className="text-sm font-mono text-text-muted">
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
