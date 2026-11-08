import { Link, useNavigate } from "react-router-dom";
import { MapPin, MessageSquare, RotateCcw, Star, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messagesPath } from "@/lib/startChat";

export type MyWorker = {
  workerId: string;
  gigId: string | null;
  workerName: string;
  workerAvatar?: string;
  category: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  priceUnit?: "month" | "hour" | "day";
  timesBooked: number;
  lastBookedAt?: string;
  lastBookingDate?: string;
  rating: number;
  reviewsCount: number;
  myRating?: number | null;
  available: boolean;
};

const formatDate = (w: MyWorker) => {
  const raw = w.lastBookingDate || w.lastBookedAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export function MyWorkerCard({ worker, compact = false }: { worker: MyWorker; compact?: boolean }) {
  const navigate = useNavigate();
  const last = formatDate(worker);

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft ${
        worker.available ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-4">
        <img
          src={worker.workerAvatar}
          alt=""
          className="h-14 w-14 shrink-0 rounded-2xl bg-muted object-cover object-top"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{worker.workerName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {worker.category}
            {worker.city && (
              <span className="inline-flex items-center gap-1">
                {" "}• <MapPin className="h-3 w-3" /> {worker.city}
              </span>
            )}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{(worker.rating || 0).toFixed(1)}</span>
            <span className="text-muted-foreground">({worker.reviewsCount})</span>
          </div>
        </div>
        {!worker.available && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Unavailable
          </span>
        )}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarCheck className="h-3 w-3" />
            Booked {worker.timesBooked} {worker.timesBooked === 1 ? "time" : "times"}
          </span>
          {last && <span>Last: {last}</span>}
          {worker.myRating ? (
            <span className="inline-flex items-center gap-1">
              You rated {worker.myRating}
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </span>
          ) : null}
        </div>
      )}

      {!worker.available && !compact && (
        <p className="mt-3 text-xs text-muted-foreground">
          This worker isn't currently taking bookings for {worker.category}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 pt-1 sm:mt-auto">
        <Button
          size="sm"
          className="rounded-xl bg-primary hover:bg-primary-dark"
          disabled={!worker.available || !worker.gigId}
          onClick={() => navigate(`/booking?workerId=${worker.gigId}`)}
        >
          <RotateCcw className="mr-1 h-4 w-4" /> Book again
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => navigate(messagesPath({ worker: worker.workerId }))}
        >
          <MessageSquare className="mr-1 h-4 w-4" /> Message
        </Button>
        {!compact && worker.gigId && (
          <Button size="sm" variant="ghost" className="rounded-xl" asChild>
            <Link to={`/workers/${worker.gigId}`}>View profile</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
