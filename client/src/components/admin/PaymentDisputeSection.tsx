import { useState } from "react";
import { Loader2, RotateCcw, Scale, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authHeaders, handleAuthFailure } from "@/lib/session";
import type { Complaint } from "@/types";

type Decision = "release" | "refund";

const outcomeLabel: Record<string, { text: string; cls: string }> = {
  released: { text: "Released to worker", cls: "bg-emerald-100 text-emerald-700" },
  refunded: { text: "Refunded to customer", cls: "bg-red-100 text-red-700" },
  completed_with_pin: { text: "Completed with PIN", cls: "bg-primary-soft text-primary-dark" },
};

const decisionOf = (c: Complaint) =>
  !c.resolution ? null : typeof c.resolution === "string" ? c.resolution : c.resolution.decision;

/**
 * Worker payment disputes (customer didn't give the PIN). The admin either
 * releases the held money to the worker or refunds the customer; both
 * sides are emailed by the server.
 */
export function PaymentDisputeSection({
  disputes,
  onDecided,
}: {
  disputes: Complaint[];
  onDecided: (message: string) => void;
}) {
  const [pending, setPending] = useState<{ dispute: Complaint; decision: Decision } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const open = disputes.filter((d) => d.status !== "resolved");
  const decided = disputes.filter((d) => d.status === "resolved");

  const choose = (dispute: Complaint, decision: Decision) => {
    setPending({ dispute, decision });
    setNote("");
    setError(null);
  };

  const submit = async () => {
    if (!pending) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payment-dispute/${pending.dispute.id}/decide`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision: pending.decision, note: note.trim() || null }),
      });
      if (handleAuthFailure(response)) return;
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(typeof result.detail === "string" ? result.detail : "Could not save the decision.");
        return;
      }
      setPending(null);
      onDecided(result.message ?? "Decision saved");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const card = (c: Complaint) => {
    const outcome = decisionOf(c);
    const amount = c.amount ?? 0;
    return (
      <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold">#{c.id} • Booking {c.bookingId}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Worker {c.workerName} ({c.workerId}) vs customer {c.customerName} ({c.customerId})
            </p>
          </div>
          <span className="shrink-0 text-sm font-black">Rs. {amount.toLocaleString()}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>

        {outcome ? (
          <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${outcomeLabel[outcome]?.cls ?? "bg-secondary"}`}>
            {outcomeLabel[outcome]?.text ?? outcome}
          </span>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => choose(c, "release")}>
              <Wallet className="h-3.5 w-3.5" /> Release to worker
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg text-red-700 hover:border-red-600" onClick={() => choose(c, "refund")}>
              <RotateCcw className="h-3.5 w-3.5" /> Refund customer
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Scale className="h-4 w-4 text-primary" /> Payment disputes
        </h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
          {open.length} awaiting decision
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Workers who finished a job but didn't get the completion PIN. The payment stays held until you decide.
      </p>

      <div className="mt-4 space-y-3">
        {disputes.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No payment disputes.</p>
        )}
        {open.map(card)}
        {decided.length > 0 && open.length > 0 && <div className="h-px bg-border" />}
        {decided.map(card)}
      </div>

      {pending && (
        <Dialog open onOpenChange={(o) => !o && setPending(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pending.decision === "release" ? "Release payment to the worker?" : "Refund the customer?"}
              </DialogTitle>
              <DialogDescription>
                Dispute #{pending.dispute.id} • Booking {pending.dispute.bookingId} •{" "}
                Rs. {(pending.dispute.amount ?? 0).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <p className={`rounded-xl p-3 text-xs ${pending.decision === "release" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                {pending.decision === "release"
                  ? `The booking is completed and the payment is sent to ${pending.dispute.workerName}'s payout account (or held until they add one).`
                  : `The booking is cancelled and the full amount is refunded to ${pending.dispute.customerName}.`}{" "}
                Both sides are emailed. This can't be undone.
              </p>
              <div>
                <label htmlFor="pd-note" className="mb-1.5 block text-xs font-semibold">Note (optional, added to both emails)</label>
                <textarea
                  id="pd-note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Customer confirmed by phone that the job was done."
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={submit}
                className={`rounded-xl text-white ${pending.decision === "release" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {pending.decision === "release" ? "Release payment" : "Refund customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
