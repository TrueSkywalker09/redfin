import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)
    const result = await signIn(data.email, data.password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Entrar no Redfin
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Controle financeiro para sua família
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

          <div className="mb-6">
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
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Sua senha"
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              to="/register"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Criar conta
            </Link>
            <Link
              to="/forgot-password"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
