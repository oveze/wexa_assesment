

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (userData, token) => {
        set({ user: userData, token });
      },
      logout: () => {
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
      isRole: (role) => get().user?.role === role,
      hasRole: (roles) => roles.includes(get().user?.role)
    }),
    {
      name: 'auth-storage'
    }
  )
);
