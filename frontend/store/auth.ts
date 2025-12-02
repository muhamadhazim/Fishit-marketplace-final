import { create } from "zustand";

export type AuthState = {
  token: string | null;
  setToken: (t: string | null) => void;
};

export const useAuth = create<AuthState>()((set) => ({
  token: null,
  setToken: (t: string | null) => set({ token: t }),
}));
