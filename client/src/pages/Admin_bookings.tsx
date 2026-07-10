import { useEffect, useRef, useState } from "react";
import { MoreVertical, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
// import { bookings as initialBookings } from "@/data/mock";
import { bookingService } from "@/services/bookingService";
import { toast } from "sonner";
import type { Booking } from "@/types";
import type { BookingStatus } from "@/types";

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
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const filtered = bookings.filter((b) => filter === "all" || b.status === filter);
  const cancelTarget =
    bookings.find((b) => b.bookingId === cancelTargetId) ?? null;

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

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);

  // Close the confirm modal on Escape
  useEffect(() => {
    if (!cancelTargetId) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setCancelTargetId(null);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [cancelTargetId]);

  async function confirmCancel() {
    if (!cancelTargetId) return;

    try {
      await bookingService.cancelBooking(cancelTargetId);

      toast.success("Booking cancelled");

      await loadBookings();

    } catch {
      toast.error("Unable to cancel booking");
    }

    setCancelTargetId(null);
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
                        <img src={b.workerAvatar} className="h-8 w-8 rounded-full object-cover" alt="" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{b.workerName}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{b.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{b.date} • {b.timeSlot}</td>
                    <td className="text-xs font-semibold">Rs. {b.total.toLocaleString()}</td>
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
                            left: rect.right - 145,
                          });
                          console.log("Clicked:", b.bookingId);
                          console.log(rect);

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
                  <tr><td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-40 rounded-xl border border-border bg-card shadow-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <button
            disabled={
              bookings.find((b) => b.bookingId === openMenuId)?.status === "cancelled"
            }
            onClick={() => {
              setCancelTargetId(openMenuId);
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            Cancel booking
          </button>
        </div>
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setCancelTargetId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">Cancel booking?</h2>
              <button
                onClick={() => setCancelTargetId(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to cancel booking <span className="font-semibold text-foreground">{cancelTarget.bookingId}</span> with{" "}
              <span className="font-semibold text-foreground">{cancelTarget.workerName}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setCancelTargetId(null)}
                className="rounded-full bg-secondary px-4 py-2 text-xs font-bold text-foreground transition hover:opacity-80"
              >
                Keep booking
              </button>
              <button
                onClick={confirmCancel}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}