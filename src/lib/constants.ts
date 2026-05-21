export const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', type: 'both', color: '#D4860A', icon: 'utensils' },
  { name: 'Transporte', type: 'both', color: '#5B6E8C', icon: 'car' },
  { name: 'Saúde', type: 'expense', color: '#C0392B', icon: 'heart' },
  { name: 'Lazer', type: 'expense', color: '#8E44AD', icon: 'gamepad' },
  { name: 'Educação', type: 'expense', color: '#2980B9', icon: 'book' },
  { name: 'Moradia', type: 'expense', color: '#6B7C5C', icon: 'home' },
  { name: 'Vestuário', type: 'expense', color: '#E67E22', icon: 'shirt' },
  { name: 'Salário', type: 'income', color: '#2E7D5E', icon: 'briefcase' },
  { name: 'Freelance', type: 'income', color: '#16A085', icon: 'laptop' },
  { name: 'Investimentos', type: 'income', color: '#27AE60', icon: 'trending-up' },
  { name: 'Outros', type: 'both', color: '#7A7875', icon: 'more-horizontal' },
] as const

export const RECURRENCE_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
] as const

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
] as const

export const PROJECT_STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Concluído' },
] as const

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const CARD_COLORS = [
  '#6B7C5C',
  '#C0392B',
  '#2980B9',
  '#8E44AD',
  '#D4860A',
  '#16A085',
  '#27AE60',
  '#E67E22',
  '#2C3E50',
  '#7F8C8D',
  '#F39C12',
  '#1ABC9C',
  '#9B59B6',
  '#E74C3C',
]

export const BANK_ACCOUNT_TYPES = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'investment', label: 'Investimento' },
] as const
