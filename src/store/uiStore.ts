import { create } from 'zustand'

interface UIState {
  sidebarExpanded: boolean
  mobileMenuOpen: boolean
  toggleSidebar: () => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarExpanded: window.innerWidth >= 1024,
  mobileMenuOpen: false,

  toggleSidebar: () =>
    set((state) => ({
      sidebarExpanded: !state.sidebarExpanded,
    })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))
