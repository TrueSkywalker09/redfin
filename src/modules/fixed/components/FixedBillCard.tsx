import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/format'
import type { FixedBill, Category, BankAccount } from '@/lib/types'

interface FixedBillCardProps {
  bill: FixedBill
  category?: Category
  paymentStatus: 'paid' | 'pending' | 'overdue'
  referenceMonth: string
  onUpdate: () => void
}

export function FixedBillCard({
  bill,
  category,
  paymentStatus,
  referenceMonth,
  onUpdate,
}: FixedBillCardProps) {
  const [loading, setLoading] = useState(false)
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [showPayModal, setShowPayModal] = useState(false)

  useEffect(() => {
    if (!profile?.household_id) return
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('name')
      .then(({ data }) => {
        if (data) setBankAccounts(data)
      })
  }, [profile?.household_id])

  async function handleMarkAsPaid(
    bankAccountId: string,
    paymentDate: string
  ) {
    if (!profile?.household_id || !user) return

    setLoading(true)

    try {
      const formattedMonth = (() => {
        const [year, month] = referenceMonth.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      })()

      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          household_id: profile.household_id,
          created_by: user.id,
          type: 'expense',
          amount: bill.amount,
          description: `${bill.name} - ${formattedMonth}`,
          category_id: bill.category_id,
          date: paymentDate,
          bank_account_id: bankAccountId,
        })
        .select()
        .maybeSingle()

      if (transaction) {
        const { data: account } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', bankAccountId)
          .maybeSingle()

        if (account) {
          await supabase
            .from('bank_accounts')
            .update({ current_balance: account.current_balance - bill.amount })
            .eq('id', bankAccountId)
        }

        await supabase.from('fixed_bill_payments').insert({
          fixed_bill_id: bill.id,
          reference_month: referenceMonth,
          household_id: profile.household_id,
          paid_at: new Date().toISOString(),
          transaction_id: transaction.id,
        })
      }
    } catch (error) {
      alert('Erro ao marcar conta como paga. Tente novamente.')
    }

    setLoading(false)
    setShowPayModal(false)
    onUpdate()
  }

  const statusConfig = {
    paid: {
      icon: CheckCircle2,
      class: 'border-success/30 bg-success/5',
      badgeClass: 'bg-green-100 text-success',
      label: 'Pago',
    },
    pending: {
      icon: Clock,
      class: 'border-border bg-surface',
      badgeClass: 'bg-amber-100 text-warning',
      label: 'Pendente',
    },
    overdue: {
      icon: AlertTriangle,
      class: 'border-danger/30 bg-red-50',
      badgeClass: 'bg-red-100 text-danger',
      label: 'Vencido',
    },
  }

  const status = statusConfig[paymentStatus]
  const StatusIcon = status.icon

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors ${status.class}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
            paymentStatus === 'paid'
              ? 'bg-green-100 text-success'
              : paymentStatus === 'overdue'
                ? 'bg-red-100 text-danger'
                : 'bg-accent-light text-accent'
          }`}
        >
          <Receipt className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {bill.name}
          </p>
          <p className="text-xs text-text-muted">
            Vencimento dia {bill.due_day}
            {category ? ` · ${category.name}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary font-mono">
            {formatCurrency(bill.amount)}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.badgeClass}`}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>

        {paymentStatus !== 'paid' && (
          <button
            onClick={() => setShowPayModal(true)}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-xs font-medium text-white hover:bg-success/90 transition-colors disabled:opacity-50"
            aria-label={`Marcar ${bill.name} como pago`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pagar</span>
          </button>
        )}
      </div>

      {showPayModal && (
        <PayFixedBillModal
          bill={bill}
          bankAccounts={bankAccounts}
          referenceMonth={referenceMonth}
          onPay={handleMarkAsPaid}
          onClose={() => setShowPayModal(false)}
          loading={loading}
        />
      )}
    </div>
  )
}

interface PayFixedBillModalProps {
  bill: FixedBill
  bankAccounts: BankAccount[]
  referenceMonth: string
  onPay: (bankAccountId: string, paymentDate: string) => void
  onClose: () => void
  loading: boolean
}

function PayFixedBillModal({
  bill,
  bankAccounts,
  referenceMonth,
  onPay,
  onClose,
  loading,
}: PayFixedBillModalProps) {
  const [bankAccountId, setBankAccountId] = useState('')
  const [date, setDate] = useState(() => {
    const [year, month] = referenceMonth.split('-')
    return `${year}-${month}-${String(bill.due_day).padStart(2, '0')}`
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bankAccountId) {
      alert('Selecione uma conta bancária')
      return
    }
    onPay(bankAccountId, date)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Pagar Conta Fixa
        </h3>
        <p className="text-sm text-text-muted mb-4">
          {bill.name} — {formatCurrency(bill.amount)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Data do pagamento *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Conta bancária para débito *
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">Selecione a conta...</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-success px-4 py-2.5 text-sm font-medium text-white hover:bg-success/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
