import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Users,
  Sparkles,
  Zap,
  Wrench,
  Car,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

const CYCLE_WORDS = ["Electricians", "Plumbers", "House Help", "Drivers", "Tutors"];

const CATEGORIES = [
  {
    label: "Cleaning",
    icon: Sparkles,
    slug: "cleaning",
    stat: "1,200+ pros",
    rating: "4.9",
    accent: true,
    className: "row-span-2",
    trending: true,
  },
  { label: "Drivers", icon: Car, slug: "driver", stat: "800+ pros", rating: "4.8" },
  { label: "Tutors", icon: GraduationCap, slug: "tutor", stat: "650+ pros", rating: "4.9" },
  { label: "Electricians", icon: Zap, slug: "electrician", stat: "900+ pros", rating: "4.7" },
  { label: "Plumbing", icon: Wrench, slug: "plumbing", stat: "700+ pros", rating: "4.8" },
];

const PILLS = [
  { label: "Cleaning", icon: Sparkles, slug: "cleaning" },
  { label: "Driver", icon: Car, slug: "driver" },
  { label: "Tutor", icon: GraduationCap, slug: "tutor" },
  { label: "Electrician", icon: Zap, slug: "electrician" },
  { label: "Plumbing", icon: Wrench, slug: "plumbing" },
];

