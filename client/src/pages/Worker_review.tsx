import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { useEffect, useState } from "react";

interface Review {
  _id: string;
  reviewId: string;
  customerId: string;
  customerName: string;
  workerId: string;
  workerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function WorkerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");

        if (!token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/reviews/my-reviews`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews);
        } else {
          setError("Failed to load reviews");
        }
      } catch (err) {
        setError("Something went wrong while fetching reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
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
              <span className="text-xs text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          {reviews.map(r => (
            <div key={r._id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold">{r.customerName}</p>
                <div className="flex items-center gap-0.5 text-yellow-400">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(r.createdAt).toDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}