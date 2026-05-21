import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

const TITLE_ID = 'modal-title'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const previousFocus = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        const first = modalRef.current?.querySelector<HTMLElement>(
          'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
        )
        first?.focus()
      })
    } else {
      document.body.style.overflow = ''
      previousFocus.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={`relative w-full ${sizeClasses[size]} rounded-xl border border-border bg-surface shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={TITLE_ID} className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-accent-light hover:text-text-primary transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
