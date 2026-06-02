import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  token: string;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: '',
      user: null,
      isLoggedIn: false,
      setAuth: (token, user) => set({ token, user, isLoggedIn: true }),
      clearAuth: () => set({ token: '', user: null, isLoggedIn: false }),
    }),
    {
      name: 'cls-auth-storage',
    }
  )
);
