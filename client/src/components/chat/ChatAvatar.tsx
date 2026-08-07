import { initials } from "./chatFormat";

/**
 * Avatar with a presence dot. Falls back to initials rather than a broken
 * image icon -- plenty of accounts never upload a picture.
 */
export function ChatAvatar({
  name,
  src,
  online,
  size = "md",
  showPresence = true,
}: {
  name: string;
  src?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
  showPresence?: boolean;
}) {
  const dimension =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-11 w-11";

  const dot = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${dimension} rounded-full border border-border object-cover`}
        />
      ) : (
        <div
          className={`${dimension} grid place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary`}
        >
          {initials(name)}
        </div>
      )}

      {showPresence && (
        <span
          aria-label={online ? "Online" : "Offline"}
          className={`absolute -bottom-0.5 -right-0.5 ${dot} rounded-full border-2 border-card ${
            online ? "bg-emerald-500" : "bg-muted-foreground/40"
          }`}
        />
      )}
    </div>
  );
}
