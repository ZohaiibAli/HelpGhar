import { api } from "./api";
import type { User, UserRole } from "@/types";

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload {
  fullName: string; email: string; phone: string; password: string;
  role: UserRole; address?: string;
}

export const authService = {
  login: (payload: LoginPayload) => api.post<{ token: string; user: User }>("/auth/login", payload),
  register: (payload: RegisterPayload) => api.post<{ user: User }>("/auth/register", payload),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  me: () => api.get<User>("/auth/me"),
};
