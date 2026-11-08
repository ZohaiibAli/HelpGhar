import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { HgAlert } from "@/components/ui/HgAlert";
import { MyWorkerCard, type MyWorker } from "@/components/customers/MyWorkerCard";

export default function MyWorkersPage() {
  const [workers, setWorkers] = useState<MyWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/bookings/my-workers")
      .then((res) => setWorkers(res.data.workers ?? []))
      .catch((err) => setError(err.message ?? "Something went wrong while fetching your workers."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(workers.map((w) => w.category))).sort(),
    [workers]
  );

  const filtered = workers.filter((w) => {
    if (category !== "all" && w.category !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || w.workerName?.toLowerCase().includes(q) || w.category.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout title="Customer" items={customerItems}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">My workers</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Everyone you've hired before — book them again in a couple of taps.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/services">Find new workers</Link>
          </Button>
        </div>

        {workers.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or service"
                className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All services</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              Loading your workers…
            </div>
          ) : workers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-bold">No workers yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Workers show up here once a booking with them is completed.
              </p>
              <Button asChild className="mt-4 bg-primary hover:bg-primary-dark">
                <Link to="/services">Browse services</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              No workers match your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((w) => (
                <MyWorkerCard key={`${w.workerId}-${w.category}`} worker={w} />
              ))}
            </div>
          )}
        </div>
      </div>

      <HgAlert
        open={!!error}
        type="error"
        title="Could not load your workers"
        description={error ?? ""}
        onClose={() => setError(null)}
      />
    </DashboardLayout>
  );
}
