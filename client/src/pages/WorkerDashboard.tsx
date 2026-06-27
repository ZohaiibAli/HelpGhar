import { Link } from "react-router-dom";
import { LayoutDashboard, Briefcase, Star, Award, Bell, User, Settings, Timer, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { bookings, notifications } from "@/data/mock";

const items = [
  { label: "Overview", to: "/dashboard/worker", icon: LayoutDashboard },
  { label: "Jobs", to: "/my-bookings", icon: Briefcase },
  { label: "Reviews", to: "/reviews", icon: Star },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function WorkerDashboard() {
  return (
    <DashboardLayout title="Worker" items={items}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black md:text-3xl">Good morning, Ayesha</h1>
            <p className="mt-1 text-sm text-muted-foreground">You have 2 active jobs today.</p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-dark">Available now</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total jobs" value="184" hint="+12 this month" icon={Briefcase} />
          <Stat label="Completed" value="172" hint="93% rate" icon={TrendingUp} />
          <Stat label="Avg rating" value="4.9" hint="From 184 reviews" icon={Star} />
          <Stat label="Incentive points" value="2,540" hint="Top 5%" icon={Award} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-base font-bold">Active jobs</h2>
            <div className="mt-4 space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{b.category} — {b.address}</p>
                      <p className="text-xs text-muted-foreground">{b.date} • {b.timeSlot}</p>
                    </div>
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase text-primary-dark">{b.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-dark">Start</button>
                    <button className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:border-primary">Mark in progress</button>
                    <button className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:border-primary">Complete</button>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><Timer className="h-3 w-3" /> 01:24:53 worked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-base font-bold">Performance</h2>
              <PerfBar label="Completion rate" value={93} />
              <PerfBar label="Punctuality" value={88} />
              <PerfBar label="Reliability" value={95} />
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-base font-bold">Notifications</h2>
              <div className="mt-3 space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                    <Bell className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0"><p className="truncate text-xs font-bold">{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p></div>
                  </div>
                ))}
              </div>
              <Link to="/profile" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">Manage profile →</Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof Star }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-primary">{hint}</p>
    </div>
  );
}
function PerfBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}%</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
