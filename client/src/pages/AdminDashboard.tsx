import { Link } from "react-router-dom";
import { Users, ShieldCheck, Calendar, MessageSquareWarning, TrendingUp, DollarSign, Loader2, Star } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminItems } from "@/data/adminMenu";
import { HgAlert } from "@/components/ui/HgAlert";
import {
  adminService,
  type AdminOverview,
  type PendingWorker,
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

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [queue, setQueue] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "success" | "error" | "server";
    title: string;
    description: string;
  }>({ open: false, type: "success", title: "", description: "" });

  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const loadOverview = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await adminService.getOverview();
      setOverview(data);
      setQueue(data.verificationQueue);
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

  const decideVerification = async (
    worker: PendingWorker,
    action: "approve" | "reject"
  ) => {
    setVerifying(worker.workerId);
    try {
      await adminService.setWorkerVerification(worker.workerId, action);

      // Decided workers leave the queue; keep the headline count in step
      // so the card and the list can't disagree.
      setQueue((list) => list.filter((w) => w.workerId !== worker.workerId));
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                pendingVerifications: Math.max(prev.stats.pendingVerifications - 1, 0),
              },
            }
          : prev
      );

      setAlertState({
        open: true,
        type: "success",
        title: action === "approve" ? "Worker verified" : "Verification rejected",
        description:
          action === "approve"
            ? `${worker.fullName} is now a verified worker.`
            : `${worker.fullName}'s verification was rejected.`,
      });
    } catch (error: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Action failed",
        description: error?.message ?? "Could not update this worker. Please try again.",
      });
    } finally {
      setVerifying(null);
    }
  };

  const stats = overview?.stats;

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Stat
                label="Total users"
                value={formatNumber(stats?.totalUsers ?? 0)}
                trend={`${formatNumber(stats?.totalCustomers ?? 0)} customers`}
                icon={Users}
              />
              <Stat
                label="Total workers"
                value={formatNumber(stats?.totalWorkers ?? 0)}
                trend={`${formatNumber(stats?.pendingVerifications ?? 0)} unverified`}
                icon={ShieldCheck}
              />
              <Stat
                label="Pending verifications"
                value={formatNumber(stats?.pendingVerifications ?? 0)}
                trend={stats?.pendingVerifications ? "needs review" : "all clear"}
                warn={!!stats?.pendingVerifications}
                icon={ShieldCheck}
              />
              <Stat
                label="Total bookings"
                value={formatNumber(stats?.totalBookings ?? 0)}
                trend={formatTrend(overview?.trends.bookings ?? null)}
                icon={Calendar}
              />
              <Stat
                label="Revenue"
                value={formatMoney(stats?.grossRevenue ?? 0)}
                trend={formatTrend(overview?.trends.revenue ?? null)}
                icon={DollarSign}
              />
              <Stat
                label="Open complaints"
                value={formatNumber(complaints.length)}
                trend={complaints.length > 0 ? "needs review" : "all clear"}
                warn={complaints.length > 0}
                icon={MessageSquareWarning}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">Worker verification queue</h2>
                  <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold uppercase text-yellow-800">
                    {formatNumber(stats?.pendingVerifications ?? 0)} pending
                  </span>
                </div>

                {queue.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    No workers awaiting verification.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase text-muted-foreground">
                        <tr><th className="py-2">Worker</th><th>CNIC</th><th>Applied</th><th></th></tr>
                      </thead>
                      <tbody>
                        {queue.map((w) => (
                          <tr key={w.workerId} className="border-t border-border">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Avatar src={w.avatar} name={w.fullName} />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold">{w.fullName}</p>
                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {w.category || w.workerId}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="text-xs text-muted-foreground">{w.cnic || "—"}</td>
                            <td className="text-xs text-muted-foreground">{formatDate(w.appliedAt)}</td>
                            <td className="space-x-1 whitespace-nowrap text-right">
                              <button
                                onClick={() => decideVerification(w, "approve")}
                                disabled={verifying === w.workerId}
                                className="rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
                              >
                                {verifying === w.workerId ? "…" : "Approve"}
                              </button>
                              <button
                                onClick={() => decideVerification(w, "reject")}
                                disabled={verifying === w.workerId}
                                className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold hover:border-destructive hover:text-destructive disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-base font-bold">Platform analytics</h2>
              <p className="mt-1 text-xs text-muted-foreground">Last 7 days.</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <MiniChart
                  label="Bookings"
                  value={formatNumber(
                    (overview?.series.bookings ?? []).reduce((sum, p) => sum + p.value, 0)
                  )}
                  points={overview?.series.bookings ?? []}
                />
                <MiniChart
                  label="Revenue"
                  value={formatMoney(
                    (overview?.series.revenue ?? []).reduce((sum, p) => sum + p.value, 0)
                  )}
                  points={overview?.series.revenue ?? []}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Avg rating</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-2xl font-black">{stats?.avgRating ?? 0}</p>
                    <span className="inline-flex items-center text-xs font-semibold text-primary">
                      <Star className="mr-0.5 h-3 w-3" /> {formatNumber(stats?.reviewsCount ?? 0)} reviews
                    </span>
                  </div>
                  <div className="mt-3 flex h-20 items-end gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-md ${
                            star <= Math.round(stats?.avgRating ?? 0) ? "bg-primary" : "bg-primary/20"
                          }`}
                          style={{ height: `${star * 18}%` }}
                        />
                        <span className="text-[9px] text-muted-foreground">{star}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />
    </DashboardLayout>
  );
}

function Avatar({ src, name }: { src: string; name: string }) {
  if (src) {
    return <img src={src} className="h-8 w-8 rounded-full object-cover" alt="" />;
  }

  // Workers apply before they ever publish a gig, so most of the queue
  // has no photo yet -- an initial beats a broken image icon.
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-dark">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
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

function MiniChart({ label, value, points }: { label: string; value: string; points: SeriesPoint[] }) {
  const peak = Math.max(...points.map((p) => p.value), 0);

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-black">{value}</p>
        <span className="inline-flex items-center text-xs font-semibold text-primary"><TrendingUp className="mr-0.5 h-3 w-3" /> 7 days</span>
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5">
        {points.length === 0 && (
          <p className="w-full self-center text-center text-[10px] text-muted-foreground">No activity</p>
        )}
        {points.map((point) => (
          <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-primary/30"
              title={`${point.date}: ${point.value}`}
              // Bars are scaled against the week's peak; a flat 4% keeps
              // an empty day visible instead of collapsing it to nothing.
              style={{ height: peak > 0 ? `${Math.max((point.value / peak) * 100, 4)}%` : "4%" }}
            />
            <span className="text-[9px] text-muted-foreground">{point.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
