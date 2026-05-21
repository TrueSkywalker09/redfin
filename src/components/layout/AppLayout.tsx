import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useUIStore } from '@/store/uiStore'

export function AppLayout() {
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded)
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:left-4 focus:top-4 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Pular para o conteúdo principal
      </a>
      <Sidebar />
      <MobileNav />

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className={`transition-all duration-200 pb-20 lg:pb-0 outline-none ${
          sidebarExpanded ? 'lg:ml-sidebar' : 'lg:ml-sidebar-collapsed'
        }`}
      >
        <div className="mx-auto max-w-app px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  )
}
