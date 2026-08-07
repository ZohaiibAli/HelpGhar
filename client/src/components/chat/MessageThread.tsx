import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  Ban,
  Loader2,
  MoreVertical,
  ShieldOff,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage, ChatThread } from "@/services/messagingService";
import { ChatAvatar } from "./ChatAvatar";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import {
  formatDaySeparator,
  formatLastSeen,
  startsNewDay,
  startsNewGroup,
} from "./chatFormat";

// How close to the bottom still counts as "reading the newest messages".
// Inside this band a new message scrolls into view; outside it, the user is
// reading history and gets a jump button instead of having the view yanked.
const STICK_TO_BOTTOM_PX = 120;

// Distance from the top that triggers loading the previous page.
const LOAD_OLDER_PX = 80;

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
      <span className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      {name} is typing…
    </div>
  );
}

export function MessageThread({
  thread,
  messages,
  myRole,
  loading,
  hasMore,
  loadingOlder,
  typing,
  onBack,
  onLoadOlder,
  onSend,
  onSendFiles,
  onTyping,
  onDeleteMessage,
  onRetryMessage,
  onClearThread,
  onToggleBlock,
}: {
  thread: ChatThread;
  messages: ChatMessage[];
  myRole: string;
  loading: boolean;
  hasMore: boolean;
  loadingOlder: boolean;
  typing: boolean;
  onBack: () => void;
  onLoadOlder: () => void;
  onSend: (text: string) => Promise<void>;
  onSendFiles: (files: File[], text: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
  onRetryMessage: (clientId: string) => void;
  onClearThread: () => void;
  onToggleBlock: (blocked: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);

  // Remembered across a prepend so the viewport can be re-anchored to the
  // same message after older history is spliced in above it.
  const previousScrollHeight = useRef<number | null>(null);
  const stickToBottom = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const node = scrollRef.current;

    if (!node) return;

    node.scrollTo({ top: node.scrollHeight, behavior });
    stickToBottom.current = true;
    setShowJumpButton(false);
  }, []);

  const handleScroll = () => {
    const node = scrollRef.current;

    if (!node) return;

    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;

    stickToBottom.current = distanceFromBottom <= STICK_TO_BOTTOM_PX;
    setShowJumpButton(!stickToBottom.current);

    if (node.scrollTop <= LOAD_OLDER_PX && hasMore && !loadingOlder) {
      previousScrollHeight.current = node.scrollHeight;
      onLoadOlder();
    }
  };

  // Runs before paint, so neither correction is ever visible as a jump.
  useLayoutEffect(() => {
    const node = scrollRef.current;

    if (!node) return;

    if (previousScrollHeight.current !== null) {
      // Older page was prepended: shift down by exactly how much taller the
      // content got, leaving the message the user was reading in place.
      node.scrollTop += node.scrollHeight - previousScrollHeight.current;
      previousScrollHeight.current = null;
      return;
    }

    if (stickToBottom.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  // Switching conversations always starts at the newest message.
  useEffect(() => {
    stickToBottom.current = true;
    setShowJumpButton(false);
    scrollToBottom();
  }, [thread.threadId, scrollToBottom]);

  const participant = thread.participant;

  const blocked = thread.blockedByMe || thread.blockedByThem;

  const composerReason = thread.blockedByMe
    ? `You blocked ${participant.name}. Unblock them to send a message.`
    : thread.blockedByThem
      ? "You can no longer send messages in this conversation."
      : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* ---------- Header ---------- */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <ChatAvatar
          name={participant.name}
          src={participant.avatar}
          online={participant.online}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{participant.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {typing
              ? "typing…"
              : participant.online
                ? "Online"
                : formatLastSeen(participant.lastSeenAt)}
            {participant.category ? ` • ${participant.category}` : ""}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Conversation options"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Only offered when there is a real page behind it: the public
                profile is routed by gig id, and a worker with no active
                listing has none. */}
            {participant.role === "worker" && participant.profileId && (
              <>
                <DropdownMenuItem asChild>
                  <Link to={`/workers/${participant.profileId}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    View profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onSelect={() => onToggleBlock(!thread.blockedByMe)}>
              {thread.blockedByMe ? (
                <>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Unblock {participant.name.split(" ")[0]}
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Block {participant.name.split(" ")[0]}
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={onClearThread}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ---------- Messages ---------- */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full space-y-2 overflow-y-auto px-3 py-4 sm:px-5"
        >
          {loadingOlder && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!hasMore && !loading && messages.length > 0 && (
            <p className="pb-2 text-center text-[11px] text-muted-foreground">
              This is the beginning of your conversation with {participant.name}.
            </p>
          )}

          {loading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <ChatAvatar
                name={participant.name}
                src={participant.avatar}
                size="lg"
                showPresence={false}
              />
              <p className="text-sm font-bold">{participant.name}</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Send a message to discuss the job, agree a price or confirm
                timings before booking.
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];

            const mine = message.senderRole === myRole;
            const newDay = startsNewDay(message, previous);

            // The bubble carries a tail when it ends a run -- either the
            // next message is from the other person, or a new day starts.
            const endsGroup = !next || startsNewGroup(next, message) || startsNewDay(next, message);

            return (
              <div key={message.messageId}>
                {newDay && (
                  <div className="my-4 flex items-center justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                      {formatDaySeparator(message.createdAt)}
                    </span>
                  </div>
                )}

                <MessageBubble
                  message={message}
                  mine={mine}
                  showTail={endsGroup}
                  onDelete={onDeleteMessage}
                  onRetry={onRetryMessage}
                />
              </div>
            );
          })}

          {typing && <TypingIndicator name={participant.name.split(" ")[0]} />}
        </div>

        {showJumpButton && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            aria-label="Jump to latest message"
            className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-card transition hover:bg-accent"
          >
            <ArrowDown className="h-4 w-4" />
            {thread.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {thread.unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ---------- Composer ---------- */}
      <MessageComposer
        disabled={blocked}
        disabledReason={composerReason}
        onSend={onSend}
        onSendFiles={onSendFiles}
        onTyping={onTyping}
      />
    </div>
  );
}
