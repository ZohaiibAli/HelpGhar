import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";
import { TOKEN_KEY } from "@/lib/session";

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => {
        window.localStorage.setItem(TOKEN_KEY, token);
        set({ user, token });
      },
    }),
    {
      name: "hg-auth",
    }
  )
);

// Ending a session (and deciding where the user lands) belongs to
// lib/session.ts -- import { logout } from "@/lib/session" instead.
