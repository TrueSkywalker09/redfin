import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Project } from '@/lib/types'
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

        await supabase.from('transactions').insert({
          household_id: profile.household_id,
          created_by: user.id,
          type: 'expense',
          amount,
          description: `Aporte: ${project.name}`,
          category_id: categoryData?.id || null,
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          recurrence: null,
        })
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