import { TrendingUp, TrendingDown } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";

function ChartCard({ label, value, trend, up, heights }: { label: string; value: string; trend: string; up: boolean; heights: number[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-black">{value}</p>
        <span className={`inline-flex items-center text-xs font-semibold ${up ? "text-primary" : "text-destructive"}`}>
          {up ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />} {trend}
        </span>
      </div>
      <div className="mt-4 flex h-24 items-end gap-1.5">
        {heights.map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-md ${up ? "bg-primary/30" : "bg-destructive/30"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform-wide performance over the last 30 days.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <ChartCard label="User growth" value="+24%" trend="vs last month" up heights={[40, 55, 50, 65, 60, 78, 82]} />
          <ChartCard label="Revenue" value="Rs. 4.2M" trend="+18%" up heights={[30, 45, 42, 58, 55, 70, 88]} />
          <ChartCard label="Bookings completed" value="22,940" trend="+12%" up heights={[50, 48, 60, 55, 68, 72, 80]} />
          <ChartCard label="Open complaints" value="14" trend="-3 this week" up={false} heights={[60, 55, 50, 45, 40, 35, 30]} />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">Top categories by bookings</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "House Servants", pct: 82 },
              { name: "Electricians", pct: 68 },
              { name: "Cleaners", pct: 61 },
              { name: "Baby Sitters", pct: 47 },
              { name: "Drivers", pct: 39 },
            ].map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs font-semibold">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}