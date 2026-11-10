import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { customerReviewService } from "@/services/customerReviewService";
import type { CustomerReview } from "@/types";

/**
 * Worker: rate the customer after a completed booking. Other workers see
 * this on the customer's job posts before they apply.
 */
export function RateCustomerDialog({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: { id: string; customerName?: string; category?: string } | null;
  onClose: () => void;
  onSubmitted: (review: CustomerReview, message: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(5);
    setHover(0);
    setComment("");
    setError(null);
  }, [booking?.id]);

  if (!booking) return null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await customerReviewService.submit({
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      });
      onSubmitted(data.review, data.message);
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const shown = hover || rating;
  const labels = ["", "Very difficult", "Difficult", "Okay", "Good", "Excellent"];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Rate {booking.customerName ?? "the customer"}
          </DialogTitle>
          <DialogDescription>
            Booking #{booking.id}
            {booking.category ? ` • ${booking.category}` : ""}. Other workers will see this before applying to
            this customer's jobs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-8 w-8 transition ${n <= shown ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{labels[shown]}</p>
          </div>

          <div>
            <label htmlFor="customer-review-comment" className="mb-1.5 block text-xs font-semibold">
              How was working with this customer? <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="customer-review-comment"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Clear instructions, polite, paid on time and shared the PIN right away."
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
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
