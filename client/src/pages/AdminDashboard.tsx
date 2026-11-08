import { Link } from "react-router-dom";
import { Users, ShieldCheck, Calendar, MessageSquareWarning, DollarSign, Loader2, Star, PiggyBank } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminItems } from "@/data/adminMenu";
import {
  adminService,
  type AdminOverview,
  type SeriesPoint,
} from "@/services/adminService";
import type { Complaint } from "@/types";

const formatNumber = (value: number) => value.toLocaleString();

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rs. ${(value / 1_000).toFixed(1)}K`;
  return `Rs. ${value}`;
};

// A trend of null means there was no previous week to compare against.
const formatTrend = (value: number | null) => {
  if (value === null) return "no prior data";
  if (value === 0) return "no change";
  return `${value > 0 ? "+" : ""}${value}% vs last week`;
};

const sum = (points: SeriesPoint[] | undefined) =>
  (points ?? []).reduce((total, p) => total + p.value, 0);

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await adminService.getOverview();
      setOverview(data);
    } catch (error: any) {
      setLoadError(error?.message ?? "Failed to load platform overview");
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const [customerRes, workerRes] = await Promise.all([
        adminService.getCustomerComplaints(),
        adminService.getWorkerComplaints(),
      ]);

      const merged: Complaint[] = [
        ...(customerRes.data.success ? customerRes.data.complaints : []),
        ...(workerRes.data.success ? workerRes.data.complaints : []),
      ];

      const openOnly = merged
        .filter((c) => c.status === "open")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setComplaints(openOnly);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadOverview();
    fetchComplaints();
  }, []);

  const stats = overview?.stats;
  const series = overview?.series;

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Admin overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor platform health and take action.</p>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {loadError}{" "}
            <button onClick={loadOverview} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-border bg-card p-16 shadow-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                label="Total users"
                value={formatNumber(stats?.totalUsers ?? 0)}
                trend={`${formatNumber(stats?.totalCustomers ?? 0)} customers`}
                caption={`+${sum(series?.users)} new this week`}
                points={series?.users ?? []}
                color="#3b82f6"
                name="New users"
                icon={Users}
              />
              <Stat
                label="Total workers"
                value={formatNumber(stats?.totalWorkers ?? 0)}
                trend={`${formatNumber(stats?.pendingVerifications ?? 0)} unverified`}
                caption={`+${sum(series?.workers)} new this week`}
                points={series?.workers ?? []}
                color="#8b5cf6"
                name="New workers"
                icon={ShieldCheck}
              />
              <Stat
                label="Pending verifications"
                value={formatNumber(stats?.pendingVerifications ?? 0)}
                trend={stats?.pendingVerifications ? "needs review" : "all clear"}
                caption={`${sum(series?.verifications)} applied this week`}
                warn={!!stats?.pendingVerifications}
                points={series?.verifications ?? []}
                color="#f59e0b"
                name="Applications"
                icon={ShieldCheck}
              />
              <Stat
                label="Total bookings"
                value={formatNumber(stats?.totalBookings ?? 0)}
                trend={formatTrend(overview?.trends.bookings ?? null)}
                caption={`${sum(series?.bookings)} this week`}
                points={series?.bookings ?? []}
                color="#16a34a"
                name="Bookings"
                icon={Calendar}
              />
              <Stat
                label="Revenue"
                value={formatMoney(stats?.grossRevenue ?? 0)}
                trend={formatTrend(overview?.trends.revenue ?? null)}
                caption={`Profit ${formatMoney(stats?.platformEarnings ?? 0)} (5% cut)`}
                points={series?.revenue ?? []}
                color="#0ea5e9"
                name="Revenue"
                money
                icon={DollarSign}
              />
              <Stat
                label="Open complaints"
                value={formatNumber(complaints.length)}
                trend={complaints.length > 0 ? "needs review" : "all clear"}
                caption={`${sum(series?.complaints)} filed this week`}
                warn={complaints.length > 0}
                points={series?.complaints ?? []}
                color="#ef4444"
                name="Complaints"
                icon={MessageSquareWarning}
              />
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Open complaints</h2>
                <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold uppercase text-yellow-800">{complaints.length} total</span>
              </div>
              <div className="mt-4 space-y-3">
                {complaints.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No open complaints.</p>
                )}
                {complaints.slice(0, 4).map((c) => (
                  <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold">#{c.id} • {c.subject}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {c.customerName} ({c.customerId}) vs {c.workerName} ({c.workerId})
                        </p>
                      </div>
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-800">{c.status.replace("_", " ")}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="rounded-lg bg-primary hover:bg-primary-dark">
                        <Link to="/dashboard/admin/complaints">Review & resolve</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-lg">
                        <Link to="/dashboard/admin/bookings">View booking</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {complaints.length > 4 && (
                  <Link
                    to="/dashboard/admin/complaints"
                    className="inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    View all {complaints.length} complaints →
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold">Platform analytics</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Last 7 days.</p>
                </div>
                <Link to="/dashboard/admin/earnings" className="inline-flex items-center text-xs font-semibold text-primary hover:underline">
                  <PiggyBank className="mr-1 h-3.5 w-3.5" /> Month-by-month earnings →
                </Link>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                  <p className="text-2xl font-black">{formatNumber(sum(series?.bookings))}</p>
                  <div className="mt-2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={series?.bookings ?? []} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [v, "Bookings"]} />
                        <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue vs profit</p>
                  <p className="text-2xl font-black">
                    {formatMoney(sum(series?.revenue))}{" "}
                    <span className="text-sm font-bold text-primary">/ {formatMoney(sum(series?.profit))} profit</span>
                  </p>
                  <div className="mt-2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={(series?.revenue ?? []).map((p, i) => ({ ...p, profit: series?.profit[i]?.value ?? 0 }))}
                        margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number, n: string) => [`Rs. ${v.toLocaleString()}`, n === "value" ? "Revenue" : "Profit"]} />
                        <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
                        <Area type="monotone" dataKey="profit" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <p className="mt-4 inline-flex items-center text-xs font-semibold text-primary">
                <Star className="mr-1 h-3 w-3" /> Avg rating {stats?.avgRating ?? 0} from {formatNumber(stats?.reviewsCount ?? 0)} reviews
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function Stat({
  label,
  value,
  trend,
  caption,
  warn,
  points,
  color,
  name,
  money,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: string;
  caption: string;
  warn?: boolean;
  points: SeriesPoint[];
  color: string;
  name: string;
  money?: boolean;
  icon: typeof Users;
}) {
  const gradientId = `grad-${label.replace(/\W/g, "")}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className={`mt-1 text-[10px] font-bold uppercase ${warn ? "text-destructive" : "text-primary"}`}>{trend}</p>

      <div className="mt-3 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide domain={[0, (max: number) => Math.max(max, 1)]} />
            <Tooltip
              contentStyle={{ borderRadius: 10, fontSize: 11, padding: "4px 8px" }}
              formatter={(v: number) => [money ? `Rs. ${v.toLocaleString()}` : v, name]}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{caption} · last 7 days</p>
    </div>
  );
}
