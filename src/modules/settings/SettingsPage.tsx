import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Category } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

export function SettingsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    if (!profile?.household_id) return

    supabase
      .from('categories')
      .select('*')
      .eq('household_id', profile.household_id)
      .then(({ data }) => {
        if (data) setCategories(data)
        setLoading(false)
      })
  }, [profile?.household_id])

  async function seedDefaultCategories() {
    if (!profile?.household_id) return

    const existing = categories.map((c) => c.name)
    const toInsert = DEFAULT_CATEGORIES.filter(
      (dc) => !existing.includes(dc.name)
    ).map((dc) => ({
      household_id: profile.household_id,
      name: dc.name,
      type: dc.type,
      color: dc.color,
      icon: dc.icon,
    }))

    if (toInsert.length > 0) {
      await supabase.from('categories').insert(toInsert)
      // Refetch
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', profile.household_id)
      if (data) setCategories(data)
    }
  }

  async function handleSave() {
    if (!categoryName.trim() || !profile?.household_id) return

    try {
      if (editingCategory) {
        await supabase
          .from('categories')
          .update({ name: categoryName.trim() })
          .eq('id', editingCategory.id)
      }
      setShowForm(false)
      setEditingCategory(null)
      setCategoryName('')

      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', profile.household_id)
      if (data) setCategories(data)
    } catch (error) {
      alert('Erro ao salvar categoria. Tente novamente.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta categoria?')) return
    await supabase.from('categories').delete().eq('id', id)

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', profile?.household_id)
    if (data) setCategories(data)
  }

  const typeLabels: Record<string, string> = {
    income: 'Entrada',
    expense: 'Saída',
    both: 'Ambos',
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie categorias"
      />

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            Categorias
          </h2>
          <div className="flex gap-2">
            <button
              onClick={seedDefaultCategories}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
            >
              Restaurar padrão
            </button>
            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryName('')
                setShowForm(true)
              }}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova categoria
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded bg-border/60" />
            <div className="h-10 animate-pulse rounded bg-border/60" />
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria"
            description="Adicione categorias para classificar suas transações."
          />
        ) : (
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-accent-light/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.color || '#7A7875' }}
                  />
                  <span className="text-sm font-medium text-text-primary">
                    {cat.name}
                  </span>
                  <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs text-text-muted">
                    {typeLabels[cat.type] || cat.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(cat)
                      setCategoryName(cat.name)
                      setShowForm(true)
                    }}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-accent-light hover:text-accent transition-colors"
                    aria-label="Editar categoria"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-danger transition-colors"
                    aria-label="Excluir categoria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingCategory(null)
        }}
        title={editingCategory ? 'Editar categoria' : 'Nova categoria'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="categoryName"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Nome da categoria
            </label>
            <input
              id="categoryName"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Ex.: Assinaturas"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowForm(false)
                setEditingCategory(null)
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-accent-light/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
