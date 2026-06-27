import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search, ShieldCheck, Star, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-dark">
            <ShieldCheck className="h-3.5 w-3.5" /> CNIC Verified Workers
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            Trusted Home Services <br />
            <span className="text-primary">At Your Doorstep</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            From house help and drivers to electricians and tutors — book verified, vetted professionals in your city within minutes.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center gap-2 rounded-xl border border-transparent px-3 focus-within:border-primary/50 focus-within:bg-accent/40">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input placeholder="What service do you need?" className="h-12 w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-transparent px-3 focus-within:border-primary/50 focus-within:bg-accent/40">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Your city" defaultValue="Lahore" className="h-12 w-full bg-transparent text-sm outline-none" />
            </div>
            <Link
              to="/services"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-dark active:scale-95"
            >
              Find Worker
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <Stat icon={Users} label="50K+ workers" />
            <Stat icon={Star} label="4.9 avg rating" />
            <Stat icon={ShieldCheck} label="100% verified" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative hidden lg:block"
        >
          <div className="absolute -left-6 top-10 rotate-[-4deg] rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/80?img=22" className="h-12 w-12 rounded-full object-cover" alt="" />
              <div>
                <p className="text-sm font-semibold">Bilal Ahmed</p>
                <p className="text-xs text-muted-foreground">Driver • Karachi</p>
              </div>
              <span className="ml-auto rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary-dark">Available</span>
            </div>
          </div>
          <div className="ml-10 mt-6 aspect-[5/6] w-full rounded-3xl bg-gradient-to-br from-primary/15 via-primary-soft to-card shadow-lift" />
          <div className="absolute bottom-8 right-0 rotate-[3deg] rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Booking confirmed</p>
            <p className="mt-1 text-sm font-semibold">House cleaning • Tomorrow 10AM</p>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"><Star className="h-3 w-3 fill-current" />4.9 rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label }: { icon: typeof Star; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" /> <span className="font-medium text-foreground">{label}</span>
    </span>
  );
}
