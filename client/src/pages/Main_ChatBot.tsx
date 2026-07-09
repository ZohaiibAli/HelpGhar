import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot,
  Sparkles,
  Send,
  ArrowLeft,
  ShieldCheck,
  Star,
  MapPin,
  Plus,
  Menu,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Wrench,
  MessageSquare,
  Trash2,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────── */

interface WorkerCard {
  id: string;
  workerId: string;
  name: string;
  avatar?: string;
  category: string;
  city: string;
  rating: number;
  experience: number;
  priceMin: number;
  priceMax: number;
  priceUnit: string;
  available: boolean;
  verified: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  workers?: WorkerCard[];
  timestamp: number;
  pending?: boolean;
  error?: boolean;
}

interface SessionMeta {
  id: string;
  title: string;
  updatedAt: number;
}

const SUGGESTIONS = [
  "Find a verified electrician near me",
  "Compare tutor rates for O-levels",
  "What does deep cleaning include?",
  "How does worker verification work?",
];

const SESSIONS_KEY = "helpghar-chat-sessions";
const ACTIVE_SESSION_KEY = "helpghar-active-session";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ────────────────────────────────────────────────────────────────────────
 * Session list persistence (local to this browser)
 * ──────────────────────────────────────────────────────────────────────── */

function loadSessions(): SessionMeta[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: SessionMeta[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function upsertSession(sessions: SessionMeta[], id: string, title?: string): SessionMeta[] {
  const existing = sessions.find((s) => s.id === id);
  const next: SessionMeta = {
    id,
    title: title || existing?.title || "New chat",
    updatedAt: Date.now(),
  };
  const rest = sessions.filter((s) => s.id !== id);
  const updated = [next, ...rest];
  saveSessions(updated);
  return updated;
}

function createNewSession(sessions: SessionMeta[]): { id: string; sessions: SessionMeta[] } {
  const id = crypto.randomUUID();
  const updated = upsertSession(sessions, id, "New chat");
  return { id, sessions: updated };
}

/* ────────────────────────────────────────────────────────────────────────
 * Backend contract
 * ──────────────────────────────────────────────────────────────────────── */

async function sendChatRequest(sessionId: string, message: string) {
  const API = import.meta.env.VITE_API_BASE_URL;

  const response = await fetch(`${API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });

  if (!response.ok) throw new Error("Chat API failed");

  return await response.json();
}

async function fetchHistory(sessionId: string): Promise<ChatMessage[]> {
  const API = import.meta.env.VITE_API_BASE_URL;

  const response = await fetch(`${API}/api/chat/history/${sessionId}`);

  if (!response.ok) return [];

  const data = await response.json();

  return (data.messages || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    timestamp: m.timestamp || Date.now(),
  }));
}

async function deleteHistory(sessionId: string) {
  const API = import.meta.env.VITE_API_BASE_URL;

  try {
    await fetch(`${API}/api/chat/history/${sessionId}`, { method: "DELETE" });
  } catch {
    // best-effort; local session list is the source of truth for the sidebar either way
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * Worker recommendation card
 * ──────────────────────────────────────────────────────────────────────── */

function WorkerCardTile({ worker }: { worker: WorkerCard }) {
  return (
    <div className="flex min-w-[220px] flex-col gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10">
            {worker.avatar ? (
              <img src={worker.avatar} alt={worker.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{worker.name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-foreground">{worker.name || "Unknown Worker"}</p>
            <p className="text-[11px] text-muted-foreground">{worker.category}</p>
          </div>
        </div>
        {worker.verified && (
          <span title="Verified worker">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-foreground/80">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="font-semibold">{worker.rating?.toFixed(1) ?? "0.0"}</span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {worker.city}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-sm font-bold text-foreground">
          Rs. {worker.priceMin} - {worker.priceMax} / {worker.priceUnit}
        </span>
        <Link
          to={`/workers/${worker.id}`}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-dark active:scale-95"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Main chat page
 * ──────────────────────────────────────────────────────────────────────── */

export function ChatPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<SessionMeta[]>(() => loadSessions());

  const [sessionId, setSessionId] = useState<string>(() => {
    const active = localStorage.getItem(ACTIVE_SESSION_KEY);
    const existing = loadSessions();

    if (active && existing.some((s) => s.id === active)) {
      return active;
    }

    const { id, sessions: updated } = createNewSession(existing);
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
    setTimeout(() => setSessions(updated), 0);
    return id;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = messages.length > 0 || messagesLoading;

  // Load this session's history whenever the active session changes
  // (covers page refresh, and returning from another route like a
  // worker's profile page, since this component re-fetches on mount).
  useEffect(() => {
    let cancelled = false;

    setMessagesLoading(true);

    fetchHistory(sessionId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function resetComposer() {
    setInput("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { id: makeId(), role: "user", text, timestamp: Date.now() };
    const botMsgId = makeId();

    const isFirstMessage = messages.length === 0;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: botMsgId, role: "bot", text: "", timestamp: Date.now(), pending: true },
    ]);
    resetComposer();
    setIsStreaming(true);

    // Update the sidebar entry immediately so the title reflects the
    // first message and the session bubbles to the top of the list.
    setSessions((prev) => upsertSession(prev, sessionId, isFirstMessage ? text.slice(0, 48) : undefined));

    try {
      const response = await sendChatRequest(sessionId, text);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: response.message, workers: response.workers, pending: false }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: "Sorry, something went wrong.", pending: false, error: true }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    });
  }

  function handleNewChat() {
    const { id, sessions: updated } = createNewSession(sessions);
    setSessions(updated);
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
    setSessionId(id);
    resetComposer();
  }

  function handleSelectSession(id: string) {
    if (id === sessionId) return;
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
    setSessionId(id);
  }

  async function handleDeleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();

    await deleteHistory(id);

    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);

    if (id === sessionId) {
      if (updated.length > 0) {
        localStorage.setItem(ACTIVE_SESSION_KEY, updated[0].id);
        setSessionId(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-hero-gradient">
      {/* ─── Sidebar ─── */}
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-border/60 bg-card/70 backdrop-blur-md transition-[width] duration-200 md:block ${
          sidebarOpen ? "w-[272px]" : "w-0"
        }`}
      >
        <div className="flex h-full w-[272px] flex-col p-4">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>

          <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent chats
            </p>

            {sessions.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</p>
            )}

            {sessions
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    s.id === sessionId
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground/80 hover:bg-accent/50"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  <span
                    role="button"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
          </div>
        </div>
      </aside>

      {/* ─── Main column ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border/50 bg-card/80 px-4 py-3 backdrop-blur-md md:px-6">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            aria-label="Toggle chat history"
          >
            {sidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">HelpGhar Assistant</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Grounded in verified worker data
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </button>
        </header>

        {/* Message area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasStarted ? (
            <EmptyState onPick={sendMessage} />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
              {messagesLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading conversation…
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  copied={copiedId === msg.id}
                  onCopy={() => handleCopy(msg.id, msg.text)}
                  feedback={feedback[msg.id]}
                  onFeedback={(v) => setFeedback((f) => ({ ...f, [msg.id]: v }))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border/50 bg-card/80 px-4 py-4 backdrop-blur-md md:px-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-card transition-all focus-within:border-primary/40 focus-within:shadow-lift focus-within:ring-4 focus-within:ring-primary/5"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming}
              placeholder="Ask about a service, a worker, or a price…"
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="group/btn flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStreaming ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5 transition-transform group-hover/btn:translate-x-0.5" />
              )}
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground/60">
            Responses are generated from verified worker profiles and platform policies — always confirm price and availability before booking.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Sub-components
 * ──────────────────────────────────────────────────────────────────────── */

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        AI Concierge
      </span>
      <h1 className="mt-6 text-2xl font-black leading-tight tracking-tight text-foreground md:text-3xl">
        What do you need done?
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        Describe the job in plain words. I'll match you with verified, rated professionals — no scrolling through listings.
      </p>

      <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-left text-sm text-foreground/80 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary-dark hover:shadow-sm"
          >
            <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  copied,
  onCopy,
  feedback,
  onFeedback,
}: {
  msg: ChatMessage;
  copied: boolean;
  onCopy: () => void;
  feedback?: "up" | "down";
  onFeedback: (v: "up" | "down") => void;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-accent text-foreground/70" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <span className="text-xs font-bold">You</span> : <Bot className="h-4 w-4" />}
      </div>

      <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : msg.error
              ? "rounded-tl-sm border border-destructive/40 bg-destructive/5 text-foreground"
              : "rounded-tl-sm border border-border/60 bg-card text-foreground"
          }`}
        >
          {msg.pending ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </span>
          ) : (
            msg.text
          )}
        </div>

        {msg.workers && msg.workers.length > 0 && (
          <div className="flex w-full gap-3 overflow-x-auto pb-1 pt-1">
            {msg.workers.map((w) => (
              <WorkerCardTile key={w.id} worker={w} />
            ))}
          </div>
        )}

        {!isUser && !msg.pending && (
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={onCopy}
              className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-accent/60 hover:text-foreground"
              aria-label="Copy response"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onFeedback("up")}
              className={`rounded-lg p-1.5 transition-colors hover:bg-accent/60 ${
                feedback === "up" ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
              }`}
              aria-label="Good response"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback("down")}
              className={`rounded-lg p-1.5 transition-colors hover:bg-accent/60 ${
                feedback === "down" ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
              }`}
              aria-label="Poor response"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ChatPage;