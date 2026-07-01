import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { useEffect } from "react";
import { reviews } from "@/data/mock";
import { useGigStore } from "@/store/gigStore";

// Read-only view of reviews left about the logged-in worker.
// Swap CURRENT_WORKER_ID out for whatever your auth/session gives you.
const CURRENT_WORKER_ID = "current-worker-id";

export default function WorkerReviewsPage() {
  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const myReviews = reviews.filter(r => r.workerId === CURRENT_WORKER_ID);
  const avgRating = myReviews.length
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
    : null;

  return (
    <DashboardLayout title="Worker" items={workerItems}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">Your Reviews</h1>
            <p className="mt-2 text-sm text-muted-foreground">Feedback customers have left for you.</p>
          </div>
          {avgRating && (
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({myReviews.length})</span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {myReviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          {myReviews.map(r => {
            const gig = gigs.find(g => g.id === r.workerId);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{r.customerName}</p>
                    {gig?.category && <p className="text-xs text-muted-foreground">{gig.category}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.date).toDateString()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}