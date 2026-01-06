import { create } from "zustand";
import api from "@/lib/api";

export type User = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'seller' | 'customer';
  bank_details?: {
      bank_name: string;
      account_number: string;
      account_holder: string;
  };
};

export type AuthState = {
  token: string | null;
  user: User | null;
  setToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  fetchUser: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set) => ({
  token: null,
  user: null,
  setToken: (t: string | null) => set({ token: t }),
  setUser: (u: User | null) => set({ user: u }),
  fetchUser: async () => {
      try {
          const res = await api.get('/api/auth/me');
          set({ user: res.data.user });
      } catch (e) {
          console.error("Fetch user failed", e);
          set({ user: null });
      }
  }
}));
