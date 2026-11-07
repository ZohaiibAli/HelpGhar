import { useEffect, useRef, useState } from "react";
import { Lock, MoreVertical, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
// import { bookings as initialBookings } from "@/data/mock";
import { bookingService } from "@/services/bookingService";
import { toast } from "sonner";
import type { Booking } from "@/types";
import type { BookingStatus } from "@/types";

// Kept in step with ACTIVE_STATUSES in server/routes/booking_route.py --
// the only statuses the cancel endpoint will accept.
const CANCELLABLE_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];

const ESCROW_STATUSES: BookingStatus[] = ["confirmed", "in_progress"];

type AdminAction = "cancel" | "release" | "refund" | "unlock";

const ACTION_COPY: Record<AdminAction, {
  title: string;
  body: string;
  confirm: string;
  done: string;
  danger: boolean;
}> = {
  cancel: {
    title: "Cancel booking?",
    body: "The booking will be cancelled and any payment held in escrow is refunded to the customer. This cannot be undone.",
    confirm: "Yes, cancel",
    done: "Booking cancelled",
    danger: true,
  },
  release: {
    title: "Release payment to worker?",
    body: "Use this when the work was done but the customer can't or won't share the PIN. The booking is marked completed and the held payment goes to the worker.",
    confirm: "Release payment",
    done: "Payment released to the worker",
    danger: false,
  },
  refund: {
    title: "Refund payment to customer?",
    body: "Use this when the work wasn't done. The booking is cancelled and the held payment goes back to the customer.",
    confirm: "Refund customer",
    done: "Payment refunded to the customer",
    danger: true,
  },
  unlock: {
    title: "Unlock PIN entry?",
    body: "Resets the wrong-PIN counter so the worker can try the customer's PIN again.",
    confirm: "Unlock",
    done: "PIN entry unlocked",
    danger: false,
  },
};

const paymentStyles: Record<string, { label: string; cls: string }> = {
  held: { label: "In escrow", cls: "bg-blue-100 text-blue-700" },
  released: { label: "Released", cls: "bg-emerald-100 text-emerald-700" },
  refunded: { label: "Refunded", cls: "bg-red-100 text-red-700" },
  unpaid: { label: "Unpaid", cls: "bg-secondary text-muted-foreground" },
};

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-secondary text-foreground",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminBookings() {
  // const [bookings, setBookings] = useState(initialBookings);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: AdminAction; bookingId: string } | null>(null);
  const [working, setWorking] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const filtered = bookings.filter((b) => filter === "all" || b.status === filter);
  const actionTarget =
    bookings.find((b) => b.bookingId === pendingAction?.bookingId) ?? null;
  const menuBooking = bookings.find((b) => b.bookingId === openMenuId);

  const loadBookings = async () => {
    try {
      setLoading(true);

      const res = await bookingService.getAllBookings();

      setBookings(res.data.bookings);

    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!openMenuId) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }

    // The menu is position:fixed at coordinates captured when the button
    // was clicked, so once the page scrolls it no longer sits next to the
    // row it belongs to -- it floats over an unrelated booking, which is
    // how you cancel the wrong one. Dismiss it instead of letting it drift.
    function handleReflow() {
      setOpenMenuId(null);
      setMenuPosition(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleReflow, true);
    window.addEventListener("resize", handleReflow);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleReflow, true);
      window.removeEventListener("resize", handleReflow);
    };
  }, [openMenuId]);

  // Close the confirm modal on Escape
  useEffect(() => {
    if (!pendingAction) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setPendingAction(null);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [pendingAction]);

  function chooseAction(type: AdminAction) {
    if (!openMenuId) return;
    setPendingAction({ type, bookingId: openMenuId });
    setOpenMenuId(null);
    setMenuPosition(null);
  }

  async function confirmAction() {
    if (!pendingAction || working) return;
    const { type, bookingId } = pendingAction;
    const run = {
      cancel: bookingService.cancelBooking,
      release: bookingService.releaseEscrow,
      refund: bookingService.refundEscrow,
      unlock: bookingService.unlockPin,
    }[type];

    setWorking(true);
    try {
      await run(bookingId);
      toast.success(ACTION_COPY[type].done);
      await loadBookings();
    } catch (err: any) {
      toast.error(typeof err?.message === "string" ? err.message : "Action failed");
    } finally {
      setWorking(false);
      setPendingAction(null);
    }
  }

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track all bookings across the platform.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Booking</th>
                  <th>Worker</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.bookingId} className="border-t border-border">
                    <td className="py-3 text-xs font-bold">{b.bookingId}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src={b.workerAvatar} className="h-8 w-8 rounded-full object-cover object-top" alt="" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{b.workerName}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{b.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{b.date} • {b.timeSlot}</td>
                    <td className="text-xs font-semibold">Rs. {b.total.toLocaleString()}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold uppercase ${(paymentStyles[b.paymentStatus ?? "unpaid"] ?? paymentStyles.unpaid).cls}`}>
                          {(paymentStyles[b.paymentStatus ?? "unpaid"] ?? paymentStyles.unpaid).label}
                        </span>
                        {b.pinLocked && ESCROW_STATUSES.includes(b.status) && (
                          <span title="Locked after 5 wrong PIN attempts" className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase text-orange-700">
                            <Lock className="h-3 w-3" /> PIN locked
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyles[b.status]}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          if (openMenuId === b.bookingId) {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                            return;
                          }
                          const rect = e.currentTarget.getBoundingClientRect();

                          setMenuPosition({
                            top: rect.bottom + 6,
                            left: Math.max(8, rect.right - 190),
                          });
                          setOpenMenuId(b.bookingId);
                        }}
                        className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                        aria-label="Booking actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <button
            // Mirrors ACTIVE_STATUSES on the server: it refuses to cancel a
            // completed or already-cancelled booking. Only "cancelled" was
            // greyed out here, so cancelling a completed job looked
            // available and came back as an error toast.
            disabled={
              !CANCELLABLE_STATUSES.includes(
                bookings.find((b) => b.bookingId === openMenuId)?.status as BookingStatus
              )
            }
            onClick={() => chooseAction("cancel")}
            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            Cancel booking
          </button>
          {menuBooking && ESCROW_STATUSES.includes(menuBooking.status) && (
            <div className="border-t border-border">
              <p className="px-4 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Escrow</p>
              <button
                onClick={() => chooseAction("release")}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Release to worker
              </button>
              <button
                onClick={() => chooseAction("refund")}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Refund to customer
              </button>
              {menuBooking.pinLocked && (
                <button
                  onClick={() => chooseAction("unlock")}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-foreground transition hover:bg-secondary"
                >
                  Unlock PIN entry
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {pendingAction && actionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setPendingAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">{ACTION_COPY[pendingAction.type].title}</h2>
              <button
                onClick={() => setPendingAction(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Booking <span className="font-semibold text-foreground">{actionTarget.bookingId}</span> with{" "}
              <span className="font-semibold text-foreground">{actionTarget.workerName}</span>{" "}
              (Rs. {actionTarget.total.toLocaleString()}).
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{ACTION_COPY[pendingAction.type].body}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPendingAction(null)}
                className="rounded-full bg-secondary px-4 py-2 text-xs font-bold text-foreground transition hover:opacity-80"
              >
                Go back
              </button>
              <button
                onClick={confirmAction}
                disabled={working}
                className={`rounded-full px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60 ${
                  ACTION_COPY[pendingAction.type].danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {working ? "Working..." : ACTION_COPY[pendingAction.type].confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}