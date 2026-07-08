import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

const tabs: { id: "upcoming" | "completed" | "cancelled"; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const isUpcoming = (s: string) => s === "confirmed" || s === "pending" || s === "in_progress";

export default function MyBookingsPage() {
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/my")
      .then((res) => setBookings(res.data.bookings))
      .catch((err) => alert(err.message ?? "Could not load bookings"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b => tab === "upcoming" ? isUpcoming(b.status) : b.status === tab);

  return (
    <DashboardLayout
      title="Customer"
      items={workerItems}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">My bookings</h1>
            <p className="mt-2 text-sm text-muted-foreground">Track, reschedule or cancel your service requests.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary-dark"><Link to="/services">+ New booking</Link></Button>
        </div>

        <div className="mt-6 inline-flex rounded-full bg-muted p-1 text-sm font-bold">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2 transition ${tab === t.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {loading && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              Loading your bookings...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-bold">No {tab} bookings</p>
              <p className="mt-1 text-sm text-muted-foreground">When you book a worker it'll show up here.</p>
            </div>
          )}
          {filtered.map(b => <BookingRow key={b.bookingId} booking={b} />)}
        </div>
      </div>
    </DashboardLayout>
  );
}

function BookingRow({ booking }: { booking: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <img src={booking.workerAvatar} alt="" className="h-14 w-14 rounded-2xl object-cover" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">#{booking.bookingId}</p>
          <p className="truncate text-base font-bold">{booking.workerName}</p>
          <p className="truncate text-xs text-muted-foreground">{booking.category}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {booking.date} • {booking.timeSlot}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {booking.address}</span>
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
          <StatusBadge status={booking.status} />
          <p className="text-base font-black">Rs. {booking.total.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {booking.status === "confirmed" && (
          <>
            <Button size="sm" variant="outline" className="rounded-xl">Reschedule</Button>
            <Button size="sm" variant="outline" className="rounded-xl text-destructive"><X className="mr-1 h-3 w-3" />Cancel</Button>
          </>
        )}
        {booking.status === "completed" && (
          <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary-dark"><Link to="/reviews">Leave review</Link></Button>
        )}
        <Button asChild size="sm" variant="ghost" className="rounded-xl"><Link to="/disputes">Report issue</Link></Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-primary-soft text-primary-dark",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-primary text-primary-foreground",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status.replace("_", " ")}</span>;
}