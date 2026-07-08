import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => {
        window.localStorage.setItem("token", token);
        set({ user, token });
      },
      logout: () => {
        window.localStorage.removeItem("token");
        set({ user: null, token: null });
      },
    }),
    {
      name: "hg-auth",
    }
  )
);