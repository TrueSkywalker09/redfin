import { NavLink } from 'react-router-dom'
import {
  ArrowUpDown,
  Receipt,
  CreditCard,
  Target,
  Wallet,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: Wallet, label: 'Resumo' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transações' },
  { to: '/fixed', icon: Receipt, label: 'Fixas' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/projects', icon: Target, label: 'Projetos' },
]

export function MobileNav() {
  return (
    <nav aria-label="Navegação móvel" className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-surface px-2 pb-safe lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
              isActive
                ? 'text-accent'
                : 'text-text-muted hover:text-text-primary'
            }`
          }
          aria-label={item.label}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
