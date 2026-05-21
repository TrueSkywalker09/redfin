import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Category, Transaction, BankAccount, CreditCard } from '@/lib/types'
import { ArrowUpCircle, ArrowDownCircle, CreditCard as CreditCardIcon } from 'lucide-react'
import { BankAccountSelect, CreditCardSelect } from './components/BankAccountSelect'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatNumberToInput } from '@/lib/formatCurrencyInput'
import { parseCurrencyInput } from '@/lib/format'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  is_recurring: z.boolean(),
  recurrence: z.enum(['weekly', 'monthly', 'yearly']).nullable(),
  bank_account_id: z.string().optional(),
  is_credit_card: z.boolean(),
  credit_card_id: z.string().optional(),
  installments: z.string().optional(),
}).refine(
  (data) => data.is_credit_card || !!data.bank_account_id,
  { message: 'Conta bancária é obrigatória', path: ['bank_account_id'] }
)

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  categories: Category[]
  bankAccounts: BankAccount[]
  creditCards: CreditCard[]
  editingTransaction?: Transaction | null
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm({
  categories,
  bankAccounts,
  creditCards,
  editingTransaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [loading, setLoading] = useState(false)
  const [originalInstallment, setOriginalInstallment] = useState<{
    id: string
    card_id: string
    total_installments: number
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editingTransaction
      ? {
          type: editingTransaction.type,
          amount: formatNumberToInput(editingTransaction.amount),
          description: editingTransaction.description || '',
          category_id: editingTransaction.category_id || '',
          date: editingTransaction.date,
          is_recurring: editingTransaction.is_recurring,
          recurrence: editingTransaction.recurrence,
          bank_account_id: editingTransaction.bank_account_id || '',
          is_credit_card: !!editingTransaction.installment_id,
          credit_card_id: '',
          installments: '1',
        }
      : {
          type: 'expense',
          is_recurring: false,
          recurrence: null,
          date: new Date().toISOString().split('T')[0],
          bank_account_id: '',
          is_credit_card: false,
          credit_card_id: '',
          installments: '1',
        },
  })

  const type = watch('type')
  const isRecurring = watch('is_recurring')
  const isCreditCard = watch('is_credit_card')
  const selectedCardId = watch('credit_card_id')
  const selectedBankId = watch('bank_account_id')

  const incomeCategories = categories.filter(
    (c) => c.type === 'income' || c.type === 'both'
  )
  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  )
  const filteredCategories =
    type === 'income' ? incomeCategories : expenseCategories

  const selectedCard = creditCards.find((c) => c.id === selectedCardId)

  useEffect(() => {
    if (type === 'income') {
      setValue('is_credit_card', false)
      setValue('bank_account_id', watch('bank_account_id') || '')
    }
    if (isCreditCard) {
      setValue('bank_account_id', '')
    }
  }, [type, isCreditCard, setValue, watch])

  useEffect(() => {
    if (editingTransaction?.installment_id) {
      supabase
        .from('installments')
        .select('id, card_id, total_installments')
        .eq('id', editingTransaction.installment_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setOriginalInstallment(data)
            setValue('credit_card_id', data.card_id)
            setValue('installments', data.total_installments.toString())
            setValue('is_credit_card', true)
          }
        })
    } else {
      setOriginalInstallment(null)
    }
  }, [editingTransaction, setValue])

  function calculateFirstChargeDate(
    transactionDate: Date,
    closingDay: number
  ): string {
    const day = transactionDate.getDate()
    const year = transactionDate.getFullYear()
    const month = transactionDate.getMonth()

    if (day >= closingDay) {
      const nextMonth = month + 1
      const nextYear = nextMonth > 11 ? year + 1 : year
      const adjustedMonth = nextMonth > 11 ? 0 : nextMonth
      return `${nextYear}-${String(adjustedMonth + 1).padStart(2, '0')}-${String(closingDay).padStart(2, '0')}`
    } else {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(closingDay).padStart(2, '0')}`
    }
  }

  async function onSubmit(data: TransactionFormData) {
    if (!profile?.household_id || !user) return

    setLoading(true)
    try {
      const amount = parseCurrencyInput(data.amount)

      let installmentId: string | null = null

      if (data.is_credit_card && data.credit_card_id && selectedCard) {
        const totalInstallments = parseInt(data.installments || '1')

        if (originalInstallment && originalInstallment.card_id === data.credit_card_id) {
          await supabase
            .from('installments')
            .update({
              description: data.description,
              total_amount: amount,
              total_installments: totalInstallments,
              category_id: data.category_id || null,
            })
            .eq('id', originalInstallment.id)
          installmentId = originalInstallment.id
        } else {
          const transactionDate = new Date(data.date)
          const firstChargeDate = calculateFirstChargeDate(
            transactionDate,
            selectedCard.closing_day || 1
          )

          const { data: installmentData } = await supabase
            .from('installments')
            .insert({
              household_id: profile.household_id,
              card_id: data.credit_card_id,
              description: data.description,
              total_amount: amount,
              total_installments: totalInstallments,
              current_installment: 0,
              first_charge_date: firstChargeDate,
              category_id: data.category_id || null,
            })
            .select()
            .maybeSingle()

          if (installmentData) {
            installmentId = installmentData.id
          }
        }
      }

      const payload = {
        household_id: profile.household_id,
        created_by: user.id,
        type: data.type,
        amount,
        description: data.description,
        category_id: data.category_id,
        date: data.date,
        is_recurring: data.is_recurring,
        recurrence: data.is_recurring ? data.recurrence : null,
        bank_account_id: data.is_credit_card ? null : (data.bank_account_id || null),
        installment_id: installmentId,
      }

      if (editingTransaction) {
        await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editingTransaction.id)

        const oldBankId = editingTransaction.bank_account_id
        const newBankId = data.is_credit_card ? null : (data.bank_account_id || null)

        if (oldBankId) {
          const { data: oldAccount } = await supabase
            .from('bank_accounts')
            .select('current_balance')
            .eq('id', oldBankId)
            .maybeSingle()

          if (oldAccount) {
            const balanceChange = editingTransaction.type === 'income'
              ? -editingTransaction.amount
              : editingTransaction.amount
            await supabase
              .from('bank_accounts')
              .update({ current_balance: oldAccount.current_balance + balanceChange })
              .eq('id', oldBankId)
          }
        }

        if (newBankId) {
          const { data: newAccount } = await supabase
            .from('bank_accounts')
            .select('current_balance')
            .eq('id', newBankId)
            .maybeSingle()

          if (newAccount) {
            const balanceChange = data.type === 'income' ? amount : -amount
            await supabase
              .from('bank_accounts')
              .update({ current_balance: newAccount.current_balance + balanceChange })
              .eq('id', newBankId)
          }
        }
      } else {
        await supabase.from('transactions').insert(payload)

        if (!data.is_credit_card && data.bank_account_id) {
          const { data: account } = await supabase
            .from('bank_accounts')
            .select('current_balance')
            .eq('id', data.bank_account_id)
            .maybeSingle()

          if (account) {
            const balanceChange = data.type === 'income' ? amount : -amount
            await supabase
              .from('bank_accounts')
              .update({ current_balance: account.current_balance + balanceChange })
              .eq('id', data.bank_account_id)
          }
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-text-primary">
          Tipo
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
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
            onClick={() => setValue('type', 'income')}
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
          htmlFor="amount"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Valor (R$) *
        </label>
        <CurrencyInput
          id="amount"
          value={watch('amount') || ''}
          onChange={(val) => setValue('amount', val, { shouldValidate: true })}
          error={errors.amount?.message}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Descrição *
        </label>
        <input
          id="description"
          type="text"
          {...register('description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Ex.: Supermercado"
        />
        {errors.description && (
          <p id="description-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="category_id"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Categoria *
        </label>
        <select
          id="category_id"
          {...register('category_id')}
          aria-invalid={!!errors.category_id}
          aria-describedby={errors.category_id ? 'category_id-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option value="">Selecione...</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p id="category_id-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.category_id.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="date"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Data *
        </label>
        <input
          id="date"
          type="date"
          {...register('date')}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
        {errors.date && (
          <p id="date-error" role="alert" className="mt-1 text-xs text-danger">{errors.date.message}</p>
        )}
      </div>

      {!isCreditCard && (
        <BankAccountSelect
          value={selectedBankId || ''}
          onChange={(id) => setValue('bank_account_id', id)}
          accounts={bankAccounts}
          error={errors.bank_account_id?.message}
        />
      )}

      {type === 'expense' && (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-accent-light/30 p-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                {...register('is_credit_card')}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full border border-border bg-bg after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
            </label>
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <CreditCardIcon className="h-4 w-4" />
              <span>Pagar com cartão de crédito (parcelado)</span>
            </div>
          </div>

          {isCreditCard && (
            <div className="space-y-3 rounded-lg border border-accent/20 bg-accent-light/10 p-3">
              <CreditCardSelect
                value={selectedCardId || ''}
                onChange={(id) => setValue('credit_card_id', id)}
                cards={creditCards.map((c) => ({
                  id: c.id,
                  name: c.name,
                  closing_day: c.closing_day || 1,
                }))}
              />
              <div>
                <label
                  htmlFor="installments"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Número de parcelas
                </label>
                <select
                  id="installments"
                  {...register('installments')}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n.toString()}>
                      {n}x {n === 1 ? '(à vista)' : ''}
                    </option>
                  ))}
                </select>
                {selectedCard && selectedCardId && (
                  <p className="mt-1 text-xs text-text-muted">
                    Primeira parcela: {calculateFirstChargeDate(new Date(watch('date') || new Date()), selectedCard.closing_day || 1)}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            {...register('is_recurring')}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full border border-border bg-bg after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm text-text-primary">Transação recorrente</span>
      </div>

      {isRecurring && (
        <div>
          <label
            htmlFor="recurrence"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Frequência
          </label>
          <select
            id="recurrence"
            {...register('recurrence')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : editingTransaction ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}