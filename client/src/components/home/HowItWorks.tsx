/**
 * What actually happens, described in the platform's own terms.
 *
 * The old version was a five-rung ladder of one-word steps — Register,
 * Choose, Book, Get it done, Review — with a claim that "most bookings go
 * from search to confirmed worker in under two minutes", which nothing
 * measures. Each step now names the real mechanic behind it: the price is
 * computed from the worker's listing, the worker has to accept, payment is
 * held against the booking, and a cancellation refunds it.
 */

const STEPS = [
  {
    title: "Find someone",
    body: "Filter by service, price and rating. Every profile shows the worker's own rates, experience and past reviews.",
  },
  {
    title: "Message before you commit",
    body: "Ask about timings, what's included, or a price for a bigger job. The conversation stays on your account.",
  },
  {
    title: "Send the booking",
    body: "Pick a date and a two-hour slot. The total is worked out from the worker's listed rate plus a 5% platform fee — nobody quotes you a different number later.",
  },
  {
    title: "Worker confirms",
    body: "They accept or decline. A slot that's already taken can't be double-booked, and either side can cancel a pending or confirmed job.",
  },
  {
    title: "Pay and review",
    body: "Pay through the platform so there's a record. Cancel and the payment is refunded. After it's done, your review goes on their public profile.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-card/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          How hiring works here
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Five steps, no call centre in between.
        </p>

        <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
