import type { ChatMessage } from "@/services/messagingService";

/**
 * Timestamps arrive as UTC ISO strings from the API and are rendered in the
 * viewer's own timezone -- a worker in Karachi and a customer travelling
 * abroad each see the time on their own clock, which is what every chat app
 * does and what people expect when arranging a visit.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysAgo(iso: string): number {
  const then = startOfDay(new Date(iso));
  const today = startOfDay(new Date());

  return Math.round((today - then) / DAY);
}

/** "3:45 PM" — the time printed under an individual bubble. */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Compact stamp for the inbox row: time today, weekday this week, date beyond. */
export function formatThreadTime(iso: string | null): string {
  if (!iso) return "";

  const days = daysAgo(iso);

  if (days <= 0) return formatMessageTime(iso);
  if (days === 1) return "Yesterday";
  if (days < 7) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
  }

  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: days > 365 ? "numeric" : undefined,
  });
}

/** The sticky "Today" / "Yesterday" / "12 Mar 2025" divider between days. */
export function formatDaySeparator(iso: string): string {
  const days = daysAgo(iso);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";

  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: days > 365 ? "numeric" : undefined,
  });
}

export function formatLastSeen(iso: string | null): string {
  if (!iso) return "Offline";

  const elapsed = Date.now() - new Date(iso).getTime();

  if (elapsed < 2 * MINUTE) return "Active just now";
  if (elapsed < 60 * MINUTE) {
    return `Active ${Math.round(elapsed / MINUTE)} min ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.round(elapsed / (60 * MINUTE));
    return `Active ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return `Last seen ${formatThreadTime(iso)}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Consecutive messages from the same person within a couple of minutes read
 * as one utterance, so only the first of the run carries an avatar and the
 * last carries a timestamp. Same grouping rule WhatsApp and Slack use.
 */
const GROUPING_WINDOW_MS = 3 * MINUTE;

export function startsNewGroup(
  message: ChatMessage,
  previous: ChatMessage | undefined
): boolean {
  if (!previous) return true;
  if (previous.senderRole !== message.senderRole) return true;

  return (
    new Date(message.createdAt).getTime() -
      new Date(previous.createdAt).getTime() >
    GROUPING_WINDOW_MS
  );
}

export function startsNewDay(
  message: ChatMessage,
  previous: ChatMessage | undefined
): boolean {
  if (!previous) return true;

  return (
    startOfDay(new Date(message.createdAt)) !==
    startOfDay(new Date(previous.createdAt))
  );
}
