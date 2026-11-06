import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { hasValidSession } from "@/lib/session";

/**
 * Keeps one messaging socket alive for as long as somebody is signed in.
 *
 * Mounted once at the app root rather than on the Messages page, because the
 * unread badge in the navbar has to stay live wherever the user happens to be
 * -- a customer browsing workers should see a reply land without visiting
 * their inbox first.
 *
 * The socket is deliberately *not* torn down when a component unmounts, only
 * when the session ends: navigating between pages must not reconnect on every
 * route change.
 */
export function useChatConnection() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const { connect, reset, refreshUnread, fetchThreads } = useChatStore.getState();

    // Admins have no inbox; opening a socket for them would only be
    // rejected by the server.
    const canChat = user?.role === "customer" || user?.role === "worker";

    if (!canChat || !hasValidSession()) {
      reset();
      return;
    }

    connect();
    refreshUnread();
    fetchThreads();

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      // Coming back to a backgrounded tab: browsers throttle timers and may
      // have killed the socket without firing onclose promptly, so re-arm
      // the connection and resync rather than trusting what's on screen.
      useChatStore.getState().connect();
      useChatStore.getState().refreshUnread();
      useChatStore.getState().fetchThreads();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // Keyed on identity, not the object: a profile edit replaces `user` but
    // must not bounce the socket.
  }, [user?.id, user?.role]);
}
