import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { categories } from "@/data/mock";
import { useGigStore } from "@/store/gigStore";

/**
 * A plain directory of what the platform actually offers.
 *
 * The previous version was a bento mosaic: one oversized "Most requested"
 * tile in brand green beside eight small rows, with counts that came from a
 * hardcoded list. The asymmetry made one category look editorially chosen
 * when nothing had chosen it, and it made the grid harder to scan than a
 * grid. Nine equal tiles, real counts, sorted by how many workers are
 * actually available.
 */
export function CategorySection() {
  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const listed = useMemo(() => {
    const counts = new Map<string, number>();

    for (const gig of gigs) {
      counts.set(gig.category, (counts.get(gig.category) ?? 0) + 1);
    }

    return categories
      .map((category) => ({
        ...category,
        count: counts.get(category.name) ?? 0,
      }))
      // Most available first: an empty category at the top of a directory is
      // just a dead end for whoever clicks it.
      .sort((a, b) => b.count - a.count);
  }, [gigs]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Browse by service
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Nine trades, all hired the same way.
          </p>
        </div>

        <Link
          to="/services"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          See everyone
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listed.map((category) => {
          const Icon = category.icon;
          const empty = category.count === 0;

          return (
            <Link
              key={category.name}
              to={`/services?category=${encodeURIComponent(category.name)}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{category.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {category.description}
                </p>
              </div>

              <span
                className={`shrink-0 text-right text-xs ${
                  empty ? "text-muted-foreground" : "font-semibold text-foreground"
                }`}
              >
                {empty ? (
                  "None yet"
                ) : (
                  <>
                    {category.count.toLocaleString()}
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      available
                    </span>
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
