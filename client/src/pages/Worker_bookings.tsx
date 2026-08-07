import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, MessageSquare, Phone, X, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { HgAlert } from "@/components/ui/HgAlert";
import { messagesPath } from "@/lib/startChat";

const tabs: { id: "upcoming" | "completed" | "cancelled"; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const slots = ["08:00 – 10:00", "10:00 – 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00"];

const isUpcoming = (s: string) => s === "confirmed" || s === "pending" || s === "in_progress";

type AlertState = {
  open: boolean;
  type: "error" | "warning" | "success" | "server";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function WorkerBookingsPage() {
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false, type: "error", title: "", description: "",
  });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const loadBookings = () => {
    setLoading(true);
    api.get("/bookings/worker/my")
      .then((res) =>
        setBookings(
          res.data.bookings.map((b: any) => ({
            ...b,
            id: b.bookingId,
          }))
        )
      )
      .catch((err) => setAlertState({
        open: true,
        type: "error",
        title: "Could not load bookings",
        description: err.message ?? "Something went wrong while fetching your bookings.",
      }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const confirmCancel = (bookingId: string) => {
    setAlertState({
      open: true,
      type: "warning",
      title: "Cancel this booking?",
      description: "The customer will be notified that you cancelled this booking.",
      actionLabel: "Yes, cancel it",
      onAction: () => doCancel(bookingId),
    });
  };

  const doCancel = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/worker/cancel`);
      setBookings((prev) => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      setAlertState({
        open: true,
        type: "success",
        title: "Booking cancelled",
        description: "This booking has been cancelled successfully.",
      });
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Cancellation failed",
        description: err.message ?? "Could not cancel this booking. Please try again.",
      });
    }
  };

  const handleReschedule = async (bookingId: string, date: string, timeSlot: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/worker/reschedule`, { date, timeSlot });
      setBookings((prev) => prev.map(b => b.id === bookingId ? { ...b, date, timeSlot } : b));
      setReschedulingId(null);
      setAlertState({
        open: true,
        type: "success",
        title: "Booking rescheduled",
        description: "The new date and time slot have been saved.",
      });
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Reschedule failed",
        description: err.message ?? "Could not reschedule this booking. Please try again.",
      });
    }
  };

  const confirmComplete = (bookingId: string) => {
    setAlertState({
      open: true,
      type: "warning",
      title: "Mark this booking as completed?",
      description: "Only do this once the service has actually been delivered.",
      actionLabel: "Yes, mark completed",
      onAction: () => doComplete(bookingId),
    });
  };

  const doComplete = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/complete`);
      setBookings((prev) => prev.map(b => b.id === bookingId ? { ...b, status: "completed" } : b));
      setAlertState({
        open: true,
        type: "success",
        title: "Booking completed",
        description: "This booking has been marked as completed.",
      });
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not mark as completed",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    }
  };

  const filtered = bookings.filter(b => tab === "upcoming" ? isUpcoming(b.status) : b.status === tab);

  return (
    <DashboardLayout
      title="Worker"
      items={workerItems}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">My bookings</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your service requests from customers.</p>
          </div>
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
              <p className="mt-1 text-sm text-muted-foreground">When a customer books you, it'll show up here.</p>
            </div>
          )}
          {filtered.map(b => (
            <BookingRow
              key={b.id}
              booking={b}
              isRescheduling={reschedulingId === b.id}
              onStartReschedule={() => setReschedulingId(b.id)}
              onCancelReschedule={() => setReschedulingId(null)}
              onConfirmReschedule={(date, timeSlot) => handleReschedule(b.id, date, timeSlot)}
              onCancelBooking={() => confirmCancel(b.id)}
              onCompleteBooking={() => confirmComplete(b.id)}
            />
          ))}
        </div>
      </div>

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
        actionLabel={alertState.actionLabel}
        onAction={alertState.onAction}
        cancelLabel={alertState.actionLabel ? "No, go back" : "Got it"}
      />
    </DashboardLayout>
  );
}

function BookingRow({
  booking,
  isRescheduling,
  onStartReschedule,
  onCancelReschedule,
  onConfirmReschedule,
  onCancelBooking,
  onCompleteBooking,
}: {
  booking: any;
  isRescheduling: boolean;
  onStartReschedule: () => void;
  onCancelReschedule: () => void;
  onConfirmReschedule: (date: string, timeSlot: string) => void;
  onCancelBooking: () => void;
  onCompleteBooking: () => void;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [newDate, setNewDate] = useState(booking.date || todayStr);
  const [newSlot, setNewSlot] = useState(booking.timeSlot || slots[0]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">#{booking.id}</p>
          <p className="truncate text-base font-bold">{booking.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">{booking.category}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {booking.date} • {booking.timeSlot}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {booking.address}</span>
            {booking.customerPhone && (
              <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {booking.customerPhone}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <StatusBadge status={booking.status} />
          <p className="text-base font-black">Rs. {booking.total.toLocaleString()}</p>
        </div>
      </div>

      {isRescheduling ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="date" min={todayStr} value={newDate} onChange={(e) => setNewDate(e.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <select value={newSlot} onChange={(e) => setNewSlot(e.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
              {slots.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary-dark" onClick={() => onConfirmReschedule(newDate, newSlot)}>
              Confirm new slot
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={onCancelReschedule}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {booking.status === "confirmed" && (
            <>
              <Button size="sm" className="rounded-xl bg-primary hover:bg-primary-dark" onClick={onCompleteBooking}>
                <CheckCircle2 className="mr-1 h-3 w-3" />Mark completed
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={onStartReschedule}>Reschedule</Button>
              <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={onCancelBooking}>
                <X className="mr-1 h-3 w-3" />Cancel
              </Button>
            </>
          )}
          {booking.status === "pending" && (
            <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={onCancelBooking}>
              <X className="mr-1 h-3 w-3" />Cancel
            </Button>
          )}
          {/* The worker's side of the same conversation: confirm the address,
              ask what's needed, tell them you're running late. */}
          {booking.customerId && (
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link
                to={messagesPath({
                  customer: booking.customerId,
                  booking: booking.id,
                })}
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Message {(booking.customerName ?? "customer").split(" ")[0]}
              </Link>
            </Button>
          )}
        </div>
      )}
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