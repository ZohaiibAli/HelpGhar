import { api } from "./api";
import { getToken } from "@/lib/session";

export type ChatRole = "customer" | "worker";

export interface ChatParticipant {
  id: string;
  role: ChatRole;
  name: string;
  avatar: string;
  category?: string;
  status?: string;
  lastSeenAt: string | null;
  online?: boolean;
  /**
   * Gig id backing this worker's public page (/workers/:id). Null when they
   * have no active listing, in which case there is no page to link to.
   * Customers never have one.
   */
  profileId?: string | null;
}

export interface ChatAttachment {
  url: string;
  name: string;
  type: "image" | "file";
  mime: string;
  size: number;
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  senderRole: ChatRole;
  senderId: string;
  senderName: string;
  type: "text" | "image" | "file" | "system";
  text: string;
  attachments: ChatAttachment[];
  bookingId: string | null;
  clientId: string | null;
  createdAt: string;
  readAt: string | null;
  deleted: boolean;

  /** Client-only: bubble is on screen but not yet acknowledged by the server. */
  pending?: boolean;
  /** Client-only: the send failed and can be retried. */
  failed?: boolean;
}

export interface ChatThreadPreview {
  text: string;
  type: string;
  senderRole: ChatRole;
  senderId: string;
  createdAt: string;
  deleted: boolean;
}

export interface ChatThread {
  threadId: string;
  participant: ChatParticipant;
  lastMessage: ChatThreadPreview | null;
  lastMessageAt: string;
  unreadCount: number;
  bookingId: string | null;
  blockedByMe: boolean;
  blockedByThem: boolean;
  createdAt: string;
}

export interface MessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * The socket lives on the same origin as the REST API, so its URL is derived
 * from the configured base rather than duplicated in another env var --
 * one fewer thing to get wrong between local, preview and production.
 * http -> ws and https -> wss, so a TLS deployment never downgrades.
 */
export function messagingSocketUrl(): string | null {
  const token = getToken();

  if (!token) return null;

  const base =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const url = new URL("/messages/ws", base);

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", token);

  return url.toString();
}

export const messagingService = {
  listThreads: (search?: string) =>
    api
      .get<{ threads: ChatThread[] }>("/messages/threads", {
        params: search ? { search } : undefined,
      })
      .then((res) => res.data.threads),

  getThread: (threadId: string) =>
    api
      .get<{ thread: ChatThread }>(`/messages/threads/${threadId}`)
      .then((res) => res.data.thread),

  startThread: (payload: {
    workerId?: string;
    customerId?: string;
    bookingId?: string;
    text?: string;
  }) =>
    api
      .post<{ thread: ChatThread; message: ChatMessage | null }>(
        "/messages/threads",
        payload
      )
      .then((res) => res.data),

  getMessages: (threadId: string, before?: string | null, limit = 30) =>
    api
      .get<MessagePage>(`/messages/threads/${threadId}/messages`, {
        params: { ...(before ? { before } : {}), limit },
      })
      .then((res) => res.data),

  sendMessage: (
    threadId: string,
    payload: { text: string; clientId: string; bookingId?: string | null }
  ) =>
    api
      .post<{ message: ChatMessage }>(
        `/messages/threads/${threadId}/messages`,
        payload
      )
      .then((res) => res.data.message),

  sendAttachments: (
    threadId: string,
    files: File[],
    text: string,
    clientId: string
  ) => {
    const form = new FormData();

    files.forEach((file) => form.append("files", file));
    form.append("text", text);
    form.append("clientId", clientId);

    return api
      .post<{ message: ChatMessage }>(
        `/messages/threads/${threadId}/attachments`,
        form,
        {
          // Uploads are far slower than a JSON POST; the shared 15s
          // default would abort a perfectly healthy 8 MB attachment.
          timeout: 60_000,
          headers: { "Content-Type": "multipart/form-data" },
        }
      )
      .then((res) => res.data.message);
  },

  markRead: (threadId: string) =>
    api.post(`/messages/threads/${threadId}/read`).then((res) => res.data),

  deleteMessage: (threadId: string, messageId: string) =>
    api
      .delete(`/messages/threads/${threadId}/messages/${messageId}`)
      .then((res) => res.data),

  clearThread: (threadId: string) =>
    api.delete(`/messages/threads/${threadId}`).then((res) => res.data),

  blockThread: (threadId: string) =>
    api
      .post<{ thread: ChatThread }>(`/messages/threads/${threadId}/block`)
      .then((res) => res.data.thread),

  unblockThread: (threadId: string) =>
    api
      .post<{ thread: ChatThread }>(`/messages/threads/${threadId}/unblock`)
      .then((res) => res.data.thread),

  unreadCount: () =>
    api
      .get<{ total: number }>("/messages/unread-count")
      .then((res) => res.data.total),

  contacts: () =>
    api
      .get<{ contacts: ChatParticipant[] }>("/messages/contacts")
      .then((res) => res.data.contacts),
};
