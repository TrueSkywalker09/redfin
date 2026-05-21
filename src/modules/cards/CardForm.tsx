import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { CreditCard } from '@/lib/types'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatNumberToInput } from '@/lib/formatCurrencyInput'
import { parseCurrencyInput } from '@/lib/format'

const cardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  credit_limit: z.string().optional(),
  closing_day: z.string().min(1, 'Dia de fechamento é obrigatório'),
  due_day: z.string().min(1, 'Dia de vencimento é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
})

type CardFormData = z.infer<typeof cardSchema>

interface CardFormProps {
  editingCard?: CreditCard | null
  onSuccess: () => void
  onCancel: () => void
}

export function CardForm({ editingCard, onSuccess, onCancel }: CardFormProps) {
  const profile = useAuthStore((s) => s.profile)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: editingCard
      ? {
          name: editingCard.name,
          credit_limit: editingCard.credit_limit != null ? formatNumberToInput(editingCard.credit_limit) : '',
          closing_day: editingCard.closing_day?.toString() || '',
          due_day: editingCard.due_day?.toString() || '',
          color: editingCard.color || '#6B7C5C',
        }
      : {
          color: '#6B7C5C',
        },
  })

  const selectedColor = watch('color')

  async function onSubmit(data: CardFormData) {
    if (!profile?.household_id) return

    setLoading(true)
    try {
      const payload = {
        household_id: profile.household_id,
        name: data.name,
        credit_limit: data.credit_limit
          ? parseCurrencyInput(data.credit_limit)
          : null,
        closing_day: parseInt(data.closing_day),
        due_day: parseInt(data.due_day),
        color: data.color,
      }

      if (editingCard) {
        await supabase.from('credit_cards').update(payload).eq('id', editingCard.id)
      } else {
        await supabase.from('credit_cards').insert(payload)
      }

      onSuccess()
    } catch (error) {
      alert('Erro ao salvar cartão. Tente novamente.')
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
          Nome do cartão
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Ex.: Nubank"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="credit_limit"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Limite total (R$)
        </label>
        <CurrencyInput
          id="credit_limit"
          value={watch('credit_limit') || ''}
          onChange={(val) => setValue('credit_limit', val, { shouldValidate: true })}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="closing_day"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Dia de fechamento
          </label>
          <input
            id="closing_day"
            type="number"
            min="1"
            max="31"
            {...register('closing_day')}
            aria-invalid={!!errors.closing_day}
            aria-describedby={errors.closing_day ? 'closing_day-error' : undefined}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {errors.closing_day && (
            <p id="closing_day-error" role="alert" className="mt-1 text-xs text-danger">
              {errors.closing_day.message}
            </p>
          )}
        </div>
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
      </div>

      <ColorPicker
        label="Cor de identificação *"
        value={selectedColor || '#6B7C5C'}
        onChange={(color) => setValue('color', color)}
      />

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
          {loading ? 'Salvando...' : editingCard ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
