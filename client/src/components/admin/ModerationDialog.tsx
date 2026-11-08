import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Loader2, ShieldCheck, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/adminService";
import type { AccountStatus } from "@/types";

export type ModerationTarget = {
  role: "customer" | "worker";
  code: string; // CUS-... / WRK-...
  name: string;
  status: AccountStatus;
  suspendedUntil?: string | null;
  reason?: string | null;
};

type Action = "warn" | "suspend" | "block" | "restore";

const DAYS = [3, 7, 30] as const;

export function formatUntil(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Warn (email only), suspend (3/7/30 days), block (until restored) or
 * restore an account.
 * When opened from a complaint, `disputeId` ties the action to it so the
 * person who complained is told action was taken.
 */
export function ModerationDialog({
  target,
  disputeId,
  initialAction,
  onClose,
  onDone,
}: {
  target: ModerationTarget | null;
  disputeId?: string;
  initialAction?: Action;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [action, setAction] = useState<Action>("suspend");
  const [days, setDays] = useState<(typeof DAYS)[number]>(7);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!target) return;
    setAction(initialAction ?? (target.status === "active" ? "suspend" : "restore"));
    setDays(7);
    setReason("");
    setError(null);
  }, [target, initialAction]);

  if (!target) return null;

  const isActive = target.status === "active";
  const actions: Action[] = isActive ? ["warn", "suspend", "block"] : ["restore", "suspend", "block"];
  // A warning's note is optional; suspend/block always need a reason.
  const needsReason = action === "suspend" || action === "block";

  const submit = async () => {
    if (needsReason && !reason.trim()) {
      setError("Please write a reason. It is included in the email to the user.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await adminService.moderateUser(target.role, target.code, {
        action,
        ...(action === "suspend" ? { days } : {}),
        ...(action !== "restore" && reason.trim() ? { reason: reason.trim() } : {}),
        ...(disputeId && action !== "restore" ? { disputeId } : {}),
      });
      onDone(data.message ?? "Done");
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const label: Record<Action, string> = {
    warn: "Warn",
    suspend: "Suspend",
    block: "Block",
    restore: "Restore",
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account action: {target.name}</DialogTitle>
          <DialogDescription>
            {target.role === "worker" ? "Worker" : "Customer"} {target.code} is currently{" "}
            <strong className="text-foreground">{target.status}</strong>
            {target.status === "suspended" && target.suspendedUntil ? ` until ${formatUntil(target.suspendedUntil)}` : ""}
            {target.reason && !isActive ? ` (${target.reason})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Action">
            {actions.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={action === a}
                onClick={() => setAction(a)}
                className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold transition ${
                  action === a
                    ? a === "restore"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : a === "warn"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-red-600 bg-red-50 text-red-700"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {a === "warn" && <AlertTriangle className="h-3.5 w-3.5" />}
                {a === "suspend" && <Timer className="h-3.5 w-3.5" />}
                {a === "block" && <Ban className="h-3.5 w-3.5" />}
                {a === "restore" && <ShieldCheck className="h-3.5 w-3.5" />}
                {label[a]}
              </button>
            ))}
          </div>

          {action === "suspend" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold">Suspend for</p>
              <div className="flex gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      days === d ? "border-primary bg-primary-soft text-primary-dark" : "border-border text-muted-foreground"
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">The account is restored automatically when this ends.</p>
            </div>
          )}

          {action !== "restore" && (
            <div>
              <label htmlFor="moderation-reason" className="mb-1.5 block text-xs font-semibold">
                {action === "warn" ? "Note (optional, added to the email)" : "Reason (sent to the user)"}
              </label>
              <textarea
                id="moderation-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Repeated no-shows reported by customers"
                className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {action === "warn" && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              Sends an official warning email{disputeId ? ` about complaint ${disputeId}` : ""}. The account stays
              active — nothing is cancelled. It says another complaint will lead to a suspension.
            </p>
          )}

          {(action === "suspend" || action === "block") && target.role === "worker" && (
            <p className="rounded-xl bg-yellow-50 p-3 text-xs text-yellow-800">
              This worker's gigs will be hidden, and all their open bookings will be cancelled with a full
              refund to the customers (they'll be emailed).
            </p>
          )}

          {action === "restore" && (
            <p className="text-sm text-muted-foreground">
              The user can log in again straight away{target.role === "worker" ? " and their gigs are listed again" : ""}.
              Cancelled bookings are not brought back.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={submit}
            className={`rounded-xl text-white ${
              action === "restore"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : action === "warn"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {action === "suspend" ? `Suspend ${days} days` : action === "warn" ? "Send warning" : label[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
