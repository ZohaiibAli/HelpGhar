import { Link } from "react-router-dom";
import { workers } from "@/data/mock";
import { WorkerCard } from "@/components/workers/WorkerCard";

export function PopularWorkers() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Top picks</p>
          <h2 className="mt-1 text-3xl font-black md:text-4xl">Popular verified workers</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Hand-picked professionals with consistent 5-star reviews and rapid response times.
          </p>
        </div>
        <Link to="/services" className="text-sm font-semibold text-primary hover:underline">See all workers →</Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {workers.slice(0, 4).map((w, i) => (
          <WorkerCard key={w.id} worker={w} index={i} />
        ))}
      </div>
    </section>
  );
}
