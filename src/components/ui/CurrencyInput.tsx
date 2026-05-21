import { formatCurrencyInput } from '@/lib/formatCurrencyInput'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
  error?: string
  placeholder?: string
  className?: string
}

export function CurrencyInput({
  value,
  onChange,
  id,
  error,
  placeholder = '0,00',
  className = '',
}: CurrencyInputProps) {
  const errorId = id ? `${id}-error` : undefined

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(formatCurrencyInput(e.target.value))}
        className={`w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary font-mono outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent ${className}`}
        placeholder={placeholder}
      />
      {error && <p id={errorId} role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </>
  )
}
