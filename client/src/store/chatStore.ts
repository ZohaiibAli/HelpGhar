import { create } from "zustand";
import {
  messagingService,
  messagingSocketUrl,
  type ChatMessage,
  type ChatRole,
  type ChatThread,
} from "@/services/messagingService";
import { hasValidSession } from "@/lib/session";
import { useAuthStore } from "@/store/authStore";

/**
 * Realtime state for customer <-> worker messaging.
 *
 * The socket is the fast path, never the only path. Every piece of state in
 * here can also be rebuilt from the REST endpoints, which is what the polling
 * fallback below does whenever the socket is not open -- on a flaky network
 * the app gets slower, not broken.
 */

type ConnectionState = "idle" | "connecting" | "open" | "reconnecting";

interface ThreadPaging {
  hasMore: boolean;
  nextCursor: string | null;
  loading: boolean;
  loaded: boolean;
}

interface ChatState {
  threads: ChatThread[];
  threadsLoading: boolean;
  threadsError: string | null;

  activeThreadId: string | null;

  messagesByThread: Record<string, ChatMessage[]>;
  pagingByThread: Record<string, ThreadPaging>;

  typingByThread: Record<string, boolean>;

  unreadTotal: number;
  connection: ConnectionState;

  connect: () => void;
  disconnect: () => void;

  fetchThreads: (search?: string) => Promise<void>;
  refreshUnread: () => Promise<void>;

  openThread: (threadId: string) => Promise<void>;
  closeThread: () => void;
  loadOlderMessages: (threadId: string) => Promise<void>;

  startThread: (payload: {
    workerId?: string;
    customerId?: string;
    bookingId?: string;
    text?: string;
  }) => Promise<ChatThread>;

  sendMessage: (threadId: string, text: string) => Promise<void>;
  sendAttachments: (
    threadId: string,
    files: File[],
    text?: string
  ) => Promise<void>;
  retryMessage: (threadId: string, clientId: string) => Promise<void>;

  markRead: (threadId: string) => Promise<void>;
  sendTyping: (threadId: string, isTyping: boolean) => void;

  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
  clearThread: (threadId: string) => Promise<void>;
  setBlocked: (threadId: string, blocked: boolean) => Promise<void>;

  reset: () => void;
}

// --------------------------------------------------------------------------
// Socket lifecycle (module-scoped: one connection per tab, not per component)
// --------------------------------------------------------------------------

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
let intentionallyClosed = false;

// Idle proxies and PaaS load balancers close silent WebSockets after 60-100s.
// A ping well inside that window keeps the connection alive.
const HEARTBEAT_MS = 25_000;

// Only used while the socket is down. Frequent enough that the app still feels
// live, slow enough that a long outage doesn't hammer the API.
const POLL_MS = 8_000;

const MAX_RECONNECT_DELAY_MS = 30_000;

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearTimer(timer: ReturnType<typeof setTimeout> | null | undefined) {
  if (timer) clearTimeout(timer);
}

function myRole(): ChatRole | null {
  const role = useAuthStore.getState().user?.role;

  return role === "customer" || role === "worker" ? role : null;
}

