import { useAuthStore } from "@/store/authStore";

/**
 * Single source of truth for "is this session still valid, and what do we do
 * when it isn't". Nothing outside this module should read the token key or
 * decide where an expired user gets sent.
 */

export const TOKEN_KEY = "token";

// zustand `persist` key holding the cached user (see store/authStore.ts).
const AUTH_STORE_KEY = "hg-auth";

// Where the login page picks up "why am I looking at a login form?". Parked in
// sessionStorage because logging out via window.location tears down the React
// tree -- a toast fired at that moment never renders.
const LOGOUT_REASON_KEY = "hg-logout-reason";

/**
 * A token this close to its `exp` is treated as already dead. Attaching a token
 * with 4 seconds left to a request just earns a 401 by the time the server
 * sees it, so we stop trusting it slightly early.
 */
export const EXPIRY_LEEWAY_MS = 30_000;

export type LogoutReason = "expired" | "unauthorized" | "manual";

export interface SessionPayload {
  exp?: number;
  role?: string;
  id?: string;
  [key: string]: unknown;
}

export interface LogoutOptions {
  /** Send the browser to the login page. Off for silent background cleanup. */
  redirect?: boolean;
  /** Override the login page worked out from the session. */
  loginPath?: string;
}

/** Message shown on the login page for each reason ("manual" says nothing). */
export const LOGOUT_MESSAGES: Record<LogoutReason, string> = {
  expired: "Your session expired. Please sign in again.",
  unauthorized: "Your session is no longer valid. Please sign in again.",
  manual: "",
};

const hasWindow = () => typeof window !== "undefined";

export function getToken(): string | null {
  if (!hasWindow()) return null;

  return window.localStorage.getItem(TOKEN_KEY);
}

/**
 * JWT segments are base64url: they use `-` and `_` instead of `+` and `/`, and
 * drop the `=` padding. Plain atob() throws on those, the decode returns null,
 * and null then reads as "expired" -- which logs people out intermittently.
 * TextDecoder keeps non-ASCII names in the payload intact.
 */
function decodeSegment(segment: string): string | null {
  try {
    const base64 = segment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(segment.length + ((4 - (segment.length % 4)) % 4), "=");

    const binary = window.atob(base64);

    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function getTokenPayload(
  token: string | null = getToken()
): SessionPayload | null {
  if (!token) return null;

  const segment = token.split(".")[1];

  if (!segment) return null;

  const json = decodeSegment(segment);

  if (!json) return null;

  try {
    const payload = JSON.parse(json);

    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Milliseconds left on the token's own `exp`, before the leeway is applied.
 * 0 when there is nothing usable, Infinity when the token carries no `exp`.
 */
export function millisecondsUntilExpiry(
  token: string | null = getToken()
): number {
  const payload = getTokenPayload(token);

  if (!payload) return 0;

  if (typeof payload.exp !== "number") return Number.POSITIVE_INFINITY;

  return Math.max(payload.exp * 1000 - Date.now(), 0);
}

export function isTokenExpired(token: string | null = getToken()): boolean {
  if (!token) return true;

  const payload = getTokenPayload(token);

  // Malformed / undecodable is never usable.
  if (!payload) return true;

  // No readable `exp` -> treat as valid; the server is the real authority.
  if (typeof payload.exp !== "number") return false;

  return payload.exp * 1000 - EXPIRY_LEEWAY_MS <= Date.now();
}

export function hasValidSession(): boolean {
  return !!getToken() && !isTokenExpired();
}

/**
 * Which login page this session belongs to. Must be read BEFORE the token is
 * cleared -- afterwards there is nothing left to tell a worker from an admin.
 */
export function loginPathForSession(): string {
  const role = getTokenPayload()?.role ?? useAuthStore.getState().user?.role;

  if (role === "worker" || role === "admin" || role === "customer") {
    return `/login/${role}`;
  }

  return "/login/customer";
}

function setLogoutReason(reason: LogoutReason) {
  if (!hasWindow()) return;

  if (reason === "manual") {
    // A deliberate sign-out explains itself; don't leave a stale notice behind.
    window.sessionStorage.removeItem(LOGOUT_REASON_KEY);
    return;
  }

  window.sessionStorage.setItem(LOGOUT_REASON_KEY, reason);
}

/** Reads the parked reason and consumes it, so it shows exactly once. */
export function takeLogoutReason(): LogoutReason | null {
  if (!hasWindow()) return null;

  const reason = window.sessionStorage.getItem(LOGOUT_REASON_KEY);

  if (!reason) return null;

  window.sessionStorage.removeItem(LOGOUT_REASON_KEY);

  return reason as LogoutReason;
}

function clearSession() {
  if (!hasWindow()) return;

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(AUTH_STORE_KEY);

  useAuthStore.setState({ user: null, token: null });
}

export function logout(
  reason: LogoutReason = "manual",
  options: LogoutOptions = {}
) {
  // Destructured first: loginPathForSession() needs the token still present.
  const { redirect = true, loginPath = loginPathForSession() } = options;

  setLogoutReason(reason);

  clearSession();

  if (redirect && hasWindow() && window.location.pathname !== loginPath) {
    window.location.assign(loginPath);
  }
}

/** Returns true if a dead session was found and cleared. */
export function logoutIfExpired(options: LogoutOptions = {}): boolean {
  if (!getToken()) return false;

  if (!isTokenExpired()) return false;

  logout("expired", options);

  return true;
}

/** 401 (rejected token) or 403 (missing bearer / wrong role). */
export function isAuthFailure(
  response?: { status?: number } | null
): boolean {
  const status = response?.status;

  return status === 401 || status === 403;
}

/** Returns true if it logged out -- the caller should bail immediately. */
export function handleAuthFailure(
  response?: { status?: number } | null
): boolean {
  if (!isAuthFailure(response)) return false;

  // No token on file means there was never a session to end. A guest
  // browsing a public page (e.g. the Jobs tab) who hits a 401/403 -- because
  // a route is misconfigured, or briefly stale during a deploy -- should
  // just see that one request fail, not get bounced to a login screen with
  // a "session expired" message for a session they never had.
  if (!getToken()) return false;

  logout(isTokenExpired() ? "expired" : "unauthorized");

  return true;
}

/** Throws on an auth failure, otherwise passes the response straight through. */
export function assertAuthorized<T extends { status?: number }>(
  response: T
): T {
  if (handleAuthFailure(response)) {
    throw new Error("Session is no longer valid");
  }

  return response;
}

/** Authorization header for the hand-rolled fetch() call sites. */
export function authHeaders(): Record<string, string> {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}
