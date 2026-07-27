import { motion } from "framer-motion";

const steps = [
  { title: "Register", desc: "Sign up as a customer in under a minute." },
  { title: "Choose", desc: "Browse categories and verified workers." },
  { title: "Book", desc: "Pick the date, time and confirm instantly." },
  { title: "Get it done", desc: "Worker arrives and delivers the job." },
  { title: "Review", desc: "Rate the experience to help others." },
];

export function HowItWorks() {
  return (
    <section className="bg-card/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Booking to done in five steps.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            No call centre, no back-and-forth. Most bookings go from search to
            confirmed worker in under two minutes.
          </p>
        </div>

        <div className="mt-14 flex flex-col divide-y divide-border/70 border-t border-border/70 md:flex-row md:divide-x md:divide-y-0 md:border-t-0">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative flex-1 py-6 md:py-2 md:px-6 first:md:pl-0 last:md:pr-0"
            >
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-0 hidden h-px w-full origin-left bg-primary/40 md:block"
              />
              <span className="font-display text-4xl font-semibold text-primary/25 transition-colors group-hover:text-primary/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-base font-bold">{s.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
