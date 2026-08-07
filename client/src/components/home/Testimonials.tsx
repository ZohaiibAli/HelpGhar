import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { api } from "@/services/api";

interface FeaturedReview {
  reviewId: string;
  customerName: string;
  workerName: string;
  workerCategory: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Real reviews, written by real customers about completed bookings.
 *
 * This section used to render three invented testimonials from
 * data/mock.ts under the headline "Real jobs, real people" — fabricated
 * names and quotes presented to visitors as customer feedback. It now
 * pulls from /reviews/featured, and renders nothing at all while the
 * platform has no qualifying reviews, because an empty marketplace
 * saying nothing is honest and an empty marketplace inventing praise
 * is not.
 */
export function Testimonials() {
  const [reviews, setReviews] = useState<FeaturedReview[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ reviews: FeaturedReview[] }>("/reviews/featured", {
        params: { limit: 3 },
      })
      .then((response) => {
        if (!cancelled) setReviews(response.data.reviews ?? []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Still loading, or nothing worth featuring: render nothing rather than
  // an empty shell or a placeholder.
  if (!reviews || reviews.length === 0) return null;

  const [featured, ...rest] = reviews;

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          What customers say
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Real jobs, real people.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-5">
        {/* Featured quote — larger type, no card chrome */}
        <motion.figure
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-lift lg:col-span-3 lg:p-10"
        >
          <Quote className="h-10 w-10 text-primary/25" strokeWidth={1.5} />
          <blockquote className="font-display mt-5 text-xl font-medium leading-snug text-foreground md:text-2xl">
            "{featured.comment}"
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <Initial name={featured.customerName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{featured.customerName}</p>
              <p className="truncate text-xs text-muted-foreground">
                on {featured.workerName}
                {featured.workerCategory ? ` • ${featured.workerCategory}` : ""}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-0.5 text-amber-400">
              {/* Stars reflect the rating actually given, not a fixed five. */}
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-3.5 w-3.5 ${
                    index < featured.rating ? "fill-current" : "opacity-25"
                  }`}
                />
              ))}
            </div>
          </figcaption>
        </motion.figure>

        {/* Two smaller, quieter cards stacked beside it */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {rest.map((review, index) => (
            <motion.figure
              key={review.reviewId}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.12 + index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex-1 rounded-2xl border border-border bg-card/70 p-6 shadow-soft"
            >
              <blockquote className="text-sm leading-relaxed text-foreground">
                "{review.comment}"
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5">
                <Initial name={review.customerName} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">
                    {review.customerName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    on {review.workerName}
                    {review.workerCategory ? ` • ${review.workerCategory}` : ""}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Reviewers are identified by name only -- customer profile pictures are
 * private, and the old stock avatars belonged to invented people.
 */
function Initial({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const dimension = size === "lg" ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs";

  return (
    <span
      className={`${dimension} grid shrink-0 place-items-center rounded-full bg-primary/15 font-bold text-primary`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
