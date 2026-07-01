import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { bookings } from "@/data/mock";
import type { BookingStatus } from "@/types";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-primary-soft text-primary-dark",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-secondary text-foreground",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminBookings() {
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const filtered = bookings.filter((b) => filter === "all" || b.status === filter);

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
                className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                  filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="py-3 text-xs font-bold">#{b.id}</td>
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
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}