import { useEffect } from "react";
import {
  EXPIRY_LEEWAY_MS,
  TOKEN_KEY,
  getToken,
  logout,
  logoutIfExpired,
  millisecondsUntilExpiry,
} from "@/lib/session";

const RECHECK_INTERVAL_MS = 30_000;

/**
 * Ends a session the moment it dies, without waiting for a request to 401.
 * A page that fires no request after load would otherwise sit there rendering
 * a dead session indefinitely.
 *
 * Mount this ONCE, in the wrapper that every logged-in page goes through
 * (ProtectedRoute) -- never per page.
 */
export function useSessionExpiry() {
  useEffect(() => {
    let expiryTimer: number | undefined;

    const check = () => logoutIfExpired();

    // The interval alone leaves a session that dies between two ticks live for
    // up to the full interval, so also fire once at the exact expiry instant.
    const scheduleExactExpiry = () => {
      window.clearTimeout(expiryTimer);

      const remaining = millisecondsUntilExpiry();

      if (!Number.isFinite(remaining)) return;

      expiryTimer = window.setTimeout(
        check,
        Math.max(remaining - EXPIRY_LEEWAY_MS, 0) + 100
      );
    };

    // Background tabs get their timers throttled, so a tab left open overnight
    // misses every tick -- re-check the instant it is foregrounded again.
    const handleFocus = () => check();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    // Another tab signed out (or cleared storage): follow it instead of
    // continuing to render a session whose token no longer exists.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== TOKEN_KEY) return;

      if (!getToken()) {
        logout("manual");
        return;
      }

      check();
      scheduleExactExpiry();
    };

    if (check()) return;

    scheduleExactExpiry();

    const interval = window.setInterval(check, RECHECK_INTERVAL_MS);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(expiryTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);
}
