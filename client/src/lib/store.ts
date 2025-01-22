import { create } from 'zustand';
import type { SelectUser } from "@db/schema";

interface AuthState {
  user: SelectUser | null;
  setUser: (user: SelectUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));