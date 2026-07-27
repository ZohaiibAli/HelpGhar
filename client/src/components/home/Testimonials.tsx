import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { testimonials } from "@/data/mock";

export function Testimonials() {
  const [featured, ...rest] = testimonials;

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Loved by 50,000+ users
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
            "{featured.quote}"
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <img
              src={featured.avatar}
              alt={featured.name}
              className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{featured.name}</p>
              <p className="truncate text-xs text-muted-foreground">{featured.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </figcaption>
        </motion.figure>

        {/* Two smaller, quieter cards stacked beside it */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {rest.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 rounded-2xl border border-border bg-card/70 p-6 shadow-soft"
            >
              <blockquote className="text-sm leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{t.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
