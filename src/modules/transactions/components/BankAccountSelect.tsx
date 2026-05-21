import type { BankAccount } from '@/lib/types'

interface BankAccountSelectProps {
  value: string
  onChange: (id: string) => void
  accounts: BankAccount[]
  error?: string
}

export function BankAccountSelect({
  value,
  onChange,
  accounts,
  error,
}: BankAccountSelectProps) {
  return (
    <div>
      <label
        htmlFor="bank_account_id"
        className="mb-1.5 block text-sm font-medium text-text-primary"
      >
        Conta Bancária *
      </label>
      <select
        id="bank_account_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? 'bank_account_id-error' : undefined}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      >
        <option value="">Selecione a conta...</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
            {account.bank_name ? ` - ${account.bank_name}` : ''}
          </option>
        ))}
      </select>
      {error && (
        <p id="bank_account_id-error" role="alert" className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  )
}

interface CreditCardSelectProps {
  value: string
  onChange: (id: string) => void
  cards: { id: string; name: string; closing_day: number }[]
  error?: string
}

export function CreditCardSelect({
  value,
  onChange,
  cards,
  error,
}: CreditCardSelectProps) {
  return (
    <div>
      <label
        htmlFor="credit_card_id"
        className="mb-1.5 block text-sm font-medium text-text-primary"
      >
        Cartão de Crédito
      </label>
      <select
        id="credit_card_id"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? 'credit_card_id-error' : undefined}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      >
        <option value="">Selecione o cartão...</option>
        {cards.map((card) => (
          <option key={card.id} value={card.id}>
            {card.name} (fecha dia {card.closing_day})
          </option>
        ))}
      </select>
      {error && (
        <p id="credit_card_id-error" role="alert" className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  )
}