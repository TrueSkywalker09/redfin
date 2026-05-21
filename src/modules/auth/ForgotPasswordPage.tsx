import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  async function onSubmit(data: ForgotForm) {
    setLoading(true)
    setError(null)
    const result = await resetPassword(data.email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Recuperar senha
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Receba um link de redefinição no seu e-mail
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success" />
            <h2 className="text-lg font-medium text-text-primary">
              E-mail enviado!
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Verifique sua caixa de entrada e siga as instruções para redefinir
              sua senha.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        ) : (
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

            <div className="mb-6">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Seu e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>

            <Link
              to="/login"
              className="mt-4 flex items-center justify-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
