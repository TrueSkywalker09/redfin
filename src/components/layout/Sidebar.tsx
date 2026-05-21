import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowUpDown,
  Receipt,
  CreditCard,
  Target,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Building2,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/format'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transações' },
  { to: '/fixed', icon: Receipt, label: 'Contas Fixas' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/accounts', icon: Building2, label: 'Contas Bancárias' },
  { to: '/projects', icon: Target, label: 'Projetos' },
]

export function Sidebar() {
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const signOut = useAuthStore((s) => s.signOut)
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-surface transition-all duration-200 ${
        sidebarExpanded ? 'w-sidebar' : 'w-sidebar-collapsed'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        {sidebarExpanded && (
          <span className="text-base font-semibold text-text-primary">
            Redfin
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-accent-light font-medium text-accent'
                  : 'text-text-muted hover:bg-accent-light/50 hover:text-text-primary'
              }`
            }
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {sidebarExpanded && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className="my-2 border-t border-border" />

        <NavLink
          to="/settings"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-accent-light font-medium text-accent'
                : 'text-text-muted hover:bg-accent-light/50 hover:text-text-primary'
            }`
          }
          aria-label="Configurações"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {sidebarExpanded && <span>Configurações</span>}
        </NavLink>
      </nav>

      {/* User section */}
      <div className="border-t border-border px-2 py-3">
        <button
          onClick={toggleSidebar}
          className="mb-2 flex w-full items-center justify-center rounded-lg px-3 py-2 text-text-muted hover:bg-accent-light/50 hover:text-text-primary transition-colors"
          aria-label={sidebarExpanded ? 'Recolher menu' : 'Expandir menu'}
        >
          {sidebarExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
            {profile ? getInitials(profile.full_name || 'U') : 'U'}
          </div>
          {sidebarExpanded && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {profile?.full_name || 'Usuário'}
              </p>
              <button
                onClick={() => {
                  signOut()
                  navigate('/login')
                }}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-danger transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
