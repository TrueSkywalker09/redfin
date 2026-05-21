import { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/format'
import type { CreditCard as CreditCardType, Installment } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardForm } from './CardForm'
import { InstallmentProgress } from './components/InstallmentProgress'
import { useRealtimeSubscription } from '@/lib/useRealtime'

export function CardsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [cards, setCards] = useState<CreditCardType[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!profile?.household_id) return

    setLoading(true)

    const { data: cardsData } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('household_id', profile.household_id)
      .order('name')

    if (cardsData) setCards(cardsData)

    if (cardsData && cardsData.length > 0) {
      const { data: instData } = await supabase
        .from('installments')
        .select('*')
        .in('card_id', cardsData.map(c => c.id))
      if (instData) setInstallments(instData)
    } else {
      setInstallments([])
    }

    setLoading(false)
  }, [profile?.household_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeSubscription('credit_cards', profile?.household_id ?? null, fetchData)
  useRealtimeSubscription('installments', profile?.household_id ?? null, fetchData)

  function getMonthInstallments(month: Date): Installment[] {
    return installments.filter((inst) => {
      const firstCharge = new Date(inst.first_charge_date)
      const monthsSinceFirst =
        (month.getFullYear() - firstCharge.getFullYear()) * 12 +
        (month.getMonth() - firstCharge.getMonth())
      return (
        monthsSinceFirst >= 0 &&
        monthsSinceFirst < inst.total_installments
      )
    })
  }

  const currentMonth = new Date()
  const currentMonthInstallments = getMonthInstallments(currentMonth)
  const currentMonthTotal = currentMonthInstallments.reduce(
    (sum, i) => sum + i.total_amount / i.total_installments,
    0
  )

  return (
    <>
      <PageHeader
        title="Cartões de Crédito"
        description="Gerencie cartões e parcelas"
        action={
          <button
            onClick={() => {
              setEditingCard(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo cartão</span>
          </button>
        }
      />

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Parcelas no mês
          </p>
          <p className="mt-1.5 text-xl font-semibold text-text-primary font-mono">
            {formatCurrency(currentMonthTotal)}
          </p>
          <p className="text-xs text-text-muted">
            {currentMonthInstallments.length}{' '}
            {currentMonthInstallments.length === 1
              ? 'parcela'
              : 'parcelas'}{' '}
            ativas
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Total parcelado
          </p>
          <p className="mt-1.5 text-xl font-semibold text-text-primary font-mono">
            {formatCurrency(
              installments.reduce(
                (sum, i) => sum + Number(i.total_amount),
                0
              )
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-border/60" />
          <div className="h-24 animate-pulse rounded-xl bg-border/60" />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          title="Nenhum cartão cadastrado"
          description="Adicione seus cartões de crédito para controlar parcelas."
          action={
            <button
              onClick={() => {
                setEditingCard(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar cartão
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => {
            const cardInst = installments.filter(
              (i) => i.card_id === card.id
            )
            const cardMonthTotal = cardInst.reduce(
              (sum, i) =>
                sum +
                (getMonthInstallments(currentMonth).includes(i)
                  ? i.total_amount / i.total_installments
                  : 0),
              0
            )

            return (
              <div
                key={card.id}
                className="rounded-xl border border-border bg-surface shadow-sm"
              >
                <button
                  onClick={() =>
                    setSelectedCard(
                      selectedCard === card.id ? null : card.id
                    )
                  }
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: (card.color || '#6B7C5C') + '20' }}
                    >
                      <CreditCard
                        className="h-5 w-5"
                        style={{ color: card.color || '#6B7C5C' }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {card.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        Fecha dia {card.closing_day} · Vence dia{' '}
                        {card.due_day}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary font-mono">
                        {formatCurrency(cardMonthTotal)}
                      </p>
                      <p className="text-xs text-text-muted">este mês</p>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 text-text-muted transition-transform ${
                        selectedCard === card.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded: installments */}
                {selectedCard === card.id && (
                  <div className="border-t border-border px-4 pb-4">
                    <div className="mb-3 mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCard(card)
                          setShowForm(true)
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors"
                      >
                        Editar cartão
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Excluir cartão ${card.name}?`
                            )
                          )
                            return
                          await supabase
                            .from('credit_cards')
                            .delete()
                            .eq('id', card.id)
                          fetchData()
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-red-50 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>

                    {cardInst.length === 0 ? (
                      <p className="text-sm text-text-muted py-4 text-center">
                        Nenhuma parcela cadastrada.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cardInst.map((inst) => (
                          <InstallmentProgress
                            key={inst.id}
                            installment={inst}
                            card={card}
                            onUpdate={fetchData}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingCard(null)
        }}
        title={editingCard ? 'Editar cartão' : 'Novo cartão'}
      >
        <CardForm
          editingCard={editingCard}
          onSuccess={() => {
            setShowForm(false)
            setEditingCard(null)
            fetchData()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingCard(null)
          }}
        />
      </Modal>
    </>
  )
}
