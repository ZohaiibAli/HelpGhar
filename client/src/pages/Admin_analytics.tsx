import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Loader2,
  MessageSquareWarning,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import {
  adminService,
  type AdminOverview,
  type SeriesPoint,
} from "@/services/adminService";

/**
 * Every figure on this page comes from /dashboard/admin. It previously
 * rendered literals -- "+24%", "Rs. 4.2M", "22,940" bookings and a made-up
 * category ranking -- which looked like analytics but told an admin nothing
 * about their own platform, and the page was never routed at all.
 */

const formatNumber = (value: number) => value.toLocaleString();

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rs. ${(value / 1_000).toFixed(1)}K`;
  return `Rs. ${formatNumber(value)}`;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-primary",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-destructive",
};

function TrendBadge({ value }: { value: number | null }) {
  // A null trend means there was no previous week to compare with. Showing
  // a dash is the honest answer; "+0%" would imply we measured something.
  if (value === null) {
    return (
      <span className="text-xs font-semibold text-muted-foreground">
        no prior week
      </span>
    );
  }

  const up = value >= 0;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold ${
        up ? "text-primary" : "text-destructive"
      }`}
    >
      {up ? (
        <TrendingUp className="mr-0.5 h-3 w-3" />
      ) : (
        <TrendingDown className="mr-0.5 h-3 w-3" />
      )}
      {up ? "+" : ""}
      {value}% vs last week
    </span>
  );
}

function ChartCard({
  label,
  value,
  trend,
  points,
  positive = true,
}: {
  label: string;
  value: string;
  trend?: number | null;
  points: SeriesPoint[];
  positive?: boolean;
}) {
  const peak = Math.max(...points.map((point) => point.value), 0);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className="text-2xl font-black">{value}</p>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>

      <div className="mt-4 flex h-24 items-end gap-1.5">
        {points.length === 0 ? (
          <p className="w-full self-center text-center text-[10px] text-muted-foreground">
            No activity in this period
          </p>
        ) : (
          points.map((point) => (
            <div
              key={point.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                title={`${point.date}: ${formatNumber(point.value)}`}
                className={`w-full rounded-t-md ${
                  positive ? "bg-primary/30" : "bg-destructive/30"
                }`}
                // Scaled against the peak; a floor of 4% keeps a zero day
                // visible as a baseline rather than collapsing it away.
                style={{
                  height:
                    peak > 0 ? `${Math.max((point.value / peak) * 100, 4)}%` : "4%",
                }}
              />
              <span className="text-[9px] text-muted-foreground">{point.day}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  warn,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p
        className={`mt-1 text-[10px] font-bold uppercase ${
          warn ? "text-destructive" : "text-primary"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await adminService.getOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = overview?.stats;
  const categories = overview?.categories ?? [];
  const statusBreakdown = overview?.statusBreakdown;

  const bookingSeries = overview?.series.bookings ?? [];
  const revenueSeries = overview?.series.revenue ?? [];

  const bookingsThisWeek = bookingSeries.reduce((sum, p) => sum + p.value, 0);
  const revenueThisWeek = revenueSeries.reduce((sum, p) => sum + p.value, 0);

  const totalByStatus = statusBreakdown
    ? Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform performance, straight from the live database.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}{" "}
            <button onClick={load} className="font-bold underline">
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Total users"
                value={formatNumber(stats?.totalUsers ?? 0)}
                hint={`${formatNumber(stats?.totalCustomers ?? 0)} customers • ${formatNumber(
                  stats?.totalWorkers ?? 0
                )} workers`}
                icon={Users}
              />
              <Stat
                label="Gross revenue"
                value={formatMoney(stats?.grossRevenue ?? 0)}
                hint={`${formatMoney(stats?.platformEarnings ?? 0)} platform fees`}
                icon={DollarSign}
              />
              <Stat
                label="Completed bookings"
                value={formatNumber(stats?.completedBookings ?? 0)}
                hint={`${formatNumber(stats?.activeBookings ?? 0)} still active`}
                icon={Calendar}
              />
              <Stat
                label="Open complaints"
                value={formatNumber(stats?.openComplaints ?? 0)}
                hint={stats?.openComplaints ? "needs review" : "all clear"}
                warn={!!stats?.openComplaints}
                icon={MessageSquareWarning}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <ChartCard
                label="Bookings — last 7 days"
                value={formatNumber(bookingsThisWeek)}
                trend={overview?.trends.bookings ?? null}
                points={bookingSeries}
              />
              <ChartCard
                label="Revenue — last 7 days"
                value={formatMoney(revenueThisWeek)}
                trend={overview?.trends.revenue ?? null}
                points={revenueSeries}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* ---------- Top categories ---------- */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-bold">Top categories by bookings</h2>

                {categories.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    No bookings yet, so there is nothing to rank.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {categories.map((entry) => (
                      <div key={entry.category}>
                        <div className="flex justify-between gap-3 text-xs font-semibold">
                          <span className="truncate">{entry.category}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatNumber(entry.bookings)} ·{" "}
                            {formatMoney(entry.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${entry.share}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---------- Status breakdown ---------- */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold">Booking status</h2>
                  <Link
                    to="/dashboard/admin/bookings"
                    className="shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
                    Manage →
                  </Link>
                </div>

                {totalByStatus === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    No bookings on the platform yet.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-secondary">
                      {Object.entries(statusBreakdown ?? {}).map(
                        ([status, count]) =>
                          count > 0 ? (
                            <div
                              key={status}
                              title={`${STATUS_LABELS[status]}: ${count}`}
                              className={STATUS_COLORS[status]}
                              style={{
                                width: `${(count / totalByStatus) * 100}%`,
                              }}
                            />
                          ) : null
                      )}
                    </div>

                    <ul className="mt-4 space-y-2">
                      {Object.entries(statusBreakdown ?? {}).map(
                        ([status, count]) => (
                          <li
                            key={status}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="inline-flex items-center gap-2 font-semibold">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`}
                              />
                              {STATUS_LABELS[status]}
                            </span>
                            <span className="text-muted-foreground">
                              {formatNumber(count)} (
                              {Math.round((count / totalByStatus) * 100)}%)
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-base font-bold">Service quality</h2>
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <p className="text-3xl font-black">{stats?.avgRating ?? 0}</p>
                <span className="inline-flex items-center text-xs font-semibold text-primary">
                  <Star className="mr-0.5 h-3 w-3 fill-current" />
                  average across {formatNumber(stats?.reviewsCount ?? 0)} reviews
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatNumber(stats?.pendingVerifications ?? 0)} worker
                {stats?.pendingVerifications === 1 ? "" : "s"} still awaiting CNIC
                verification.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
