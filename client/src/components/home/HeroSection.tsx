import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { api } from "@/services/api";
import { categories } from "@/data/mock";
import { useGigStore } from "@/store/gigStore";

/**
 * The homepage's job is to let someone say what they need and get them to
 * people who do it, so the search box leads.
 *
 * What sits beside it went through two wrong versions. First a five-tile
 * bento mosaic with two floating fake cards -- a "Booking Confirmed" receipt
 * for a job nobody made and a "Trending" chip -- decorative, and inventing
 * activity. Then nothing at all, which was honest but left the page thin and
 * told a first-time visitor nothing about who is actually on here. It now
 * shows real workers, pulled from the same listings /services renders, which
 * is both the substance the page was missing and the most persuasive thing
 * the marketplace has.
 */

interface PublicStats {
  workers: number;
  verifiedWorkers: number;
  verifiedPercentage: number;
  customers: number;
  completedBookings: number;
  avgRating: number;
  reviewsCount: number;
}

const QUICK_PICKS = ["Cleaners", "House Servants", "Electricians", "Drivers", "Cooks"];

// Four things this platform genuinely does. No "background checked" or
// "instant booking" -- there are no background checks beyond the CNIC
// review, and a booking waits for the worker to accept it.
const HOW_IT_PROTECTS = [
  { icon: MessageSquare, text: "Message a worker before you book anything" },
  { icon: Wallet, text: "Workers set their own rates — no hidden markup" },
  { icon: CalendarCheck, text: "Cancel a pending or confirmed job for a full refund" },
  { icon: ShieldCheck, text: "CNIC badge only after an admin approves the account" },
];

export function HeroSection() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ stats: PublicStats }>("/dashboard/public-stats")
      .then((response) => {
        if (!cancelled) setStats(response.data.stats);
      })
      .catch(() => {
        // The page stays fully usable without the counts.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Read from the listings rather than written into the copy, so this stops
  // saying "Karachi" by itself the day someone signs up elsewhere.
  const cities = useMemo(
    () => Array.from(new Set(gigs.map((gig) => gig.city).filter(Boolean))),
    [gigs]
  );

  const coverage =
    cities.length === 0
      ? null
      : cities.length === 1
        ? cities[0]
        : `${cities.length} cities`;

  // Best-reviewed workers who are free right now: the three most useful
  // people to show someone who just arrived.
  const showcase = useMemo(
    () =>
      [...gigs]
        .filter((gig) => gig.available && gig.avatar)
        .sort(
          (a, b) =>
            b.rating - a.rating || b.reviewsCount - a.reviewsCount
        )
        .slice(0, 3),
    [gigs]
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (query.trim()) params.set("q", query.trim());

    navigate(`/services?${params.toString()}`);
  };

  return (
    <section id="home" className="border-b border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          {/* ─────────── Left: say what you need ─────────── */}
          <div>
            {coverage && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Currently serving {coverage}
              </p>
            )}

            <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Home help you can actually check first.
            </h1>

            {/* Careful with the verification claim: the badge only appears
                once an admin approves that worker's CNIC, and most listings
                haven't been through it yet. */}
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Maids, drivers, cooks, electricians and tutors across Karachi.
              Read their reviews, see the rate they set themselves, and message
              them before you book anything.
            </p>

            <form
              onSubmit={submit}
              className="mt-7 rounded-2xl border border-border bg-background p-2 shadow-card sm:flex sm:items-center sm:gap-2"
            >
              <label className="sr-only" htmlFor="hero-category">
                Service
              </label>
              <select
                id="hero-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-12 w-full shrink-0 rounded-xl border-0 bg-transparent px-3 text-sm font-medium outline-none sm:w-44 sm:rounded-none sm:border-r sm:border-border"
              >
                <option value="">All services</option>
                {categories.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="hero-query">
                Search by name, skill or area
              </label>
              <input
                id="hero-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, skill or area — e.g. Gulshan"
                className="h-12 w-full flex-1 rounded-xl border-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/70"
              />

              <button
                type="submit"
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark sm:mt-0 sm:w-auto"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-muted-foreground">Common searches:</span>
              {QUICK_PICKS.map((name) => (
                <Link
                  key={name}
                  to={`/services?category=${encodeURIComponent(name)}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {name}
                </Link>
              ))}
            </div>

            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {HOW_IT_PROTECTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ─────────── Right: who is actually on here ─────────── */}
          {showcase.length > 0 && (
            <div className="rounded-2xl border border-border bg-background p-5 shadow-card">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold">Available right now</h2>
                <Link
                  to="/services"
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  See all
                </Link>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Highest rated workers with an open calendar today.
              </p>

              <ul className="mt-4 space-y-2">
                {showcase.map((worker) => (
                  <li key={worker.id}>
                    <Link
                      to={`/workers/${worker.id}`}
                      className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-border hover:bg-accent/40"
                    >
                      <img
                        src={worker.avatar}
                        alt={worker.fullName}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {worker.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {worker.category} · {worker.experienceYears} yrs
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {worker.reviewsCount > 0 && (
                          <p className="flex items-center justify-end gap-1 text-xs font-semibold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {worker.rating.toFixed(1)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Rs. {worker.priceMin.toLocaleString()}+
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Real supply figures, each dropped when there is nothing
                  real to put behind it. */}
              {!!stats?.workers && (
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <Figure
                    value={stats.workers.toLocaleString()}
                    label={`worker${stats.workers === 1 ? "" : "s"} listed`}
                  />

                  {stats.completedBookings > 0 && (
                    <Figure
                      value={stats.completedBookings.toLocaleString()}
                      label={`job${stats.completedBookings === 1 ? "" : "s"} completed`}
                    />
                  )}

                  {stats.reviewsCount > 0 && (
                    <Figure
                      value={stats.avgRating.toFixed(1)}
                      label={`avg of ${stats.reviewsCount.toLocaleString()} reviews`}
                    />
                  )}

                  {stats.verifiedWorkers > 0 && (
                    <Figure
                      value={stats.verifiedWorkers.toLocaleString()}
                      label="CNIC verified"
                    />
                  )}
                </dl>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-lg font-semibold text-foreground">{value}</dt>
      <dd className="text-xs leading-tight text-muted-foreground">{label}</dd>
    </div>
  );
}
