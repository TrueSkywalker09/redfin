import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { BankAccount } from '@/lib/types'
import { BANK_ACCOUNT_TYPES } from '@/lib/constants'
import { ColorPicker } from '@/components/ui/ColorPicker'

const bankAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  bank_name: z.string().optional(),
  account_type: z.string().optional(),
  account_number: z.string().optional(),
  agency_number: z.string().optional(),
  color: z.string().min(1, 'Cor é obrigatória'),
})

type BankAccountFormData = z.infer<typeof bankAccountSchema>

interface BankAccountFormProps {
  editingAccount?: BankAccount | null
  onSuccess: () => void
  onCancel: () => void
}

export function BankAccountForm({
  editingAccount,
  onSuccess,
  onCancel,
}: BankAccountFormProps) {
  const profile = useAuthStore((s) => s.profile)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: editingAccount
      ? {
          name: editingAccount.name,
          bank_name: editingAccount.bank_name || '',
          account_type: editingAccount.account_type || '',
          account_number: editingAccount.account_number || '',
          agency_number: editingAccount.agency_number || '',
          color: editingAccount.color,
        }
      : {
          color: '#6B7C5C',
        },
  })

  const selectedColor = watch('color')

  async function onSubmit(data: BankAccountFormData) {
    if (!profile?.household_id) return

    setLoading(true)
    try {
      const payload = {
        household_id: profile.household_id,
        name: data.name,
        bank_name: data.bank_name || null,
        account_type: data.account_type || null,
        account_number: data.account_number || null,
        agency_number: data.agency_number || null,
        color: data.color,
        updated_at: new Date().toISOString(),
      }

      if (editingAccount) {
        await supabase
          .from('bank_accounts')
          .update(payload)
          .eq('id', editingAccount.id)
      } else {
        await supabase.from('bank_accounts').insert(payload)
      }

      onSuccess()
    } catch (error) {
      alert('Erro ao salvar conta bancária. Tente novamente.')
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
          Nome da conta *
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Ex.: Nubank, Inter"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="bank_name"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Nome do banco
          </label>
          <input
            id="bank_name"
            type="text"
            {...register('bank_name')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="Ex.: Nubank"
          />
        </div>

        <div>
          <label
            htmlFor="account_type"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Tipo de conta
          </label>
          <select
            id="account_type"
            {...register('account_type')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">Selecione...</option>
            {BANK_ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="agency_number"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Agência
          </label>
          <input
            id="agency_number"
            type="text"
            {...register('agency_number')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="Ex.: 0001"
          />
        </div>

        <div>
          <label
            htmlFor="account_number"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Número da conta
          </label>
          <input
            id="account_number"
            type="text"
            {...register('account_number')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="Ex.: 123456-7"
          />
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
          {loading ? 'Salvando...' : editingAccount ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}