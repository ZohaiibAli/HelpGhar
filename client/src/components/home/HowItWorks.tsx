import { motion } from "framer-motion";
import { UserPlus, Compass, CalendarCheck, CheckCircle2, MessageSquareHeart } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register account", desc: "Sign up as a customer in under a minute." },
  { icon: Compass, title: "Choose service", desc: "Browse categories and verified workers." },
  { icon: CalendarCheck, title: "Book worker", desc: "Pick the date, time and confirm instantly." },
  { icon: CheckCircle2, title: "Complete service", desc: "Worker arrives and delivers the job." },
  { icon: MessageSquareHeart, title: "Give review", desc: "Rate the experience to help others." },
];

export function HowItWorks() {
  return (
    <section className="bg-card/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="mt-1 text-3xl font-black md:text-4xl">From booking to done — in 5 simple steps</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
                <h3 className="mt-1 text-base font-bold">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
