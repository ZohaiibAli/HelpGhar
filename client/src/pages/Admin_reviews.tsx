import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
// import { reviews } from "@/data/mock";
import { useEffect, useState } from "react";
import { reviewService } from "@/services/reviewService";
import type { Review } from "@/types";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await reviewService.getReviews();

        // If backend returns { success: true, reviews: [...] }
        setReviews(res.data);

        // If backend returns only an array, use this instead:
        // setReviews(res.data);

      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const avgRating =
    reviews.length > 0
      ? (
        reviews.reduce((sum, r) => sum + r.rating, 0) /
        reviews.length
      ).toFixed(2)
      : "0.00";

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor customer feedback across the platform.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total reviews</p>
            <p className="mt-2 text-xl font-black">{reviews.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average rating</p>
            <p className="mt-2 flex items-center gap-1 text-xl font-black">{avgRating} <Star className="h-4 w-4 fill-primary text-primary" /></p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">5-star reviews</p>
            <p className="mt-2 text-xl font-black">{reviews.filter((r) => r.rating === 5).length}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">All reviews</h2>
<div className="mt-4 space-y-3">
  {loading ? (
    <p className="text-sm text-muted-foreground">
      Loading reviews...
    </p>
  ) : reviews.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No reviews found.
    </p>
  ) : (
    reviews.map((r) => (
      <div
        key={r.id}
        className="rounded-2xl border border-border bg-background p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold">{r.customerName}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {new Date(r.date).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < r.rating
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {r.comment}
        </p>
      </div>
    ))
  )}
</div>
</div>
      </div>
    </DashboardLayout>
  );
}