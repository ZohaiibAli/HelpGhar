import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
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
 *
 * Avatars are rendered as gradient initials instead of photos -- mock avatar
 * images looked mismatched and inconsistent next to real data, so a
 * deterministic gradient + initials keeps the list visually consistent no
 * matter what worker.avatar happens to be.
 *
 * The rest of the section (headline, search, quick picks, protection list)
 * got the same visual pass: soft background depth, pill-style quick picks,
 * icon-chip protection cards, and a livelier search bar -- all decorative,
 * none of it changes what the section actually claims or does.
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

// Deterministic gradient set for initials avatars — picked by name so the
// same worker always gets the same colour, no state or images needed.
const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
];

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function getAvatarGradient(fullName: string) {
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

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
        .filter((gig) => gig.available)
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
    <section
      id="home"
      className="relative overflow-hidden border-b border-border bg-card/40"
    >
      {/* Decorative background depth — purely visual, sits behind everything */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          {/* ─────────── Left: say what you need ─────────── */}
          <div>
            {coverage && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <MapPin className="h-3 w-3" />
                Currently serving {coverage}
              </p>
            )}

            <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Home help you can{" "}
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                actually check first
              </span>
              .
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
              className="mt-7 rounded-2xl border border-border bg-background p-2 shadow-card transition-shadow duration-200 focus-within:border-primary/40 focus-within:shadow-lg hover:shadow-md sm:flex sm:items-center sm:gap-2"
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
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98] sm:mt-0 sm:w-auto"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Common searches:</span>
              {QUICK_PICKS.map((name) => (
                <Link
                  key={name}
                  to={`/services?category=${encodeURIComponent(name)}`}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
                >
                  {name}
                </Link>
              ))}
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {HOW_IT_PROTECTS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="pt-1 text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ─────────── Right: who is actually on here ─────────── */}
          {showcase.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background to-accent/10 p-5 shadow-card ring-1 ring-border/50 transition-shadow duration-200 hover:shadow-lg">
              {/* soft decorative glow, purely visual, no fake data */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

              <div className="relative flex items-baseline justify-between gap-3">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Available right now
                </h2>
                <Link
                  to="/services"
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  See all
                </Link>
              </div>

              <p className="relative mt-1 text-xs text-muted-foreground">
                Highest rated workers with an open calendar today.
              </p>

              <ul className="relative mt-4 divide-y divide-border/60">
                {showcase.map((worker) => (
                  <li key={worker.id}>
                    <Link
                      to={`/workers/${worker.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/40"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${getAvatarGradient(
                          worker.fullName
                        )}`}
                      >
                        {getInitials(worker.fullName)}
                      </div>

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
                <dl className="relative mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <Figure
                    icon={Users}
                    value={stats.workers.toLocaleString()}
                    label={`worker${stats.workers === 1 ? "" : "s"} listed`}
                  />

                  {stats.completedBookings > 0 && (
                    <Figure
                      icon={CheckCircle2}
                      value={stats.completedBookings.toLocaleString()}
                      label={`job${stats.completedBookings === 1 ? "" : "s"} completed`}
                    />
                  )}

                  {stats.reviewsCount > 0 && (
                    <Figure
                      icon={Star}
                      value={stats.avgRating.toFixed(1)}
                      label={`avg of ${stats.reviewsCount.toLocaleString()} reviews`}
                    />
                  )}

                  {stats.verifiedWorkers > 0 && (
                    <Figure
                      icon={ShieldCheck}
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

function Figure({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
      <div>
        <dt className="text-lg font-semibold leading-tight text-foreground">
          {value}
        </dt>
        <dd className="text-xs leading-tight text-muted-foreground">{label}</dd>
      </div>
    </div>
  );
}