import { useState, useEffect, useCallback } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { FixedBill, Category } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { MonthlyFixedPanel } from './components/MonthlyFixedPanel'
import { FixedBillForm } from './FixedBillForm'
import { useRealtimeSubscription } from '@/lib/useRealtime'

export function FixedBillsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [bills, setBills] = useState<FixedBill[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showManagement, setShowManagement] = useState(false)
  const [editingBill, setEditingBill] = useState<FixedBill | null>(null)

  const fetchData = useCallback(async () => {
    if (!profile?.household_id) return

    const [billsResult, catResult] = await Promise.all([
      supabase
        .from('fixed_bills')
        .select('*')
        .eq('household_id', profile.household_id)
        .order('due_day'),
      supabase
        .from('categories')
        .select('*')
        .eq('household_id', profile.household_id),
    ])

    if (billsResult.data) setBills(billsResult.data)
    if (catResult.data) setCategories(catResult.data)
  }, [profile?.household_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeSubscription('fixed_bills', profile?.household_id ?? null, fetchData)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta conta fixa?')) return
    await supabase.from('fixed_bills').delete().eq('id', id)
    fetchData()
  }

  async function handleToggleActive(bill: FixedBill) {
    await supabase
      .from('fixed_bills')
      .update({ is_active: !bill.is_active })
      .eq('id', bill.id)
    fetchData()
  }

  return (
    <>
      <PageHeader
        title="Contas Fixas"
        description="Gerencie contas recorrentes"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowManagement(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
              aria-label="Gerenciar contas"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Gerenciar</span>
            </button>
            <button
              onClick={() => {
                setEditingBill(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova conta</span>
            </button>
          </div>
        }
      />

      <MonthlyFixedPanel
        bills={bills}
        categories={categories}
        onAdd={() => {
          setEditingBill(null)
          setShowForm(true)
        }}
      />

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingBill(null)
        }}
        title={editingBill ? 'Editar conta fixa' : 'Nova conta fixa'}
      >
        <FixedBillForm
          categories={categories}
          editingBill={editingBill}
          onSuccess={() => {
            setShowForm(false)
            setEditingBill(null)
            fetchData()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingBill(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showManagement}
        onClose={() => setShowManagement(false)}
        title="Gerenciar contas fixas"
        size="lg"
      >
        <div className="space-y-2">
          {bills.length === 0 ? (
            <p className="text-sm text-text-muted">
              Nenhuma conta cadastrada.
            </p>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-bg p-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {bill.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Dia {bill.due_day} ·{' '}
                    {categories.find((c) => c.id === bill.category_id)?.name ||
                      'Sem categoria'}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      bill.is_active
                        ? 'bg-green-100 text-success'
                        : 'bg-gray-100 text-text-muted'
                    }`}
                  >
                    {bill.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(bill)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-light transition-colors"
                  >
                    {bill.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingBill(bill)
                      setShowManagement(false)
                      setShowForm(true)
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-text-muted hover:bg-accent-light transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-danger hover:bg-red-50 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
