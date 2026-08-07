import { useEffect, useState } from "react";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { authHeaders, handleAuthFailure } from "@/lib/session";
import type { Worker } from "@/types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Personalised suggestions for a signed-in customer.
 *
 * This is the one place a "why this worker" explanation earns its space. The
 * generic listing card used to carry the whole ranking apparatus on every
 * result — match percentage, marketplace score, reason tags — which is noise
 * in a plain search where nothing was personalised in the first place. Here
 * the ranking is the entire point, so the reasons come along.
 */
export default function RecommendedWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      const res = await fetch(`${API_BASE}/recommendations/my-workers`, {
        headers: authHeaders(),
      });

      // A silently-swallowed background fetch is exactly how a dead session
      // stays invisible -- bail out and let the session module log out.
      if (handleAuthFailure(res)) return;

      const data = await res.json();

      if (data.success) {
        setWorkers(data.workers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold">Suggested for you</h2>
        <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Nothing to suggest yet (a brand-new account with no booking history)
  // reads better as absence than as an empty heading.
  if (workers.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold">Suggested for you</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on the categories you've booked before and how other customers
        with similar bookings rated these workers.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workers.slice(0, 4).map((worker) => {
          const reasons = worker.recommendationReasons ?? [];

          return (
            <WorkerCard
              key={worker.id}
              worker={worker}
              note={
                reasons.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {reasons.slice(0, 3).map((reason) => (
                      <li
                        key={reason}
                        className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-dark"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
