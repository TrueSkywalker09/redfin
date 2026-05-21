import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  loadProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, isLoading: false })

    if (session?.user) {
      get().loadProfile()
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
      if (session?.user) {
        get().loadProfile()
      } else {
        set({ profile: null })
      }
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const message = mapAuthError(error.message)
      return { error: message }
    }
    return { error: null }
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      const message = mapAuthError(error.message)
      return { error: message }
    }

    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      const message = mapAuthError(error.message)
      return { error: message }
    }
    return { error: null }
  },

  loadProfile: async () => {
    const user = get().user
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    set({ profile: data })
  },
}))

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (message.includes('Email not confirmed')) {
    return 'E-mail não confirmado. Verifique sua caixa de entrada.'
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.'
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  if (message.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
  return 'Ocorreu um erro inesperado. Tente novamente.'
}
