import { authHeaders } from "@/lib/session";

// Kept for existing imports; lib/session.ts owns the token.
export const authHeader = () => authHeaders();
