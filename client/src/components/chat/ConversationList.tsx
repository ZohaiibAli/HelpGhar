import { useMemo, useState } from "react";
import { MessageSquarePlus, Search, X } from "lucide-react";
import type { ChatThread } from "@/services/messagingService";
import { ChatAvatar } from "./ChatAvatar";
import { formatThreadTime } from "./chatFormat";

function previewText(thread: ChatThread, myRole: string): string {
  const last = thread.lastMessage;

  if (!last) return "Say hello to start the conversation";

  if (last.deleted) return "This message was deleted";

  const prefix = last.senderRole === myRole ? "You: " : "";

  return `${prefix}${last.text}`;
}

export function ConversationList({
  threads,
  loading,
  activeThreadId,
  myRole,
  typingByThread,
  onSelect,
  onNewMessage,
}: {
  threads: ChatThread[];
  loading: boolean;
  activeThreadId: string | null;
  myRole: string;
  typingByThread: Record<string, boolean>;
  onSelect: (threadId: string) => void;
  onNewMessage?: () => void;
}) {
  const [query, setQuery] = useState("");

  // Filtered on the client: a user's inbox is small, and searching locally
  // keeps every keystroke instant instead of firing a request per letter.
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return threads;

    return threads.filter(
      (thread) =>
        thread.participant.name.toLowerCase().includes(needle) ||
        (thread.lastMessage?.text ?? "").toLowerCase().includes(needle)
    );
  }, [threads, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {onNewMessage && (
          <button
            type="button"
            onClick={onNewMessage}
            aria-label="New message"
            title="New message"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && threads.length === 0 && (
          <div className="space-y-1 p-3">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex animate-pulse items-center gap-3 rounded-xl p-3"
              >
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            {threads.length === 0
              ? "No conversations yet. Message a worker from their profile to get started."
              : "No conversation matches that search."}
          </p>
        )}

        <ul>
          {filtered.map((thread) => {
            const active = thread.threadId === activeThreadId;
            const unread = thread.unreadCount > 0;

            return (
              <li key={thread.threadId}>
                <button
                  type="button"
                  onClick={() => onSelect(thread.threadId)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 border-b border-border/60 px-3 py-3 text-left transition ${
                    active ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <ChatAvatar
                    name={thread.participant.name}
                    src={thread.participant.avatar}
                    online={thread.participant.online}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          unread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {thread.participant.name}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatThreadTime(thread.lastMessageAt)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${
                          typingByThread[thread.threadId]
                            ? "font-semibold text-primary"
                            : unread
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {typingByThread[thread.threadId]
                          ? "typing…"
                          : previewText(thread, myRole)}
                      </p>

                      {unread && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
