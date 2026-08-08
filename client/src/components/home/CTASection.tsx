import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Worker recruitment.
 *
 * The old copy — "Good with your hands? Get paid for it", "get paid every
 * week, no chasing clients for cash" — promised a weekly payout schedule
 * that doesn't exist: payment is per booking, released against that job.
 * Promising a wage cycle the platform can't honour is the one thing you
 * really shouldn't fake to someone deciding whether to work here.
 */
export function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Looking for work instead?
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              List what you do and what you charge. Customers find you by
              service and area, message you before booking, and pay through the
              platform so there's a record of every job. Verification takes a
              CNIC and an admin review. Or skip the listing and{" "}
              <Link to="/job-board" className="font-semibold underline underline-offset-2">
                browse job requests
              </Link>{" "}
              customers have already posted.
            </p>

            <ul className="mt-5 grid gap-x-8 gap-y-2 text-sm text-primary-foreground/85 sm:grid-cols-2">
              <li>You set your own rates and hours</li>
              <li>Decline any booking that doesn't suit you</li>
              <li>Reviews build a profile customers can check</li>
              <li>No fee to list</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition hover:bg-background/90"
            >
              Register as a worker
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex h-12 items-center rounded-lg border border-primary-foreground/30 px-6 text-sm font-semibold transition hover:bg-primary-foreground/10"
            >
              See who's listed
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
