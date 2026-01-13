
import { create } from 'zustand';
import { User, Role, City, Specialty } from './types';
import { authService, dbService } from './services/supabase';

interface AppState {
  // Theme & Locale
  theme: 'light' | 'dark';
  lang: 'en' | 'ar';
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkSession: () => Promise<void>;

  // Cached Reference Data (Performance Optimization)
  cities: City[];
  specialties: Specialty[];
  fetchReferenceData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  theme: 'light',
  lang: 'en',
  user: null,
  isAuthenticated: false,
  isLoading: true,
  cities: [],
  specialties: [],

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  setLanguage: (lang) => set(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    return { lang };
  }),

  login: (user) => set({ user, isAuthenticated: true }),
  
  logout: async () => {
    await authService.signOut();
    set({ user: null, isAuthenticated: false });
  },

  checkSession: async () => {
      try {
          const session = await authService.getSession();
          if (session && session.user) {
              const user = { 
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.name,
                  role: session.user.role || Role.PATIENT,
                  phone: session.user.phone
              } as User;
              set({ user: user, isAuthenticated: true, isLoading: false });
          } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
          }
      } catch (e) {
          set({ user: null, isAuthenticated: false, isLoading: false });
      }
  },

  fetchReferenceData: async () => {
      const state = get();
      // Only fetch if empty
      if (state.cities.length === 0 || state.specialties.length === 0) {
          try {
              const [c, s] = await Promise.all([
                  dbService.getCities(),
                  dbService.getSpecialties()
              ]);
              set({ cities: c, specialties: s });
          } catch (e) {
              console.warn("Failed to preload reference data");
          }
      }
  }
}));