function newClientId(): string {
  // randomUUID needs a secure context; plain http on a LAN IP during
  // development is not one, so fall back rather than throw.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Ascending by time, deduped, with optimistic bubbles reconciled by clientId. */
function upsertMessage(list: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const index = list.findIndex(
    (item) =>
      item.messageId === incoming.messageId ||
      (!!incoming.clientId && item.clientId === incoming.clientId)
  );

  const next = [...list];

  if (index >= 0) {
    // The server copy is authoritative; drop the local-only flags with it.
    next[index] = { ...next[index], ...incoming, pending: false, failed: false };
  } else {
    next.push(incoming);
  }

  return next.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function sortThreads(threads: ChatThread[]): ChatThread[] {
  return [...threads].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export const useChatStore = create<ChatState>()((set, get) => {
  // ------------------------------------------------------------------
  // Socket event handling
  // ------------------------------------------------------------------

  function applyIncomingMessage(threadId: string, message: ChatMessage) {
    const state = get();
    const role = myRole();
    const isMine = !!role && message.senderRole === role;
    const isActive = state.activeThreadId === threadId;

    // Only grow a thread we have already loaded. For a thread the user has
    // never opened, the inbox preview is enough -- its history will be
    // fetched in full the moment they open it.
    const existing = state.messagesByThread[threadId];

    if (existing || isActive) {
      set({
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: upsertMessage(existing ?? [], message),
        },
      });
    }

    const known = state.threads.find((thread) => thread.threadId === threadId);

    if (!known) {
      // First message from someone new -- pull the whole thread so the
      // inbox has their name and avatar.
      messagingService
        .getThread(threadId)
        .then((thread) => {
          set((current) => ({
            threads: sortThreads([
              thread,
              ...current.threads.filter((item) => item.threadId !== threadId),
            ]),
          }));
        })
        .catch(() => undefined);
    } else {
      set((current) => ({
        threads: sortThreads(
          current.threads.map((thread) =>
            thread.threadId === threadId
              ? {
                  ...thread,
                  lastMessage: {
                    text: message.text || previewForAttachments(message),
                    type: message.type,
                    senderRole: message.senderRole,
                    senderId: message.senderId,
                    createdAt: message.createdAt,
                    deleted: message.deleted,
                  },
                  lastMessageAt: message.createdAt,
                  unreadCount:
                    isMine || isActive
                      ? thread.unreadCount
                      : thread.unreadCount + 1,
                }
              : thread
          )
        ),
      }));
    }

    // Reading the thread you are already looking at should clear it, but only
    // while the tab is actually in front of the user -- otherwise messages
    // that arrive on a background tab get silently marked as read.
    if (isActive && !isMine && document.visibilityState === "visible") {
      get().markRead(threadId);
    }
  }

  function handleEvent(event: any) {
    switch (event?.type) {
      case "message:new":
        applyIncomingMessage(event.threadId, event.message);
        break;

      case "message:read": {
        const state = get();
        const list = state.messagesByThread[event.threadId];

        if (!list) break;

        const ids = new Set<string>(event.messageIds ?? []);
        const readAt = new Date().toISOString();

        set({
          messagesByThread: {
            ...state.messagesByThread,
            [event.threadId]: list.map((message) =>
              ids.has(message.messageId) ? { ...message, readAt } : message
            ),
          },
        });
        break;
      }

      case "message:deleted": {
        const state = get();
        const list = state.messagesByThread[event.threadId];

        if (!list) break;

        set({
          messagesByThread: {
            ...state.messagesByThread,
            [event.threadId]: list.map((message) =>
              message.messageId === event.messageId
                ? { ...message, deleted: true, text: "", attachments: [] }
                : message
            ),
          },
        });
        break;
      }

      case "typing": {
        const threadId = event.threadId;

        clearTimer(typingTimers.get(threadId));

        set((state) => ({
          typingByThread: { ...state.typingByThread, [threadId]: !!event.isTyping },
        }));

        if (event.isTyping) {
          // A "stopped typing" frame can be lost (tab closed mid-sentence,
          // socket dropped). Expiring the indicator locally means it can
          // never stick on screen forever.
          typingTimers.set(
            threadId,
            setTimeout(() => {
              set((state) => ({
                typingByThread: { ...state.typingByThread, [threadId]: false },
              }));
            }, 5_000)
          );
        }
        break;
      }

      case "presence": {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.participant.id === event.id &&
            thread.participant.role === event.role
              ? {
                  ...thread,
                  participant: { ...thread.participant, online: !!event.online },
                }
              : thread
          ),
        }));
        break;
      }

      case "thread:updated":
        messagingService
          .getThread(event.threadId)
          .then((thread) => {
            set((state) => ({
              threads: sortThreads(
                state.threads.map((item) =>
                  item.threadId === thread.threadId ? thread : item
                )
              ),
            }));
          })
          .catch(() => undefined);
        break;

      case "unread":
        set({ unreadTotal: event.total ?? 0 });
        break;

      default:
        break;
    }
  }

  function previewForAttachments(message: ChatMessage): string {
    if (!message.attachments?.length) return "";

    if (message.attachments.length === 1) {
      return message.attachments[0].type === "image"
        ? "📷 Photo"
        : `📎 ${message.attachments[0].name}`;
    }

    return `📎 ${message.attachments.length} attachments`;
  }

  // ------------------------------------------------------------------
  // Fallback polling — runs only while the socket is down
  // ------------------------------------------------------------------

  function startPolling() {
    if (pollTimer) return;

    pollTimer = setInterval(() => {
      if (!hasValidSession()) return;

      get().fetchThreads();
      get().refreshUnread();

      const activeThreadId = get().activeThreadId;

      if (activeThreadId) {
        // Newest page only: anything older is already on screen.
        messagingService
          .getMessages(activeThreadId)
          .then((page) => {
            const state = get();

            set({
              messagesByThread: {
                ...state.messagesByThread,
                [activeThreadId]: page.messages.reduce(
                  upsertMessage,
                  state.messagesByThread[activeThreadId] ?? []
                ),
              },
            });
          })
          .catch(() => undefined);
      }
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function scheduleReconnect() {
    if (intentionallyClosed || reconnectTimer) return;

    // Exponential backoff with a ceiling, so a server restart doesn't get
    // hit by every open tab at once, and a long outage settles into a
    // 30s retry instead of a tight loop.
    const delay = Math.min(
      1_000 * 2 ** reconnectAttempts,
      MAX_RECONNECT_DELAY_MS
    );

    reconnectAttempts += 1;

    set({ connection: "reconnecting" });

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      get().connect();
    }, delay);
  }

  return {
    threads: [],
    threadsLoading: false,
    threadsError: null,
    activeThreadId: null,
    messagesByThread: {},
    pagingByThread: {},
    typingByThread: {},
    unreadTotal: 0,
    connection: "idle",

    connect: () => {
      if (!hasValidSession() || !myRole()) return;

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const url = messagingSocketUrl();

      if (!url) return;

      intentionallyClosed = false;

      set({ connection: reconnectAttempts ? "reconnecting" : "connecting" });

      let ws: WebSocket;

      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      socket = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        set({ connection: "open" });

        stopPolling();

        // The socket may have been down long enough to miss messages;
        // resync from the source of truth on every (re)connect.
        get().fetchThreads();

        const activeThreadId = get().activeThreadId;

        if (activeThreadId) {
          get().openThread(activeThreadId);
        }

        heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, HEARTBEAT_MS);
      };

      ws.onmessage = (raw) => {
        try {
          handleEvent(JSON.parse(raw.data));
        } catch {
          // A frame we can't parse is not worth tearing the socket down for.
        }
      };

      ws.onclose = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        socket = null;

        if (intentionallyClosed) {
          set({ connection: "idle" });
          return;
        }

        startPolling();
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose always follows; reconnecting from both would double up.
        ws.close();
      };
    },

    disconnect: () => {
      intentionallyClosed = true;

      clearTimer(reconnectTimer);
      reconnectTimer = null;
      reconnectAttempts = 0;

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      stopPolling();

      socket?.close();
      socket = null;

      set({ connection: "idle" });
    },

    fetchThreads: async (search?: string) => {
      if (!hasValidSession()) return;

      set({ threadsLoading: get().threads.length === 0, threadsError: null });

      try {
        const threads = await messagingService.listThreads(search);

        set({ threads: sortThreads(threads), threadsLoading: false });
      } catch (error: any) {
        set({
          threadsLoading: false,
          threadsError: error?.message ?? "Could not load conversations",
        });
      }
    },

    refreshUnread: async () => {
      if (!hasValidSession()) return;

      try {
        set({ unreadTotal: await messagingService.unreadCount() });
      } catch {
        // A failed badge refresh is not worth surfacing to the user.
      }
    },

    openThread: async (threadId: string) => {
      set({ activeThreadId: threadId });

      const paging = get().pagingByThread[threadId];

      set({
        pagingByThread: {
          ...get().pagingByThread,
          [threadId]: {
            hasMore: paging?.hasMore ?? false,
            nextCursor: paging?.nextCursor ?? null,
            loaded: paging?.loaded ?? false,
            loading: true,
          },
        },
      });

      try {
        const page = await messagingService.getMessages(threadId);

        const state = get();

        set({
          messagesByThread: {
            ...state.messagesByThread,
            // Merged rather than replaced so an optimistic bubble sent
            // moments ago isn't wiped out by a slower history response.
            [threadId]: page.messages.reduce(
              upsertMessage,
              state.messagesByThread[threadId] ?? []
            ),
          },
          pagingByThread: {
            ...state.pagingByThread,
            [threadId]: {
              hasMore: page.hasMore,
              nextCursor: page.nextCursor,
              loading: false,
              loaded: true,
            },
          },
        });

        await get().markRead(threadId);
      } catch {
        set({
          pagingByThread: {
            ...get().pagingByThread,
            [threadId]: {
              hasMore: false,
              nextCursor: null,
              loading: false,
              loaded: true,
            },
          },
        });
      }
    },

    closeThread: () => set({ activeThreadId: null }),

    loadOlderMessages: async (threadId: string) => {
      const paging = get().pagingByThread[threadId];

      if (!paging?.hasMore || paging.loading || !paging.nextCursor) return;

      set({
        pagingByThread: {
          ...get().pagingByThread,
          [threadId]: { ...paging, loading: true },
        },
      });

      try {
        const page = await messagingService.getMessages(
          threadId,
          paging.nextCursor
        );

        const state = get();

        set({
          messagesByThread: {
            ...state.messagesByThread,
            [threadId]: page.messages.reduce(
              upsertMessage,
              state.messagesByThread[threadId] ?? []
            ),
          },
          pagingByThread: {
            ...state.pagingByThread,
            [threadId]: {
              hasMore: page.hasMore,
              nextCursor: page.nextCursor,
              loading: false,
              loaded: true,
            },
          },
        });
      } catch {
        set({
          pagingByThread: {
            ...get().pagingByThread,
            [threadId]: { ...paging, loading: false },
          },
        });
      }
    },

    startThread: async (payload) => {
      const { thread } = await messagingService.startThread(payload);

      set((state) => ({
        threads: sortThreads([
          thread,
          ...state.threads.filter((item) => item.threadId !== thread.threadId),
        ]),
      }));

      return thread;
    },

    sendMessage: async (threadId: string, text: string) => {
      const trimmed = text.trim();

      if (!trimmed) return;

      const role = myRole();

      if (!role) return;

      const user = useAuthStore.getState().user;
      const clientId = newClientId();

      const optimistic: ChatMessage = {
        messageId: `pending-${clientId}`,
        threadId,
        senderRole: role,
        senderId: (role === "customer" ? user?.customerId : user?.workerId) ?? "",
        senderName: user?.fullName ?? "",
        type: "text",
        text: trimmed,
        attachments: [],
        bookingId: null,
        clientId,
        createdAt: new Date().toISOString(),
        readAt: null,
        deleted: false,
        pending: true,
      };

      set((state) => ({
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: upsertMessage(
            state.messagesByThread[threadId] ?? [],
            optimistic
          ),
        },
      }));

      get().sendTyping(threadId, false);

      try {
        const saved = await messagingService.sendMessage(threadId, {
          text: trimmed,
          clientId,
        });

        set((state) => ({
          messagesByThread: {
            ...state.messagesByThread,
            [threadId]: upsertMessage(
              state.messagesByThread[threadId] ?? [],
              saved
            ),
          },
        }));
      } catch (error) {
        // Left on screen and flagged, not dropped -- the user can retry
        // without retyping, and the clientId makes that retry safe.
        set((state) => ({
          messagesByThread: {
            ...state.messagesByThread,
            [threadId]: (state.messagesByThread[threadId] ?? []).map((message) =>
              message.clientId === clientId
                ? { ...message, pending: false, failed: true }
                : message
            ),
          },
        }));

        throw error;
      }
    },

    retryMessage: async (threadId: string, clientId: string) => {
      const message = (get().messagesByThread[threadId] ?? []).find(
        (item) => item.clientId === clientId
      );

      if (!message || !message.failed) return;

      set((state) => ({
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: (state.messagesByThread[threadId] ?? []).map((item) =>
            item.clientId === clientId
              ? { ...item, failed: false, pending: true }
              : item
          ),
        },
      }));

      try {
        // Same clientId as the original attempt: if the first request did
        // reach the server after all, this returns that message instead of
        // posting a second copy.
        const saved = await messagingService.sendMessage(threadId, {
          text: message.text,
          clientId,
        });

        set((state) => ({
          messagesByThread: {
            ...state.messagesByThread,
            [threadId]: upsertMessage(
              state.messagesByThread[threadId] ?? [],
              saved
            ),
          },
        }));
      } catch {
        set((state) => ({
          messagesByThread: {
            ...state.messagesByThread,
            [threadId]: (state.messagesByThread[threadId] ?? []).map((item) =>
              item.clientId === clientId
                ? { ...item, pending: false, failed: true }
                : item
            ),
          },
        }));
      }
    },

    sendAttachments: async (threadId: string, files: File[], text = "") => {
      if (!files.length) return;

      const saved = await messagingService.sendAttachments(
        threadId,
        files,
        text.trim(),
        newClientId()
      );

      set((state) => ({
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: upsertMessage(
            state.messagesByThread[threadId] ?? [],
            saved
          ),
        },
      }));
    },

    markRead: async (threadId: string) => {
      const thread = get().threads.find((item) => item.threadId === threadId);

      if (thread && thread.unreadCount === 0) return;

      // Optimistic: the badge should clear the instant the thread opens.
      set((state) => ({
        threads: state.threads.map((item) =>
          item.threadId === threadId ? { ...item, unreadCount: 0 } : item
        ),
        unreadTotal: Math.max(0, state.unreadTotal - (thread?.unreadCount ?? 0)),
      }));

      try {
        await messagingService.markRead(threadId);
      } catch {
        get().refreshUnread();
      }
    },

    sendTyping: (threadId: string, isTyping: boolean) => {
      if (socket?.readyState !== WebSocket.OPEN) return;

      socket.send(JSON.stringify({ type: "typing", threadId, isTyping }));
    },

    deleteMessage: async (threadId: string, messageId: string) => {
      await messagingService.deleteMessage(threadId, messageId);

      set((state) => ({
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: (state.messagesByThread[threadId] ?? []).map((message) =>
            message.messageId === messageId
              ? { ...message, deleted: true, text: "", attachments: [] }
              : message
          ),
        },
      }));
    },

    clearThread: async (threadId: string) => {
      await messagingService.clearThread(threadId);

      set((state) => {
        const messagesByThread = { ...state.messagesByThread };
        delete messagesByThread[threadId];

        return {
          threads: state.threads.filter((item) => item.threadId !== threadId),
          messagesByThread,
          activeThreadId:
            state.activeThreadId === threadId ? null : state.activeThreadId,
        };
      });

      get().refreshUnread();
    },

    setBlocked: async (threadId: string, blocked: boolean) => {
      const thread = blocked
        ? await messagingService.blockThread(threadId)
        : await messagingService.unblockThread(threadId);

      set((state) => ({
        threads: state.threads.map((item) =>
          item.threadId === threadId ? { ...item, ...thread } : item
        ),
      }));
    },

    reset: () => {
      get().disconnect();

      set({
        threads: [],
        threadsLoading: false,
        threadsError: null,
        activeThreadId: null,
        messagesByThread: {},
        pagingByThread: {},
        typingByThread: {},
        unreadTotal: 0,
        connection: "idle",
      });
    },
  };
});
