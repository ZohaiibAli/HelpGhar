import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categories } from "@/data/mock";

export function CategorySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Categories</p>
          <h2 className="mt-1 text-3xl font-black md:text-4xl">Browse popular services</h2>
        </div>
        <Link to="/services" className="text-sm font-semibold text-primary hover:underline">View all services →</Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                to="/services"
                className="group block h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-primary hover:shadow-lift"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary-dark transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                <p className="mt-3 text-xs font-semibold text-primary">{c.workersCount.toLocaleString()} workers</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
