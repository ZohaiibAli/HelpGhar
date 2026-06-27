import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShieldCheck, MapPin, Briefcase } from "lucide-react";
import type { Worker } from "@/types";

export function WorkerCard({ worker, index = 0 }: { worker: Worker; index?: number }) {
  const priceUnit = worker.priceUnit === "month" ? "/month" : worker.priceUnit === "hour" ? "/hour" : "/day";
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={worker.avatar} alt={worker.fullName}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {worker.cnicVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-1 text-[10px] font-bold text-primary-dark shadow-soft backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> CNIC Verified
            </span>
          )}
        </div>
        {worker.available && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Available Now
          </span>
        )}
        {worker.badges.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {worker.badges.slice(0, 2).map((b) => (
              <span key={b} className="rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-bold text-background backdrop-blur">{b}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">{worker.fullName}</h3>
            <p className="text-xs text-muted-foreground">{worker.category}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1 text-sm font-bold">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {worker.rating.toFixed(1)}
            </div>
            <p className="text-[10px] text-muted-foreground">({worker.reviewsCount})</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{worker.city}</span>
          <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{worker.experienceYears}y exp</span>
          <span>{worker.gender} • {worker.age}y</span>
          <span>Since {new Date(worker.memberSince).getFullYear()}</span>
        </div>

        <div className="mt-4 rounded-xl bg-muted/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price</p>
          <p className="text-sm font-bold text-foreground">
            Rs. {worker.priceMin.toLocaleString()} – {worker.priceMax.toLocaleString()}
            <span className="text-xs font-medium text-muted-foreground">{priceUnit}</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/workers/${worker.id}`}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-center text-xs font-semibold transition hover:border-primary hover:text-primary"
          >
            View Profile
          </Link>
          <Link
            to={`/booking?workerId=${worker.id}`}
            className="flex-1 rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground shadow-soft transition hover:bg-primary-dark active:scale-95"
          >
            Hire Now
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
