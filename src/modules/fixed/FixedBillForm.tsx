import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Category, FixedBill } from '@/lib/types'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatNumberToInput } from '@/lib/formatCurrencyInput'
import { parseCurrencyInput } from '@/lib/format'

const fixedBillSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  due_day: z.string().min(1, 'Dia de vencimento é obrigatório'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  start_date: z.string().optional(),
})

type FixedBillFormData = z.infer<typeof fixedBillSchema>

interface FixedBillFormProps {
  categories: Category[]
  editingBill?: FixedBill | null
  onSuccess: () => void
  onCancel: () => void
}

export function FixedBillForm({
  categories,
  editingBill,
  onSuccess,
  onCancel,
}: FixedBillFormProps) {
  const profile = useAuthStore((s) => s.profile)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FixedBillFormData>({
    resolver: zodResolver(fixedBillSchema),
    defaultValues: editingBill
      ? {
          name: editingBill.name,
          amount: formatNumberToInput(editingBill.amount),
          due_day: editingBill.due_day.toString(),
          category_id: editingBill.category_id || '',
          start_date: editingBill.start_date || '',
        }
      : {
          due_day: '',
          start_date: new Date().toISOString().split('T')[0],
        },
  })

  async function onSubmit(data: FixedBillFormData) {
    if (!profile?.household_id) return

    setLoading(true)
    try {
      const payload = {
        household_id: profile.household_id,
        name: data.name,
        amount: parseCurrencyInput(data.amount),
        due_day: parseInt(data.due_day),
        category_id: data.category_id,
        start_date: data.start_date || null,
      }

      if (editingBill) {
        await supabase.from('fixed_bills').update(payload).eq('id', editingBill.id)
      } else {
        await supabase.from('fixed_bills').insert(payload)
      }

      onSuccess()
    } catch (error) {
      alert('Erro ao salvar conta fixa. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Nome da conta
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Ex.: Aluguel"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="amount"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Valor (R$)
        </label>
        <CurrencyInput
          id="amount"
          value={watch('amount') || ''}
          onChange={(val) => setValue('amount', val, { shouldValidate: true })}
          error={errors.amount?.message}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="due_day"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Dia de vencimento
          </label>
          <input
            id="due_day"
            type="number"
            min="1"
            max="31"
            {...register('due_day')}
            aria-invalid={!!errors.due_day}
            aria-describedby={errors.due_day ? 'due_day-error' : undefined}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {errors.due_day && (
            <p id="due_day-error" role="alert" className="mt-1 text-xs text-danger">
              {errors.due_day.message}
            </p>
          )}
        </div>

        <div className="flex-[2]">
          <label
            htmlFor="category_id"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Categoria
          </label>
          <select
            id="category_id"
            {...register('category_id')}
            aria-invalid={!!errors.category_id}
            aria-describedby={errors.category_id ? 'category_id-error' : undefined}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">Selecione...</option>
            {categories.map((cat) => (
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
      </div>

      <div>
        <label
          htmlFor="start_date"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Válido a partir de
        </label>
        <input
          id="start_date"
          type="date"
          {...register('start_date')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus-red-700 focus:ring-red-700"
        />
        <p className="mt-1 text-xs text-text-muted">
          A conta começará a aparecer no painel a partir desta data
        </p>
      </div>

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
          {loading ? 'Salvando...' : editingBill ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
