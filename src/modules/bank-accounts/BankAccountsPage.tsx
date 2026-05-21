import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Building2, Sliders } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, parseCurrencyInput } from '@/lib/format'
import { formatNumberToInput } from '@/lib/formatCurrencyInput'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import type { BankAccount } from '@/lib/types'
import { BANK_ACCOUNT_TYPES } from '@/lib/constants'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { BankAccountForm } from './BankAccountForm'
import { useRealtimeSubscription } from '@/lib/useRealtime'

export function BankAccountsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [adjustingAccount, setAdjustingAccount] = useState<BankAccount | null>(null)

  const fetchData = useCallback(async () => {
    if (!profile?.household_id) return

    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('name')

    if (data) setAccounts(data)
    setLoading(false)
  }, [profile?.household_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeSubscription('bank_accounts', profile?.household_id ?? null, fetchData)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta conta bancária?')) return
    await supabase.from('bank_accounts').delete().eq('id', id)
    fetchData()
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  function getAccountTypeLabel(type: string | null) {
    if (!type) return ''
    const found = BANK_ACCOUNT_TYPES.find((t) => t.value === type)
    return found?.label || ''
  }

  return (
    <>
      <PageHeader
        title="Contas Bancárias"
        description="Gerencie suas contas bancárias"
        action={
          <button
            onClick={() => {
              setEditingAccount(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova conta</span>
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Saldo total
          </p>
          <p className="mt-1.5 text-xl font-semibold text-text-primary font-mono">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-text-muted">
            {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-border/60"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta bancária"
          description="Adicione suas contas bancárias para acompanhar seu saldo."
          action={
            <button
              onClick={() => {
                setEditingAccount(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar conta
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden"
            >
              <div
                className="h-2"
                style={{ backgroundColor: account.color }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: account.color + '20' }}
                    >
                      <Building2
                        className="h-5 w-5"
                        style={{ color: account.color }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {account.name}
                      </p>
                      {account.bank_name && (
                        <p className="text-xs text-text-muted">
                          {account.bank_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAdjustingAccount(account)
                      }}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-accent transition-colors"
                      aria-label="Ajustar saldo"
                      title="Ajustar saldo"
                    >
                      <Sliders className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingAccount(account)
                        setShowForm(true)
                      }}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-accent transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-danger transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-text-muted">Saldo atual</p>
                  <p className="text-lg font-semibold text-text-primary font-mono">
                    {formatCurrency(account.current_balance)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                  {account.account_type && (
                    <span>{getAccountTypeLabel(account.account_type)}</span>
                  )}
                  {account.agency_number && account.account_number && (
                    <span>Ag: {account.agency_number} | Cta: {account.account_number}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingAccount(null)
        }}
        title={editingAccount ? 'Editar conta bancária' : 'Nova conta bancária'}
      >
        <BankAccountForm
          editingAccount={editingAccount}
          onSuccess={() => {
            setShowForm(false)
            setEditingAccount(null)
            fetchData()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingAccount(null)
          }}
        />
      </Modal>

      {adjustingAccount && (
        <BalanceAdjustmentModal
          account={adjustingAccount}
          onSuccess={() => {
            setAdjustingAccount(null)
            fetchData()
          }}
          onClose={() => {
            setAdjustingAccount(null)
          }}
        />
      )}
    </>
  )
}

interface BalanceAdjustmentModalProps {
  account: BankAccount
  onSuccess: () => void
  onClose: () => void
}

function BalanceAdjustmentModal({
  account,
  onSuccess,
  onClose,
}: BalanceAdjustmentModalProps) {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const [newBalance, setNewBalance] = useState(formatNumberToInput(account.current_balance))
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!profile?.household_id || !user) return

    const parsedNewBalance = parseCurrencyInput(newBalance)
    if (isNaN(parsedNewBalance)) {
      alert('Informe um valor válido')
      return
    }

    const diff = parsedNewBalance - account.current_balance

    setLoading(true)
    try {
      if (diff !== 0) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('household_id', profile.household_id)
          .eq('name', 'Ajuste de Saldo')
          .maybeSingle()

        await supabase.from('transactions').insert({
          household_id: profile.household_id,
          created_by: user.id,
          type: diff > 0 ? 'income' : 'expense',
          amount: Math.abs(diff),
          description: `Ajuste de saldo - ${account.name}${note ? ': ' + note : ''}`,
          category_id: cat?.id || null,
          date: adjustmentDate,
          bank_account_id: account.id,
        })
      }

      await supabase
        .from('bank_accounts')
        .update({ current_balance: parsedNewBalance })
        .eq('id', account.id)

      onSuccess()
    } catch (error) {
      console.error('Erro ao ajustar saldo:', error)
      alert('Erro ao ajustar saldo. Tente novamente.')
    }
    setLoading(false)
  }

  const diff = parseCurrencyInput(newBalance) - account.current_balance
  const diffFormatted = diff > 0 ? `+${formatCurrency(diff)}` : diff < 0 ? `-${formatCurrency(Math.abs(diff))}` : '0,00'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Ajustar Saldo
        </h3>
        <p className="text-sm text-text-muted mb-4">
          {account.name} - Saldo atual: {formatCurrency(account.current_balance)}
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Novo saldo (R$) *
            </label>
            <CurrencyInput
              value={newBalance}
              onChange={setNewBalance}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Data do ajuste *
            </label>
            <input
              type="date"
              value={adjustmentDate}
              onChange={(e) => setAdjustmentDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: Correção de lançamentos"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus-ring-accent"
            />
          </div>

          {diff !== 0 && (
            <div className={`rounded-lg p-3 text-center ${diff > 0 ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
              <p className="text-sm font-medium">
                Diferença: <span className="font-mono">{diffFormatted}</span>
              </p>
              <p className="text-xs mt-1 opacity-80">
                {diff > 0 ? 'Entrada' : 'Saída'} será registrada automaticamente
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}