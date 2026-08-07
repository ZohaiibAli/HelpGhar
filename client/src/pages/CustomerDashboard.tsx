import { Link } from "react-router-dom";
import { Bell, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { useEffect, useState } from "react";
import RecommendedWorkers from "@/components/customers/RecommendedWorkers";
import { api } from "@/services/api";
import type { NotificationItem } from "@/types";

interface Booking {
  _id: string;
  bookingId: string;
  workerName: string;
  workerAvatar: string;
  category: string;
  date: string;
  timeSlot: string;
  status: string;
}

const noticeIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
} as const;

const noticeColors = {
  success: "text-primary",
  warning: "text-yellow-600",
  error: "text-destructive",
  info: "text-muted-foreground",
} as const;

export default function CustomerDashboard() {
  const [stats, setStats] = useState({

    activeBookings: 0,

    totalSpent: 0,

    favoriteWorkers: 0,

    reviewsLeft: 0

  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchBookings()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/dashboard/customer");

      if (data.success) {
        setStats(data.stats);
        // Real account activity. This panel used to render a shared
        // mock list, so every customer saw the same three fictional
        // notifications about workers they had never booked.
        setNotifications(data.notifications ?? []);
      }
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings/my");

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Bookings fetch failed:", error);
    }
  };

  const recentBookings = bookings.slice(0, 3);

  return (
    <DashboardLayout
      title="Customer"
      items={customerItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your account.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active bookings"
            value={stats.activeBookings.toString()}
            hint={stats.activeBookings > 0 ? "In progress" : "All caught up"}
          />
          <StatCard
            label="Total spent"
            value={`Rs. ${stats.totalSpent.toLocaleString()}`}
            hint="All time, refunds excluded"
          />
          <StatCard
            label="Workers hired"
            value={stats.favoriteWorkers.toString()}
            hint={stats.favoriteWorkers > 0 ? "Unique workers booked" : "None yet"}
          />
          <StatCard
            label="Reviews left"
            value={stats.reviewsLeft.toString()}
            hint={stats.reviewsLeft > 0 ? "Thanks for sharing" : "Share your experience"}
          />
        </div>
        <RecommendedWorkers />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Recent bookings</h2>
              <Link to="/my-bookings" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
            </div>
            <div className="mt-4 space-y-3">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {!loading && recentBookings.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">You haven't booked anyone yet.</p>
                  <Link to="/services" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                    Browse workers →
                  </Link>
                </div>
              )}

              {recentBookings.map(b => (
                <div key={b.bookingId} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                  {b.workerAvatar ? (
                    <img src={b.workerAvatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary-dark">
                      {b.workerName?.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{b.workerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.category} • {b.date} • {b.timeSlot}</p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold uppercase text-primary-dark">{b.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-base font-bold">Notifications</h2>
            <div className="mt-4 space-y-3">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nothing new yet. Bookings, payments and reviews show up here.
                </p>
              )}

              {notifications.map(n => {
                const Icon = noticeIcons[n.type] ?? Bell;
                return (
                  <div key={n.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                    <Icon className={`h-4 w-4 shrink-0 ${noticeColors[n.type] ?? "text-primary"}`} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(n.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Find a worker <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-primary">{hint}</p>
    </div>

  );
}
