import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Transaction, Category, BankAccount, CreditCard } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TransactionForm } from './TransactionForm'
import { TransactionFilters, type FilterState } from './components/TransactionFilters'
import { Pagination } from '@/components/ui/Pagination'
import { useRealtimeSubscription } from '@/lib/useRealtime'

export function TransactionsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
  })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  const fetchData = useCallback(async () => {
    if (!profile?.household_id) return

    setLoading(true)

    const [transResult, catResult, banksResult, cardsResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('household_id', profile.household_id)
        .order('date', { ascending: false })
        .limit(100),
      supabase
        .from('categories')
        .select('*')
        .eq('household_id', profile.household_id),
      supabase
        .from('bank_accounts')
        .select('*')
        .eq('household_id', profile.household_id)
        .order('name'),
      supabase
        .from('credit_cards')
        .select('*')
        .eq('household_id', profile.household_id)
        .order('name'),
    ])

    if (transResult.data) setTransactions(transResult.data)
    if (catResult.data) setCategories(catResult.data)
    if (banksResult.data) setBankAccounts(banksResult.data)
    if (cardsResult.data) setCreditCards(cardsResult.data)
    setLoading(false)
  }, [profile?.household_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeSubscription('transactions', profile?.household_id ?? null, fetchData)

  useEffect(() => {
    setPage(1)
  }, [
    filters.search,
    filters.type,
    filters.categoryId,
    filters.startDate,
    filters.endDate,
  ])

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    const transaction = transactions.find((t) => t.id === id)
    if (transaction?.bank_account_id) {
      const { data: account } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', transaction.bank_account_id)
        .maybeSingle()

      if (account) {
        const balanceChange = transaction.type === 'income'
          ? -transaction.amount
          : transaction.amount
        await supabase
          .from('bank_accounts')
          .update({ current_balance: account.current_balance + balanceChange })
          .eq('id', transaction.bank_account_id)
      }
    }
    await supabase.from('transactions').delete().eq('id', id)
    fetchData()
  }

  function getCategoryName(id: string | null) {
    return categories.find((c) => c.id === id)?.name || 'Sem categoria'
  }

  function getBankAccountName(id: string | null) {
    if (!id) return '-'
    return bankAccounts.find((b) => b.id === id)?.name || '-'
  }

  function applyFilters(data: Transaction[]) {
    return data.filter((t) => {
      if (filters.type && t.type !== filters.type) return false
      if (filters.categoryId && t.category_id !== filters.categoryId)
        return false
      if (filters.startDate && t.date < filters.startDate) return false
      if (filters.endDate && t.date > filters.endDate) return false
      if (
        filters.search &&
        !t.description
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())
      )
        return false
      return true
    })
  }

  function exportCSV() {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Valor']
    const rows = applyFilters(transactions).map((t) => [
      formatDate(t.date),
      t.type === 'income' ? 'Entrada' : 'Saída',
      t.description || '',
      getCategoryName(t.category_id),
      getBankAccountName(t.bank_account_id),
      t.type === 'income'
        ? formatCurrency(t.amount)
        : `-${formatCurrency(t.amount)}`,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredTransactions = applyFilters(transactions)
  const pageCount = Math.ceil(filteredTransactions.length / PAGE_SIZE)
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      header: 'Data',
      sortable: true,
      render: (t) => (
        <span className="text-sm text-text-primary font-mono">
          {formatDate(t.date)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t) => (
        <Badge variant={t.type === 'income' ? 'success' : 'danger'}>
          {t.type === 'income' ? 'Entrada' : 'Saída'}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (t) => (
        <span className="text-sm font-medium text-text-primary">
          {t.description || '-'}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      hideOnMobile: true,
      render: (t) => (
        <span className="text-sm text-text-muted">
          {getCategoryName(t.category_id)}
        </span>
      ),
    },
    {
      key: 'bankAccount',
      header: 'Conta',
      hideOnMobile: true,
      render: (t) => (
        <span className="text-sm text-text-muted">
          {getBankAccountName(t.bank_account_id)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      sortable: true,
      className: 'text-right font-mono',
      render: (t) => (
        <span
          className={`text-sm font-medium ${
            t.type === 'income' ? 'text-success' : 'text-text-primary'
          }`}
        >
          {t.type === 'income' ? '' : '-'}
          {formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => {
              setEditingTransaction(t)
              setShowForm(true)
            }}
            className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-accent transition-colors"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(t.id)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-danger transition-colors"
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Transações"
        description="Todas as movimentações financeiras"
        action={
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
              aria-label="Exportar CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => {
                setEditingTransaction(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova transação</span>
            </button>
          </div>
        }
      />

      <TransactionFilters categories={categories} onFilterChange={setFilters} />

      {!loading && filteredTransactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação ainda"
          description="Adicione sua primeira movimentação financeira."
          action={
            <button
              onClick={() => {
                setEditingTransaction(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova transação
            </button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginatedTransactions}
            loading={loading}
            emptyMessage="Nenhuma transação encontrada."
          />
          <Pagination page={page} totalPages={pageCount} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTransaction(null)
        }}
        title={editingTransaction ? 'Editar transação' : 'Nova transação'}
      >
        <TransactionForm
          categories={categories}
          bankAccounts={bankAccounts}
          creditCards={creditCards}
          editingTransaction={editingTransaction}
          onSuccess={() => {
            setShowForm(false)
            setEditingTransaction(null)
            fetchData()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
        />
      </Modal>
    </>
  )
}