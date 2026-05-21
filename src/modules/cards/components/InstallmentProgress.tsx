import { useState, useEffect } from 'react'
import type { Installment, CreditCard, BankAccount } from '@/lib/types'
import { formatCurrency, parseCurrencyInput } from '@/lib/format'
import { formatNumberToInput } from '@/lib/formatCurrencyInput'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { DollarSign } from 'lucide-react'

interface InstallmentProgressProps {
  installment: Installment
  card: CreditCard
  onUpdate: () => void
}

export function InstallmentProgress({
  installment,
  card,
  onUpdate,
}: InstallmentProgressProps) {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [showPayModal, setShowPayModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const installmentValue = installment.total_amount / installment.total_installments
  const paidInstallments = installment.current_installment
  const remainingInstallments = installment.total_installments - paidInstallments

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

  async function handlePayInstallment(
    paymentAmount: number,
    paymentDate: string,
    bankAccountId: string
  ) {
    if (!profile?.household_id || !user) return

    setLoading(true)
    try {
      await supabase.from('transactions').insert({
        household_id: profile.household_id,
        created_by: user.id,
        type: 'expense',
        amount: paymentAmount,
        description: `${card.name} - Parcela ${paidInstallments + 1}/${installment.total_installments} de ${installment.description}`,
        category_id: installment.category_id,
        date: paymentDate,
        bank_account_id: bankAccountId,
        installment_id: installment.id,
      })

      const { data: account } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', bankAccountId)
        .maybeSingle()

      if (account) {
        await supabase
          .from('bank_accounts')
          .update({ current_balance: account.current_balance - paymentAmount })
          .eq('id', bankAccountId)
      }

      await supabase
        .from('installments')
        .update({ current_installment: paidInstallments + 1 })
        .eq('id', installment.id)

      setShowPayModal(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao pagar parcela:', error)
      alert('Erro ao pagar parcela. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">
              {installment.description}
            </p>
            <p className="text-xs text-text-muted">
              {paidInstallments} de {installment.total_installments} parcelas pagas
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-sm font-semibold text-text-primary font-mono">
              {formatCurrency(installmentValue)}
            </p>
            <p className="text-xs text-text-muted">/mês</p>
          </div>
        </div>
        <ProgressBar
          value={paidInstallments}
          max={installment.total_installments}
          size="sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Total: {formatCurrency(installment.total_amount)}
          </p>
          {remainingInstallments > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-medium text-white hover:bg-success/90 transition-colors"
            >
              <DollarSign className="h-3 w-3" />
              Pagar parcela
            </button>
          )}
        </div>
      </div>

      {showPayModal && (
        <PayInstallmentModal
          installment={installment}
          card={card}
          installmentValue={installmentValue}
          bankAccounts={bankAccounts}
          onPay={handlePayInstallment}
          onClose={() => setShowPayModal(false)}
          loading={loading}
        />
      )}
    </>
  )
}

interface PayInstallmentModalProps {
  installment: Installment
  card: CreditCard
  installmentValue: number
  bankAccounts: BankAccount[]
  onPay: (amount: number, date: string, bankAccountId: string) => void
  onClose: () => void
  loading: boolean
}

function PayInstallmentModal({
  installment,
  card,
  installmentValue,
  bankAccounts,
  onPay,
  onClose,
  loading,
}: PayInstallmentModalProps) {
  const paidInstallments = installment.current_installment
  const [amount, setAmount] = useState(formatNumberToInput(installmentValue))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [bankAccountId, setBankAccountId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseCurrencyInput(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Informe um valor válido')
      return
    }
    if (!bankAccountId) {
      alert('Selecione uma conta bancária')
      return
    }
    onPay(parsedAmount, date, bankAccountId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Pagar Parcela
        </h3>
        <p className="text-sm text-text-muted mb-4">
          {card.name} - Parcela {paidInstallments + 1}/{installment.total_installments}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Valor (R$) *
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
            />
          </div>

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