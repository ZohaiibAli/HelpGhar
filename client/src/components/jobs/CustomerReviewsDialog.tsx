import { useEffect, useState } from "react";
import { Loader2, Star, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customerReviewService, type CustomerReviewSummary } from "@/services/customerReviewService";
import type { CustomerReview } from "@/types";

/** Worker: what other workers said about this job's poster. */
export function CustomerReviewsDialog({
  customer,
  onClose,
}: {
  customer: { customerId: string; customerName?: string } | null;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<CustomerReviewSummary | null>(null);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    setReviews([]);
    customerReviewService
      .getForCustomer(customer.customerId)
      .then((data) => {
        setSummary(data.customer);
        setReviews(data.reviews);
      })
      .catch((err: any) => setError(err?.message ?? "Could not load reviews."))
      .finally(() => setLoading(false));
  }, [customer?.customerId]);

  if (!customer) return null;

  const name = summary?.fullName || customer.customerName || "Customer";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" /> {name}
          </DialogTitle>
          <DialogDescription>Reviews from workers who completed jobs for this customer.</DialogDescription>
        </DialogHeader>

        {summary && summary.reviewsCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-black">{summary.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              from {summary.reviewsCount} review{summary.reviewsCount === 1 ? "" : "s"}
            </span>
          </div>
        )}

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews...
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && reviews.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No reviews yet — this customer hasn't been rated by a worker.
            </p>
          )}
          {reviews.map((r) => (
            <div key={r.reviewId} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{r.workerName}</p>
                  {r.category && <p className="text-xs text-muted-foreground">{r.category}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
