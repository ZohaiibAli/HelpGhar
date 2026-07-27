import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Calendar, ShieldCheck } from "lucide-react";

export function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-lift md:p-16">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Earn with HelpGhar
            </span>
            <h2 className="font-display mt-4 text-3xl font-semibold leading-tight md:text-5xl">
              Good with your hands? Get paid for it.
            </h2>
            <p className="mt-3 max-w-md text-sm text-primary-foreground/85 md:text-base">
              Set your own hours, get matched with jobs near you, and get paid every week — no chasing clients for cash.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary-dark transition hover:bg-primary-soft"
              >
                Register as Worker <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-bold transition hover:bg-white/10"
              >
                Browse services
              </Link>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-white/15 rounded-2xl bg-white/[0.07] sm:divide-y-0">
            <Perk icon={Wallet} title="On-time payouts" desc="Get paid every week, no waiting." />
            <Perk icon={Calendar} title="Flexible schedule" desc="Choose when and where you work." />
            <Perk icon={ShieldCheck} title="Verified profile" desc="Boost trust and unlock more jobs." />
          </div>
        </div>
      </div>
    </section>
  );
}

function Perk({ icon: Icon, title, desc }: { icon: typeof Wallet; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <Icon className="h-5 w-5 shrink-0 text-primary-foreground/70" strokeWidth={1.75} />
      <div className="min-w-0"><p className="font-bold">{title}</p><p className="text-sm text-primary-foreground/80">{desc}</p></div>
    </div>
  );
}
