import { create } from 'zustand';

interface UIState {
  currentSection: string;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  rebeccaOpen: boolean;
  notificationsOpen: boolean;
  setCurrentSection: (section: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setRebeccaOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentSection: 'home',
  sidebarOpen: false,
  theme: 'light',
  rebeccaOpen: false,
  notificationsOpen: false,
  setCurrentSection: (currentSection) => set({ currentSection }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setRebeccaOpen: (rebeccaOpen) => set({ rebeccaOpen }),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
}));