const TRUST_POINTS = [
  "Background checked",
  "CNIC verified",
  "Rated & reviewed",
  "Instant booking",
];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % CYCLE_WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="relative overflow-hidden bg-hero-gradient">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradient blobs */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[80px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/5 blur-[60px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8 lg:gap-10">
        {/* ─── LEFT COLUMN ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center"
        >
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <ShieldCheck className="h-3.5 w-3.5" />
            CNIC Verified Workers
          </motion.span>

          {/* Heading */}
          <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight md:text-[3.5rem] md:leading-[1.08]">
            Find trusted
            <br />
            <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom">
              {/* Glow underline */}
              <span className="pointer-events-none absolute -inset-x-2 bottom-0 h-3 rounded-full bg-primary/20 blur-md" />
              <span className="relative text-primary">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={CYCLE_WORDS[wordIndex]}
                    initial={{ y: "110%", opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: "-110%", opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-block"
                  >
                    {CYCLE_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
            <br />
            at your doorstep.
          </h1>

          {/* Subheading */}
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            From house help and drivers to electricians and tutors — book{" "}
            <span className="font-medium text-foreground">verified, vetted professionals</span>{" "}
            in your city within minutes.
          </p>

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {PILLS.map(({ label, icon: Icon, slug }, i) => (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <div
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary-dark hover:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  {label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`mt-8 grid gap-2 rounded-2xl border bg-card/90 p-2 shadow-card backdrop-blur-md transition-all duration-300 sm:grid-cols-[1fr_1fr_auto] ${searchFocused
              ? "border-primary/40 shadow-lift ring-4 ring-primary/5"
              : "border-border/60"
              }`}
          >
            <div className="flex items-center gap-2.5 rounded-xl px-3 transition-colors focus-within:bg-accent/30">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <input
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="What service do you need?"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 transition-colors focus-within:bg-accent/30">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <input
                placeholder="Your city"
                defaultValue="Lahore"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <Link
              to="/services"
              className="group/btn inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary-dark hover:shadow-lg active:scale-[0.97]"
            >
              Find Worker
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Trust section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center"
          >
            {/* Avatar stack */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[12, 32, 45, 8, 60].map((id, i) => (
                  <motion.img
                    key={id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.07 }}
                    src={`https://i.pravatar.cc/64?img=${id}`}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-card object-cover ring-1 ring-black/5"
                  />
                ))}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-[9px] font-bold text-primary-foreground shadow-sm"
                >
                  +50K
                </motion.span>
              </div>
            </div>

            <div className="hidden h-10 w-px bg-border/60 sm:block" />

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <Stat icon={Star} value="4.9" label="avg rating" filled />
              <Stat icon={ShieldCheck} value="100%" label="verified" />
              <Stat icon={Users} value="50K+" label="happy users" />
            </div>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-5 flex flex-wrap gap-x-4 gap-y-1"
          >
            {TRUST_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70"
              >
                <CheckCircle2 className="h-3 w-3 text-primary/60" />
                {point}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── RIGHT COLUMN ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <div className="ml-10 mr-6 grid h-[460px] grid-cols-2 grid-rows-3 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <BentoTile {...cat} />
              </motion.div>
            ))}
          </div>

          {/* Floating card: Worker profile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-8 top-8 z-20 w-64 rotate-[-3deg] overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-lift backdrop-blur-lg"
            >
              <div className="h-1 w-full bg-primary" />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src="https://i.pravatar.cc/96?img=22"
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-primary/20"
                      alt=""
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">Bilal Ahmed</p>
                    <p className="text-[11px] text-muted-foreground">
                      <MapPin className="mr-0.5 inline h-2.5 w-2.5" />
                      Driver • Karachi
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    Online
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-accent/40 px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-foreground">4.9</span>
                    <span className="text-[10px] text-muted-foreground">(128)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    5 yrs exp
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Verified
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating card: Booking confirmation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute -right-2 -bottom-4 z-20 w-60 rotate-[2deg] overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-lift backdrop-blur-lg"
            >
              <div className="h-1 w-full bg-emerald-500" />
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Booking Confirmed
                  </p>
                </div>
                <p className="mt-2.5 text-sm font-bold text-foreground">House Cleaning</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  <Clock className="mr-0.5 inline h-3 w-3" />
                  Tomorrow, 10:00 AM
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src="https://i.pravatar.cc/40?img=47"
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-black/5"
                      alt=""
                    />
                    <span className="text-[11px] font-medium text-foreground">Sana K.</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
                    <Star className="h-3 w-3 fill-current" />
                    4.9
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating mini card: Trending */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-28 left-0 z-20 flex items-center gap-2 rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow-card backdrop-blur-lg"
            >
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">+340 bookings today</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Small Components ─── */

function Stat({
  icon: Icon,
  value,
  label,
  filled = false,
}: {
  icon: typeof Star;
  value: string;
  label: string;
  filled?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${filled
          ? "bg-amber-50 dark:bg-amber-950/50"
          : "bg-primary/5"
          }`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${filled ? "fill-amber-400 text-amber-400" : "text-primary"
            }`}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-xs font-bold text-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </span>
    </span>
  );
}

function BentoTile({
  icon: Icon,
  label,
  stat,
  rating,
  slug,
  className = "",
  accent = false,
  trending = false,
}: {
  icon: typeof Star;
  label: string;
  stat: string;
  rating: string;
  slug: string;
  className?: string;
  accent?: boolean;
  trending?: boolean;
}) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${accent
          ? "border-primary/20 bg-primary shadow-soft"
          : "border-border/60 bg-card/80 shadow-card backdrop-blur-sm hover:border-primary/30"
        } ${className}`}
    >
      {/* Background decorative icon */}
      <Icon
        className={`pointer-events-none absolute transition-transform duration-500 group-hover:scale-110 ${accent
          ? "-bottom-6 -right-6 h-32 w-32 text-white/[0.07]"
          : "-bottom-4 -right-4 h-24 w-24 text-primary/[0.06]"
          }`}
        strokeWidth={1.2}
      />

      {/* Top row */}
      <div className="relative z-10 flex items-start justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${accent
            ? "bg-white/20 shadow-sm shadow-black/10"
            : "bg-primary/5 text-primary-dark"
            }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        {trending && (
          <span className="flex items-center gap-0.5 rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90">
            <TrendingUp className="h-2.5 w-2.5" />
            Hot
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="relative z-10 mt-auto">
        <p
          className={`text-sm font-bold ${accent ? "text-primary-foreground" : "text-foreground"
            }`}
        >
          {label}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p
            className={`text-xs ${accent ? "text-primary-foreground/60" : "text-muted-foreground"
              }`}
          >
            {stat}
          </p>
          <span
            className={`text-xs ${accent ? "text-primary-foreground/40" : "text-border"
              }`}
          >
            •
          </span>
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${accent ? "text-amber-200" : "text-amber-500"
              }`}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            {rating}
          </span>
        </div>
      </div>

    </div>
  );
}