import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { testimonials } from "@/data/mock";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Loved by 50,000+ users</p>
        <h2 className="mt-1 text-3xl font-black md:text-4xl">What our community says</h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <Quote className="h-6 w-6 text-primary/40" />
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.role}</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5 text-yellow-400">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-current" />)}
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
