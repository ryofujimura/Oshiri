import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  role: 'guest' | 'user' | 'admin';
  setUser: (user: User | null) => void;
  setRole: (role: 'guest' | 'user' | 'admin') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: 'guest',
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role })
}));
