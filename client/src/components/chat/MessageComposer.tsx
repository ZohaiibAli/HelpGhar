import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, SendHorizonal, X } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "./chatFormat";

const MAX_LENGTH = 4000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Mirrors CHAT_IMAGE_TYPES / CHAT_DOCUMENT_TYPES in the server's
// cloudinary_helper. Checked here purely so the user finds out before a
// 10 MB upload, never as the actual restriction -- that stays server-side.
const ACCEPTED =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain," +
  "application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function MessageComposer({
  disabled,
  disabledReason,
  onSend,
  onSendFiles,
  onTyping,
}: {
  disabled?: boolean;
  disabledReason?: string;
  onSend: (text: string) => Promise<void>;
  onSendFiles: (files: File[], text: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Grow with the message up to a ceiling, then scroll. A fixed single-line
  // input hides everything but the last few words of a long message.
  useEffect(() => {
    const node = textareaRef.current;

    if (!node) return;

    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [text]);

  const stopTyping = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }

    if (typingRef.current) {
      typingRef.current = false;
      onTyping(false);
    }
  };

  // Unmounting mid-sentence (switching threads, navigating away) must not
  // leave a permanent "typing…" on the other person's screen.
  useEffect(() => stopTyping, []);

  const handleChange = (value: string) => {
    setText(value);

    if (!value.trim()) {
      stopTyping();
      return;
    }

    // One "started" frame per burst of typing, then a single "stopped" after
    // a pause -- rather than a socket frame per keystroke.
    if (!typingRef.current) {
      typingRef.current = true;
      onTyping(true);
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(stopTyping, 2_500);
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;

    const accepted: File[] = [];

    for (const file of Array.from(incoming)) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`"${file.name}" is larger than 10 MB.`);
        continue;
      }

      accepted.push(file);
    }

    setFiles((current) => {
      const next = [...current, ...accepted];

      if (next.length > MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} files at once.`);
      }

      return next.slice(0, MAX_FILES);
    });
  };

  const submit = async () => {
    const trimmed = text.trim();

    if (busy || disabled) return;
    if (!trimmed && files.length === 0) return;

    setBusy(true);
    stopTyping();

    try {
      if (files.length) {
        await onSendFiles(files, trimmed);
      } else {
        await onSend(trimmed);
      }

      // Cleared only after a successful send: on failure the text stays put
      // so nothing typed is ever lost to a dropped connection.
      setText("");
      setFiles([]);
      textareaRef.current?.focus();
    } catch (error: any) {
      toast.error(error?.message ?? "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  if (disabled) {
    return (
      <div className="border-t border-border bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground">
        {disabledReason ?? "You can't reply to this conversation."}
      </div>
    );
  }

  return (
    <div
      className="border-t border-border bg-card p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        addFiles(event.dataTransfer.files);
      }}
    >
      {files.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
            >
              <span className="max-w-[160px] truncate font-medium">
                {file.name}
              </span>
              <span className="text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFiles((current) => current.filter((_, i) => i !== index))
                }
                aria-label={`Remove ${file.name}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            // Reset so picking the same file twice in a row still fires.
            event.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
          title="Attach a file"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={stopTyping}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter makes a new line -- the convention
            // every chat app uses, so muscle memory works here too.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
        />

        <button
          type="button"
          onClick={submit}
          disabled={busy || (!text.trim() && files.length === 0)}
          aria-label="Send message"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </button>
      </div>

      {text.length > MAX_LENGTH - 200 && (
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {MAX_LENGTH - text.length} characters left
        </p>
      )}
    </div>
  );
}
