import { Link } from "react-router-dom";
import { LayoutDashboard, Calendar, CreditCard, Star, MessageSquareWarning, User, Settings, Bell, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { notifications } from "@/data/mock";
import { customerItems } from "@/data/customerMenu";
import { useEffect, useState } from "react";
import RecommendedWorkers from "@/components/customers/RecommendedWorkers";
import { api } from "@/services/api";

const items = [
  { label: "Overview", to: "/dashboard/customer", icon: LayoutDashboard },
  { label: "My Bookings", to: "/my-bookings", icon: Calendar },
  { label: "Transactions", to: "/transactions", icon: CreditCard },
  { label: "Reviews", to: "/reviews", icon: Star },
  { label: "Disputes", to: "/disputes", icon: MessageSquareWarning },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];
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
export default function CustomerDashboard() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [stats, setStats] = useState({

    activeBookings: 0,

    totalSpent: 0,

    favoriteWorkers: 0,

    reviewsLeft: 0

  });

  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchDashboard();
    fetchBookings();
  }, []);
  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/dashboard/customer");
      console.log(data);

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
    }
  };
  const fetchBookings = async () => {
    try {
      // const token = localStorage.getItem("token");

      // const response = await fetch(
      //   `${API_BASE_URL}/bookings/my`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );

      // const data = await response.json();
      const { data } = await api.get("/bookings/my");

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Bookings fetch failed:", error);
    }
  };
  return (
    <DashboardLayout
      title="Customer"
      items={customerItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your account.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active bookings" value={stats.activeBookings.toString()} hint="2 confirmed" />
          <StatCard label="Total spent" value={`Rs. ${stats.totalSpent}`} hint="Last 30 days" />
          <StatCard label="Favourite workers" value={stats.favoriteWorkers.toString()} hint="Saved" />
          <StatCard label="Reviews left" value={stats.reviewsLeft.toString()} hint="Avg 4.8 ★" />
        </div>
        <RecommendedWorkers />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Recent bookings</h2>
              <Link to="/my-bookings" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
            </div>
            <div className="mt-4 space-y-3">
              {bookings.slice(0, 3).map(b => (
                <div key={b.bookingId} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                  <img src={b.workerAvatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{b.workerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.category} • {b.date} • {b.timeSlot}</p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold uppercase text-primary-dark">{b.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-base font-bold">Notifications</h2>
            <div className="mt-4 space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <Bell className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </div>
              ))}
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
