import { Link, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import type { Worker } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { HgAlert } from "@/components/ui/HgAlert";
import { handleHireNowClick } from "@/lib/hireNow";

/**
 * A listing card, in the order someone actually decides in: who they are,
 * whether they're trustworthy, what they cost, then book.
 *
 * It previously stacked six competing signals on every card — a "🔥 92%
 * Match" pill, a reputation badge, a green "Marketplace Score 8.4" panel, a
 * positive-review progress bar, a "Why Recommended" tag cloud and a
 * three-way content/collaborative score breakdown. Those are internal
 * ranking mechanics; showing all of them at once made a hiring decision look
 * like a dashboard, and pushed the price and the buttons below the fold. The
 * ranking still decides the order of the results — it just doesn't narrate
 * itself on top of them. The full breakdown remains on the worker's own
 * page, where someone comparing two people can go looking for it.
 */
export function WorkerCard({
  worker,
  note,
}: {
  worker: Worker;
  index?: number;
  /**
   * Optional context for why this particular card is in front of this
   * particular person — used by the customer dashboard's recommendations.
   * Deliberately a slot rather than more built-in badges: a card in a plain
   * search result has nothing to explain.
   */
  note?: ReactNode;
}) {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [showWorkerAlert, setShowWorkerAlert] = useState(false);

  const priceUnit =
    worker.priceUnit === "month"
      ? "/month"
      : worker.priceUnit === "hour"
        ? "/hour"
        : "/day";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={worker.avatar}
          alt={worker.fullName}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {worker.available && (
          <span className="absolute left-3 top-3 rounded-md bg-background/95 px-2 py-1 text-[11px] font-semibold text-foreground shadow-soft">
            Available now
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{worker.fullName}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {worker.category}
            </p>
          </div>

          {worker.reviewsCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{worker.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({worker.reviewsCount})
              </span>
            </span>
          ) : (
            // "0.0 (0)" reads as a bad rating rather than no rating, and a new
            // worker shouldn't be punished for having no history yet.
            <span className="shrink-0 text-xs text-muted-foreground">
              No reviews yet
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {worker.city}
          </span>
          <span>{worker.experienceYears} yrs experience</span>
          {worker.cnicVerified && (
            <span className="inline-flex items-center gap-1 font-medium text-primary-dark">
              <ShieldCheck className="h-3 w-3" />
              CNIC verified
            </span>
          )}
        </div>

        <p className="mt-4 text-base font-semibold">
          Rs. {worker.priceMin.toLocaleString()} –{" "}
          {worker.priceMax.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {priceUnit}
          </span>
        </p>

        {note && (
          <div className="mt-3 border-t border-border pt-3">{note}</div>
        )}

        <div className="mt-4 flex gap-2 pt-1">
          <Link
            to={`/workers/${worker.id}`}
            className="flex-1 rounded-lg border border-border py-2.5 text-center text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            View profile
          </Link>
          <button
            onClick={() =>
              handleHireNowClick({
                user,
                token,
                navigate,
                workerId: worker.id,
                onWorkerTriesToHire: () => setShowWorkerAlert(true),
              })
            }
            className="flex-1 rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
          >
            Book
          </button>
        </div>
      </div>

      <HgAlert
        open={showWorkerAlert}
        onClose={() => setShowWorkerAlert(false)}
        type="warning"
        title="Wrong account type"
        description="Please log in from a customer profile to hire a worker."
        cancelLabel="Got it"
      />
    </article>
  );
}
