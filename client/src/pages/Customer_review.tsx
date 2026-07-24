import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";

// import { useGigStore } from "@/store/gigStore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
// Add these interfaces HERE 👇
interface Worker {
  workerId: string;
  workerName: string;
}

interface Review {
  reviewId: string;
  customerId: string;
  customerName: string;
  workerId: string;
  workerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
export default function CustomerReviewsPage() {
  // const gigs = useGigStore((state) => state.gigs);
  // const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchReviews();
    fetchWorkers();
  }, []);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);

  // useEffect(() => {
  //   if (gigs.length > 0 && !workerId) {
  //     setWorkerId(gigs[0].id);
  //   }
  // }, [gigs, workerId]);

  const [list, setList] = useState<Review[]>([]);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    description: string;
  }>({ open: false, type: "success", title: "", description: "" });

  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));
  const fetchReviews = async () => {
    try {
      const { data } = await api.get("/reviews");

      if (data.success) {
        setList(data.reviews);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get("/reviews/workers");

      if (data.success) {
        setWorkers(data.workers);

        if (data.workers.length > 0) {
          setWorkerId(data.workers[0].workerId);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  const submitReview = async () => {
    if (!comment.trim()) return;

    try {
      const { data } = await api.post("/reviews", {
        workerId,
        rating,
        comment,
      });

      if (data.success) {
        fetchReviews();
        setComment("");
        setRating(5);
        setAlertState({          // ← add this
          open: true,
          type: "success",
          title: "Thank you for your review!",
          description: data.message || "Your feedback helps others find great workers.",
        });
      }
      else setAlertState({          // ← replace alert()
        open: true,
        type: "error",
        title: "Submission failed",
        description: data.detail || data.message || "Something went wrong. Please try again.",
      });
    }
    catch (error) {
      console.error(error);
    }
  };
  return (
    <DashboardLayout title="Customer" items={customerItems}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">Reviews</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hear what real customers say about our workers.</p>
          <div className="mt-6 space-y-4">
            {list.map(r => {
              // const w = workers.find(
              //   (worker) => worker.workerId === r.workerId
              // );
              return (
                <div key={r.reviewId} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground">For {r.workerName}</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-yellow-400">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(r.createdAt).toDateString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-base font-bold">Leave a review</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Worker</label>
                <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  {workers.map((worker) => (
                    <option
                      key={worker.workerId}
                      value={worker.workerId}
                    >
                      {worker.workerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)} className="p-1">
                      <Star className={`h-7 w-7 transition ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Your review</label>
                <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button
                onClick={submitReview}
                className="h-11 w-full bg-primary hover:bg-primary-dark">Submit review</Button>
            </div>
          </div>
        </aside>
      </div>
      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />
    </DashboardLayout>
  );
}