import { LayoutDashboard, Users, ShieldCheck, Calendar, CreditCard, Star, MessageSquareWarning, BarChart3, Settings, TrendingUp, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workers, complaints } from "@/data/mock";
import { Button } from "@/components/ui/button";

const items = [
  { label: "Dashboard", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", to: "/dashboard/admin", icon: Users },
  { label: "Worker Verification", to: "/dashboard/admin", icon: ShieldCheck },
  { label: "Bookings", to: "/dashboard/admin", icon: Calendar },
  { label: "Payments", to: "/dashboard/admin", icon: CreditCard },
  { label: "Reviews", to: "/dashboard/admin", icon: Star },
  { label: "Complaints", to: "/dashboard/admin", icon: MessageSquareWarning },
  { label: "Analytics", to: "/dashboard/admin", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/admin", icon: Settings },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin" items={items}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Admin overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor platform health and take action.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Stat label="Total users" value="12,480" trend="+8.2%" icon={Users} />
          <Stat label="Total workers" value="3,260" trend="+5.1%" icon={ShieldCheck} />
          <Stat label="Pending verifications" value="48" trend="urgent" warn icon={ShieldCheck} />
          <Stat label="Total bookings" value="22,940" trend="+12%" icon={Calendar} />
          <Stat label="Revenue" value="Rs. 4.2M" trend="+18%" icon={DollarSign} />
          <Stat label="Open complaints" value="14" trend="-3" icon={MessageSquareWarning} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Worker verification queue</h2>
              <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold uppercase text-yellow-800">{workers.length} pending</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Worker</th><th>CNIC</th><th>Applied</th><th></th></tr>
                </thead>
                <tbody>
                  {workers.slice(0, 4).map(w => (
                    <tr key={w.id} className="border-t border-border">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <img src={w.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
                          <div className="min-w-0"><p className="truncate text-xs font-bold">{w.fullName}</p><p className="truncate text-[10px] text-muted-foreground">{w.category}</p></div>
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground">35202-{Math.floor(Math.random()*9999999)}-1</td>
                      <td className="text-xs text-muted-foreground">{w.memberSince}</td>
                      <td className="space-x-1 text-right">
                        <button className="rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-primary-foreground hover:bg-primary-dark">Approve</button>
                        <button className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold hover:border-destructive hover:text-destructive">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-base font-bold">Open complaints</h2>
            <div className="mt-4 space-y-3">
              {complaints.map(c => (
                <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold">#{c.id} • {c.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.customerName} vs {c.workerName}</p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-800">{c.status.replace("_"," ")}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-lg bg-primary hover:bg-primary-dark">View</Button>
                    <Button size="sm" variant="outline" className="rounded-lg">Message users</Button>
                    <Button size="sm" variant="outline" className="rounded-lg">Refund</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">Platform analytics</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <MiniChart label="User growth" value="+24%" />
            <MiniChart label="Revenue" value="+18%" />
            <MiniChart label="Avg rating" value="4.86" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, trend, warn, icon: Icon }: { label: string; value: string; trend: string; warn?: boolean; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className={`mt-1 text-[10px] font-bold uppercase ${warn ? "text-destructive" : "text-primary"}`}>{trend}</p>
    </div>
  );
}
function MiniChart({ label, value }: { label: string; value: string }) {
  const heights = [40, 65, 50, 80, 60, 90, 75];
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-black">{value}</p>
        <span className="inline-flex items-center text-xs font-semibold text-primary"><TrendingUp className="mr-0.5 h-3 w-3" /> 7 days</span>
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5">
        {heights.map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-primary/30" style={{ height: `${h}%` }} />)}
      </div>
    </div>
  );
}
