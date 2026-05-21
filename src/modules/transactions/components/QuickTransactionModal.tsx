import { useState, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { BankAccount } from '@/lib/types'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Modal } from '@/components/ui/Modal'
import { parseCurrencyInput } from '@/lib/format'

interface QuickTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function QuickTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickTransactionModalProps) {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setType('expense')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setDescription('')
    setBankAccountId('')
    setError('')
  }, [isOpen])

  useEffect(() => {
    if (!profile?.household_id || !isOpen) return
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setBankAccounts(data)
          if (data.length === 1) {
            setBankAccountId(data[0].id)
          }
        }
      })
  }, [profile?.household_id, isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.household_id || !user) return

    const parsedAmount = parseCurrencyInput(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Informe um valor válido')
      return
    }
    if (!description.trim()) {
      setError('Informe uma descrição')
      return
    }
    if (!bankAccountId) {
      setError('Selecione uma conta bancária')
      return
    }
    if (!date) {
      setError('Informe uma data')
      return
    }

    setLoading(true)
    setError('')

    try {
      await supabase.from('transactions').insert({
        household_id: profile.household_id,
        created_by: user.id,
        type,
        amount: parsedAmount,
        description: description.trim(),
        category_id: null,
        date,
        is_recurring: false,
        recurrence: null,
        bank_account_id: bankAccountId,
        installment_id: null,
      })

      const { data: account } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', bankAccountId)
        .maybeSingle()

      if (account) {
        const balanceChange = type === 'income' ? parsedAmount : -parsedAmount
        await supabase
          .from('bank_accounts')
          .update({ current_balance: account.current_balance + balanceChange })
          .eq('id', bankAccountId)
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erro ao criar transação rápida:', err)
      setError('Erro ao salvar. Tente novamente.')
    }

    setLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação Rápida" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Tipo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'border-danger bg-red-50 text-danger'
                  : 'border-border text-text-muted hover:bg-accent-light/50'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Saída
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'border-success bg-green-50 text-success'
                  : 'border-border text-text-muted hover:bg-accent-light/50'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Entrada
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="quick-amount"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Valor (R$) *
          </label>
          <CurrencyInput
            id="quick-amount"
            value={amount}
            onChange={setAmount}
          />
        </div>

        <div>
          <label
            htmlFor="quick-date"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Data *
          </label>
          <input
            id="quick-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="quick-description"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Descrição *
          </label>
          <input
            id="quick-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Café da manhã"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="quick-account"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Conta Bancária *
          </label>
          <select
            id="quick-account"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">Selecione a conta...</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
                {acc.bank_name ? ` - ${acc.bank_name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">{error}</p>
        )}

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
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
