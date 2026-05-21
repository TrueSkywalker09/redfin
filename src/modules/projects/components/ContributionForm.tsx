import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Project, BankAccount } from '@/lib/types'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { parseCurrencyInput } from '@/lib/format'

const contributionSchema = z.object({
  amount: z.string().min(1, 'Valor é obrigatório'),
  note: z.string().optional(),
})

type ContributionFormData = z.infer<typeof contributionSchema>

interface ContributionFormProps {
  project: Project
  onSuccess: () => void
}

export function ContributionForm({
  project,
  onSuccess,
}: ContributionFormProps) {
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankAccountId, setBankAccountId] = useState('')
  const [destinoAccountId, setDestinoAccountId] = useState('')

  useEffect(() => {
    if (!profile?.household_id) return
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setBankAccounts(data)
          if (data.length === 1) setBankAccountId(data[0].id)
        }
      })
  }, [profile?.household_id])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
  })

  async function onSubmit(data: ContributionFormData) {
    if (!user || !profile?.household_id) return

    if (!bankAccountId) {
      alert('Selecione uma conta bancária')
      return
    }

    setLoading(true)

    try {
      const amount = parseCurrencyInput(data.amount)

      const contribution = await supabase
        .from('project_contributions')
        .insert({
          project_id: project.id,
          amount,
          note: data.note || null,
          contributed_at: new Date().toISOString().split('T')[0],
        })
        .select()
        .maybeSingle()

      if (contribution) {
        const newAmount = Number(project.current_amount) + amount
        await supabase
          .from('projects')
          .update({ current_amount: newAmount })
          .eq('id', project.id)

        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('household_id', profile.household_id)
          .eq('name', 'Desejo/Projeto')
          .maybeSingle()

        const catId = categoryData?.id || null

        const isTransfer = destinoAccountId && destinoAccountId !== bankAccountId

        await supabase.from('transactions').insert({
          household_id: profile.household_id,
          created_by: user.id,
          type: 'expense',
          amount,
          description: isTransfer
            ? `Aporte: ${project.name} (débito)`
            : `Aporte: ${project.name}`,
          category_id: catId,
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          recurrence: null,
          bank_account_id: bankAccountId,
        })

        const { data: debitoAccount } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', bankAccountId)
          .maybeSingle()

        if (debitoAccount) {
          await supabase
            .from('bank_accounts')
            .update({ current_balance: debitoAccount.current_balance - amount })
            .eq('id', bankAccountId)
        }

        if (isTransfer) {
          await supabase.from('transactions').insert({
            household_id: profile.household_id,
            created_by: user.id,
            type: 'income',
            amount,
            description: `Aporte: ${project.name} (crédito)`,
            category_id: catId,
            date: new Date().toISOString().split('T')[0],
            is_recurring: false,
            recurrence: null,
            bank_account_id: destinoAccountId,
          })

          const { data: creditoAccount } = await supabase
            .from('bank_accounts')
            .select('current_balance')
            .eq('id', destinoAccountId)
            .maybeSingle()

          if (creditoAccount) {
            await supabase
              .from('bank_accounts')
              .update({ current_balance: creditoAccount.current_balance + amount })
              .eq('id', destinoAccountId)
          }
        }
      }
    } catch (error) {
      alert('Erro ao registrar aporte. Tente novamente.')
    }

    setLoading(false)
    reset()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label
          htmlFor="contribution-amount"
          className="mb-1 block text-sm font-medium text-text-primary"
        >
          Valor do aporte (R$)
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <CurrencyInput
              id="contribution-amount"
              value={watch('amount') || ''}
              onChange={(val) => setValue('amount', val, { shouldValidate: true })}
              error={errors.amount?.message}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contribution-account"
          className="mb-1 block text-sm font-medium text-text-primary"
        >
          Conta de débito *
        </label>
        <select
          id="contribution-account"
          value={bankAccountId}
          onChange={(e) => setBankAccountId(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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

      <div>
        <label
          htmlFor="destino-account"
          className="mb-1 block text-sm font-medium text-text-primary"
        >
          Conta de crédito (opcional)
        </label>
        <select
          id="destino-account"
          value={destinoAccountId}
          onChange={(e) => setDestinoAccountId(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option value="">Apenas débito (sem transferência)</option>
          {bankAccounts
            .filter((acc) => acc.id !== bankAccountId)
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
                {acc.bank_name ? ` - ${acc.bank_name}` : ''}
              </option>
            ))}
        </select>
        <p className="mt-1 text-xs text-text-muted">
          Se selecionada, o valor será transferido entre as contas (débito + crédito)
        </p>
      </div>

      <div>
        <input
          id="contribution-note"
          type="text"
          {...register('note')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Observação (opcional)"
        />
      </div>
    </form>
  )
}
