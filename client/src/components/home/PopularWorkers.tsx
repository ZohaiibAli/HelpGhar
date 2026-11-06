import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { useGigStore } from "@/store/gigStore";

/**
 * Real listings, ranked by real reviews.
 *
 * The heading used to promise "hand-picked professionals with consistent
 * 5-star reviews and rapid response times" above whatever four gigs the API
 * happened to return first — nobody hand-picked them, few had five stars,
 * and the platform doesn't measure response time at all. It now says what
 * the ordering actually is.
 */
export function PopularWorkers() {
  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const topRated = useMemo(
    () =>
      [...gigs]
        .filter((gig) => gig.reviewsCount > 0)
        .sort(
          (a, b) =>
            b.rating - a.rating || b.reviewsCount - a.reviewsCount
        )
        .slice(0, 4),
    [gigs]
  );

  // Before anyone has been reviewed there is no "best rated" to show, so fall
  // back to simply introducing four workers rather than claiming a ranking.
  const showing = topRated.length > 0 ? topRated : gigs.slice(0, 4);
  const ranked = topRated.length > 0;

  if (showing.length === 0) return null;

  return (
    <section
      id="services"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {ranked ? "Highest rated right now" : "Recently joined"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {ranked
              ? "Ordered by customer rating, counting only workers who have been reviewed."
              : "New workers on the platform. Ratings appear once customers start reviewing them."}
          </p>
        </div>

        <Link
          to="/services"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          See everyone
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showing.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>
    </section>
  );
}
