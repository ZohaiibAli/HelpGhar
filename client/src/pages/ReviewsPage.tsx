import { useState } from "react";
import { Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { reviews, workers } from "@/data/mock";
import { Button } from "@/components/ui/button";

export default function ReviewsPage() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [workerId, setWorkerId] = useState(workers[0].id);
  const [list, setList] = useState(reviews);

  return (
    <MainLayout>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">Reviews</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hear what real customers say about our workers.</p>
          <div className="mt-6 space-y-4">
            {list.map(r => {
              const w = workers.find(x => x.id === r.workerId);
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground">For {w?.fullName} • {w?.category}</p>
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

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-base font-bold">Leave a review</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Worker</label>
                <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  {workers.map(w => <option key={w.id} value={w.id}>{w.fullName} — {w.category}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
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
                onClick={() => {
                  if (!comment.trim()) return;
                  setList(l => [{ id: "r" + Date.now(), workerId, customerName: "You", rating, comment, date: new Date().toISOString() }, ...l]);
                  setComment("");
                }}
                className="h-11 w-full bg-primary hover:bg-primary-dark">Submit review</Button>
            </div>
          </div>
        </aside>
      </div>
    </MainLayout>
  );
}
