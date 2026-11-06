import { useEffect } from "react";
import { TOKEN_KEY, getToken, logoutIfExpired } from "@/lib/session";

/**
 * App-wide cleanup for a session that died while nobody was looking.
 *
 * Deliberately does NOT redirect: this is mounted on public pages (landing,
 * services, register, forgot-password) too, and those need no session. It just
 * makes sure a dead token isn't left in storage waiting to be handed to the
 * first protected page the user navigates to.
 *
 * The proactive, redirecting watcher lives in ProtectedRoute
 * (see hooks/useSessionExpiry).
 */
export default function AuthWatcher() {

    useEffect(() => {

        logoutIfExpired({ redirect: false });

        const handleStorage = (event: StorageEvent) => {

            if (event.key !== null && event.key !== TOKEN_KEY) return;

            if (getToken()) logoutIfExpired({ redirect: false });
        };

        window.addEventListener("storage", handleStorage);

        return () => window.removeEventListener("storage", handleStorage);

    }, []);

    return null;
}
