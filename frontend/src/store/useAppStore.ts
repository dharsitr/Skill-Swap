import { create } from 'zustand';

interface AppState {
  theme: 'dark' | 'light';
  mobileMenuOpen: boolean;
  developerInfoVisible: boolean;
  toggleTheme: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleDeveloperInfo: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  mobileMenuOpen: false,
  developerInfoVisible: true,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    }),
  setMobileMenuOpen: (open: boolean) => set({ mobileMenuOpen: open }),
  toggleDeveloperInfo: () => set((state) => ({ developerInfoVisible: !state.developerInfoVisible })),
}));
