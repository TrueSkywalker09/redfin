import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const signUp = useAuthStore((s) => s.signUp)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    setError(null)
    const result = await signUp(data.email, data.password, data.fullName)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
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
            Conta criada!
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Enviamos um e-mail de confirmação. Verifique sua caixa de entrada
            para ativar sua conta.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Comece a controlar suas finanças
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
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Nome completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="fullName"
                type="text"
                {...register('fullName')}
                className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Seu nome"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-danger">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              E-mail
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
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
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
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Repita a senha"
              />
            </div>
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className="mt-4 text-center text-sm text-text-muted">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
