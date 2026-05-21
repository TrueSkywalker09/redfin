export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(d)
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
