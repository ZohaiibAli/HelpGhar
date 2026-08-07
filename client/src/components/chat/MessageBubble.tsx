import { AlertCircle, Check, CheckCheck, Clock, Download, FileText, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/services/messagingService";
import { formatFileSize, formatMessageTime } from "./chatFormat";

/**
 * Delivery state, shown only on your own messages -- the same convention as
 * WhatsApp, where a tick on the other person's message would be meaningless.
 *
 *   clock       still in flight
 *   one tick    stored on the server
 *   two ticks   the other person has opened the thread
 */
function DeliveryState({ message }: { message: ChatMessage }) {
  if (message.failed) {
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-label="Not sent" />;
  }

  if (message.pending) {
    return <Clock className="h-3.5 w-3.5 opacity-60" aria-label="Sending" />;
  }

  if (message.readAt) {
    return <CheckCheck className="h-3.5 w-3.5 text-sky-300" aria-label="Read" />;
  }

  return <Check className="h-3.5 w-3.5 opacity-70" aria-label="Sent" />;
}

function Attachment({
  attachment,
  mine,
}: {
  attachment: ChatMessage["attachments"][number];
  mine: boolean;
}) {
  if (attachment.type === "image") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          loading="lazy"
          className="max-h-72 w-full max-w-xs object-cover transition hover:opacity-90"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
        mine
          ? "border-primary-foreground/25 hover:bg-primary-foreground/10"
          : "border-border hover:bg-accent"
      }`}
    >
      <FileText className="h-6 w-6 shrink-0 opacity-80" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">
          {attachment.name}
        </span>
        <span className="block text-[10px] opacity-70">
          {formatFileSize(attachment.size)}
        </span>
      </span>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}

export function MessageBubble({
  message,
  mine,
  showTail,
  onDelete,
  onRetry,
}: {
  message: ChatMessage;
  mine: boolean;
  showTail: boolean;
  onDelete: (messageId: string) => void;
  onRetry: (clientId: string) => void;
}) {
  const hasAttachments = message.attachments.length > 0;

  return (
    <div
      className={`group flex w-full gap-2 ${mine ? "justify-end" : "justify-start"}`}
    >
      {/* Delete sits outside the bubble and only appears on hover/focus, so
          it never covers the message text on narrow screens. */}
      {mine && !message.deleted && !message.pending && (
        <button
          type="button"
          onClick={() => onDelete(message.messageId)}
          aria-label="Delete message"
          title="Delete message"
          className="mt-1 self-center rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive focus:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] ${
          mine ? "items-end" : "items-start"
        } flex flex-col gap-1`}
      >
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-soft ${
            message.deleted
              ? "border border-dashed border-border bg-transparent italic text-muted-foreground"
              : mine
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground"
          } ${
            // Squared-off corner on the last bubble of a run points at the
            // sender, which is what makes a stack read as one speaker.
            showTail ? (mine ? "rounded-br-md" : "rounded-bl-md") : ""
          } ${message.failed ? "opacity-70 ring-1 ring-destructive" : ""}`}
        >
          {message.deleted ? (
            <span>This message was deleted</span>
          ) : (
            <>
              {hasAttachments && (
                <div className="mb-1 space-y-2">
                  {message.attachments.map((attachment) => (
                    <Attachment
                      key={attachment.url}
                      attachment={attachment}
                      mine={mine}
                    />
                  ))}
                </div>
              )}

              {message.text && (
                // `whitespace-pre-wrap` keeps the sender's line breaks, and
                // `break-words` stops an unbroken URL from widening the whole
                // column past the viewport.
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              )}
            </>
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground ${
            mine ? "flex-row-reverse" : ""
          }`}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {mine && !message.deleted && <DeliveryState message={message} />}

          {message.failed && message.clientId && (
            <button
              type="button"
              onClick={() => onRetry(message.clientId!)}
              className="font-semibold text-destructive underline underline-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
