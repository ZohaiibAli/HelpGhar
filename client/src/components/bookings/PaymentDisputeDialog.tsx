import { useEffect, useState } from "react";
import { Loader2, Scale } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

/**
 * Worker: "I finished the job but the customer won't give me the PIN."
 * The held payment stays in escrow until an admin releases or refunds it.
 */
export function PaymentDisputeDialog({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: { id: string; customerName?: string; amount?: number; total?: number } | null;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDescription("");
    setError(null);
  }, [booking?.id]);

  if (!booking) return null;

  const submit = async () => {
    if (description.trim().length < 10) {
      setError("Please describe what happened (at least 10 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post("/worker/payment-dispute", {
        bookingId: booking.id,
        description: description.trim(),
      });
      onSubmitted(data.message ?? "Payment dispute submitted.");
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const amount = booking.amount ?? booking.total ?? 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> Payment dispute
          </DialogTitle>
          <DialogDescription>
            Booking #{booking.id} with {booking.customerName ?? "the customer"} • Rs. {amount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="rounded-xl bg-primary-soft p-3 text-xs text-primary-dark">
            Use this if you finished the job but the customer won't give you the completion PIN. Your payment
            stays safely held by HelpGhar. An admin will review it and either release it to you or refund the
            customer — you'll get an email either way.
          </p>
          <div>
            <label htmlFor="payment-dispute-desc" className="mb-1.5 block text-xs font-semibold">
              What happened?
            </label>
            <textarea
              id="payment-dispute-desc"
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I finished the cooking job on time, but the customer stopped replying and didn't share the PIN."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
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
            className="rounded-xl bg-primary hover:bg-primary-dark"
          >
            {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Submit dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
