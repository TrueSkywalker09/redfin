import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/types'
import { PRIORITY_OPTIONS } from '@/lib/constants'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatNumberToInput } from '@/lib/formatCurrencyInput'
import { parseCurrencyInput } from '@/lib/format'

const projectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  target_amount: z.string().min(1, 'Valor meta é obrigatório'),
  target_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  editingProject?: Project | null
  onSuccess: () => void
  onCancel: () => void
}

export function ProjectForm({
  editingProject,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const profile = useAuthStore((s) => s.profile)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: editingProject
      ? {
          name: editingProject.name,
          description: editingProject.description || '',
          target_amount: formatNumberToInput(editingProject.target_amount),
          target_date: editingProject.target_date || '',
          priority: editingProject.priority,
        }
      : {
          priority: 'medium',
        },
  })

  async function onSubmit(data: ProjectFormData) {
    if (!profile?.household_id) return

    setLoading(true)
    try {
      const payload = {
        household_id: profile.household_id,
        name: data.name,
        description: data.description || null,
        target_amount: parseCurrencyInput(data.target_amount),
        target_date: data.target_date || null,
        priority: data.priority,
      }

      if (editingProject) {
        await supabase.from('projects').update(payload).eq('id', editingProject.id)
      } else {
        await supabase.from('projects').insert(payload)
      }

      onSuccess()
    } catch (error) {
      alert('Erro ao salvar projeto. Tente novamente.')
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
          Nome do projeto
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Ex.: Viagem para Europa"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Descrição
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent resize-none"
          placeholder="Descreva seu objetivo..."
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="target_amount"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Valor meta (R$)
          </label>
          <CurrencyInput
            id="target_amount"
            value={watch('target_amount') || ''}
            onChange={(val) => setValue('target_amount', val, { shouldValidate: true })}
            error={errors.target_amount?.message}
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="target_date"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Data-alvo
          </label>
          <input
            id="target_date"
            type="date"
            {...register('target_date')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="priority"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Prioridade
        </label>
        <select
          id="priority"
          {...register('priority')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
          {loading ? 'Salvando...' : editingProject ? 'Atualizar' : 'Criar projeto'}
        </button>
      </div>
    </form>
  )
}
