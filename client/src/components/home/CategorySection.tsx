import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/mock";
import { useGigStore } from "@/store/gigStore";

/**
 * Two things were wrong with this section.
 *
 * The tiles were plain <div>s dressed up as links -- hover lift, an
 * "open" arrow, a pointer cursor -- that did nothing at all when
 * clicked. They now navigate to the category, pre-filtered.
 *
 * And the "1,240 verified pros nearby" counts came from a hardcoded
 * `workersCount` in data/mock.ts, so they described a marketplace of
 * ~5,500 workers regardless of how many had actually signed up. Counts
 * are now taken from the live listings.
 */
export function CategorySection() {
  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();

    for (const gig of gigs) {
      counts.set(gig.category, (counts.get(gig.category) ?? 0) + 1);
    }

    return counts;
  }, [gigs]);

  const [featured, ...rest] = categories;
  const FeaturedIcon = featured.icon;

  const featuredCount = countsByCategory.get(featured.name) ?? 0;

  const linkTo = (category: string) =>
    `/services?category=${encodeURIComponent(category)}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Nine trades, one call
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Whatever broke, whoever you need — it's here.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-5">
        {/* Featured tile — the category people search for most */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2 lg:row-span-2"
        >
          <Link
            to={linkTo(featured.name)}
            className="group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl border border-primary/20 bg-primary p-7 shadow-lift lg:min-h-[360px]"
          >
            <FeaturedIcon
              className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
              strokeWidth={1}
            />
            <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
              Most requested
            </span>
            <h3 className="font-display mt-6 text-2xl font-semibold text-primary-foreground">
              {featured.name}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-primary-foreground/80">
              {featured.description}
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-semibold text-primary-foreground/70">
                {featuredCount > 0
                  ? `${featuredCount.toLocaleString()} verified ${
                      featuredCount === 1 ? "pro" : "pros"
                    } available`
                  : "Browse this category"}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Remaining categories — compact rows, icon-left, not a repeated card shape */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
          {rest.map((c, i) => {
            const Icon = c.icon;
            const count = countsByCategory.get(c.name) ?? 0;

            return (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={linkTo(c.name)}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-transparent bg-card px-4 py-3.5 transition hover:border-primary/30 hover:bg-primary-soft/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    {count > 0 ? count.toLocaleString() : "—"}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
