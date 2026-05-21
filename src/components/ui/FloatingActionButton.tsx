import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-accent/90 active:scale-95 lg:hidden"
      aria-label="Nova transação rápida"
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
