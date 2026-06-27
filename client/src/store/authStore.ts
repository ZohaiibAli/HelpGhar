import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  mockLoginAs: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      mockLoginAs: (role) =>
        set({
          token: "mock-token",
          user: {
            id: "u-" + role,
            fullName:
              role === "admin" ? "Admin User" : role === "worker" ? "Ayesha Khan" : "Hassan Iqbal",
            email: `${role}@helpghar.pk`,
            phone: "+92 300 1234567",
            role,
            createdAt: new Date().toISOString(),
          },
        }),
    }),
    { name: "hg-auth" },
  ),
);
