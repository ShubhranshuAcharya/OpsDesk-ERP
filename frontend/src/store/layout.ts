import { create } from 'zustand';

interface LayoutState {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activeCalendarDate: string | null; // format 'YYYY-MM-DD'
  setActiveCalendarDate: (date: string | null) => void;
  openCalendarToDate: (date: string) => void;
  pageTitle: string | null; // Override for top-bar breadcrumb, set by child routes
  setPageTitle: (title: string | null) => void;
}

const getInitialCollapsed = () => {
  try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
};

export const useLayoutStore = create<LayoutState>((set) => ({
  isSidebarCollapsed: getInitialCollapsed(),
  
  setSidebarCollapsed: (collapsed) => {
    try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch {}
    set({ isSidebarCollapsed: collapsed });
  },

  toggleSidebar: () => set((state) => {
    const next = !state.isSidebarCollapsed;
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
    return { isSidebarCollapsed: next };
  }),
  
  activeCalendarDate: null,
  setActiveCalendarDate: (date) => set({ activeCalendarDate: date }),
  
  openCalendarToDate: (date) => {
    try { localStorage.setItem('sidebar-collapsed', 'false'); } catch {}
    set({
      isSidebarCollapsed: false,
      activeCalendarDate: date
    });
  },

  pageTitle: null,
  setPageTitle: (title) => set({ pageTitle: title }),
}));
