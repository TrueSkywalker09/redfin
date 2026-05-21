import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')
  const type = searchParams.get('type')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
  })

  async function onSubmit(data: UpdatePasswordForm) {
    if (type !== 'recovery' || !token) {
      setError('Link inválido ou expirado.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Senha alterada!
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Sua senha foi atualizada com sucesso. Faça login com a nova senha.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </button>
        </div>
      </div>
    )
  }

  if (!token || type !== 'recovery') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Link inválido
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Este link de recuperação pode ter expirado ou já foi utilizado.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Solicitar novo link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Nova senha
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Repita a nova senha"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </button>
        </form>
      </div>
    </div>
  )
}