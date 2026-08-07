import { Link } from "react-router-dom";
import { Briefcase, Star, Award, User, Timer, TrendingUp, X, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { categories } from "@/data/mock";
import { useEffect, useState } from "react";
import { WorkerCategory } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { HgAlert } from "@/components/ui/HgAlert";

import {
  uploadAvatar,
  createGig,
  getWorkerDashboard,
  startBooking,
  completeBooking,
} from "@/services/workerService";

import { workerItems } from "@/data/workerMenu";

type ActiveJob = {
  bookingId: string;
  category: string;
  address: string;
  date: string;
  timeSlot: string;
  durationHours: number;
  customerName: string;
  status: string;
};

type DashboardStats = {
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  avgRating: number;
  reviewsCount: number;
  totalEarnings: number;
  activeGigs: number;
  available: boolean;
  pendingJobs: number;
};

type AlertState = {
  open: boolean;
  type: "error" | "warning" | "success" | "server";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function WorkerDashboard() {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Per-booking action loading + shared alert dialog
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    open: false, type: "error", title: "", description: "",
  });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    category: "" as WorkerCategory,
    city: "",
    gender: "Female" as "Male" | "Female",
    age: "",
    experience: "",
    since: "",
    priceMin: "",
    priceMax: "",
    priceUnit: "month" as "month" | "hour" | "day",
    avatar: "",
    avatarFile: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadDashboard() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getWorkerDashboard();
      setStats(data.stats);
      setActiveJobs(data.activeJobs);
    } catch (err: any) {
      setLoadError(err?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const confirmStart = (bookingId: string) => {
    setAlertState({
      open: true,
      type: "warning",
      title: "Start this job?",
      description: "This will mark the booking as in progress and notify the admin.",
      actionLabel: "Yes, start it",
      onAction: () => doStart(bookingId),
    });
  };

  const doStart = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await startBooking(bookingId);
      await loadDashboard();
      setAlertState({
        open: true,
        type: "success",
        title: "Job started",
        description: "This booking is now in progress.",
      });
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not start job",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmComplete = (bookingId: string) => {
    setAlertState({
      open: true,
      type: "warning",
      title: "Mark this job as completed?",
      description: "Only do this once the service has actually been delivered.",
      actionLabel: "Yes, mark completed",
      onAction: () => doComplete(bookingId),
    });
  };

  const doComplete = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await completeBooking(bookingId);
      await loadDashboard();
      setAlertState({
        open: true,
        type: "success",
        title: "Job completed",
        description: "This booking has been marked as completed.",
      });
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not mark as completed",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  function validate() {
    const e: Record<string, string> = {};
    if (!form.category) e.category = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.priceMin) e.priceMin = "Required";
    if (!form.priceMax) e.priceMax = "Required";
    if (Number(form.priceMin) >= Number(form.priceMax)) e.priceMax = "Must be greater than min";
    return e;
  }

  const handleSubmit = async () => {
    const e = validate();

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setIsSubmitting(true);
    try {
      let avatarUrl = "";

      if (form.avatarFile) {
        avatarUrl = await uploadAvatar(form.avatarFile);
      }

      await createGig({
        fullName: form.fullName,
        avatar: avatarUrl,
        category: form.category,
        city: form.city,
        gender: form.gender,
        age: Number(form.age),
        experienceYears: Number(form.experience),
        memberSince: form.since || String(new Date().getFullYear()),
        priceMin: Number(form.priceMin),
        priceMax: Number(form.priceMax),
        priceUnit: form.priceUnit,
        available: true,
        // rating, reviewsCount, cnicVerified and badges are not sent: the
        // server owns them (reviews set the rating, an admin sets the CNIC
        // badge) and no longer accepts them on a gig submission.
        bio: "",
        skills: [],
        certificates: [],
      });

      setToast("success");
      setTimeout(() => setToast(null), 3000);

      setModalOpen(false);

      setForm({
        fullName: user?.fullName || "",
        category: "" as WorkerCategory,
        city: "",
        gender: "Female",
        age: "",
        experience: "",
        since: "",
        priceMin: "",
        priceMax: "",
        priceUnit: "month",
        avatar: "",
        avatarFile: null,
      });

      setErrors({});
      setIsSubmitting(false);

      loadDashboard();
    } catch (err) {
      console.error(err);
      setToast("error");
      setTimeout(() => setToast(null), 3000);
      setIsSubmitting(false);
    }
  };

  function handleClose() {
    setModalOpen(false);
    setErrors({});
  }

  return (
    <DashboardLayout title="Worker" items={workerItems}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Hello, {user?.fullName ?? "Worker"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You have {activeJobs.length} active job{activeJobs.length === 1 ? "" : "s"} right now.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Availability comes from the worker's live gigs -- this badge
                used to read "Available now" even with no active gig at all. */}
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                stats?.available
                  ? "bg-primary-soft text-primary-dark"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stats?.available
                ? "Available now"
                : stats?.activeGigs
                  ? "Not accepting jobs"
                  : "No active gig"}
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              + Create Gig
            </button>
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {loadError}{" "}
            <button onClick={loadDashboard} className="font-bold underline">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total jobs" value={String(stats?.totalJobs ?? 0)} hint={`${stats?.completedJobs ?? 0} completed`} icon={Briefcase} />
              <Stat label="Completed" value={String(stats?.completedJobs ?? 0)} hint={`${stats?.completionRate ?? 0}% rate`} icon={TrendingUp} />
              <Stat label="Avg rating" value={String(stats?.avgRating ?? 0)} hint={`From ${stats?.reviewsCount ?? 0} reviews`} icon={Star} />
              <Stat label="Total earnings" value={`Rs. ${(stats?.totalEarnings ?? 0).toLocaleString()}`} hint="From completed jobs" icon={Award} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-bold">Active jobs</h2>

                <div className="mt-4 space-y-3">
                  {activeJobs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active jobs right now.</p>
                  )}
                  {activeJobs.map(b => (
                    <div key={b.bookingId} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">{b.category} — {b.address}</p>
                          <p className="text-xs text-muted-foreground">{b.date} • {b.timeSlot} • {b.customerName}</p>
                        </div>
                        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase text-primary-dark">{b.status}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => confirmStart(b.bookingId)}
                            disabled={actionLoading === b.bookingId}
                            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
                          >
                            {actionLoading === b.bookingId ? "Starting..." : "Start"}
                          </button>
                        )}
                        {b.status === "in_progress" && (
                          <button
                            onClick={() => confirmComplete(b.bookingId)}
                            disabled={actionLoading === b.bookingId}
                            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
                          >
                            {actionLoading === b.bookingId ? "Completing..." : "Complete"}
                          </button>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><Timer className="h-3 w-3" /> {b.durationHours}h job</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <h2 className="text-base font-bold">Performance</h2>
                  <PerfBar label="Completion rate" value={stats?.completionRate ?? 0} />
                </div>
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <h2 className="text-base font-bold">Profile</h2>
                  <p className="mt-2 text-xs text-muted-foreground">Manage your profile, gigs, and availability.</p>
                  <Link to="/profile" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">Manage profile →</Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Gig Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Create a Gig</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Your gig will appear on the Services page.</p>
              </div>
              <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">

              <Field label="Profile Photo">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {form.avatar
                      ? <img src={form.avatar} alt="preview" className="h-full w-full object-cover" />
                      : <User className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-input bg-background px-3 py-3 text-center text-xs text-muted-foreground hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setForm((f) => ({
                          ...f,
                          avatarFile: file,
                          avatar: URL.createObjectURL(file),
                        }));
                      }}
                    />
                    {form.avatar ? "Click to change photo" : "Click to upload photo"}
                  </label>
                </div>
              </Field>

              <Field label="Category" error={errors.category}>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as WorkerCategory }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="City" error={errors.city}>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Karachi"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value as "Male" | "Female" }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </Field>
                <Field label="Age">
                  <input
                    type="number"
                    min={18}
                    max={70}
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="e.g. 28"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Years of experience">
                  <input
                    type="number"
                    min={0}
                    value={form.experience}
                    onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Working since (year)">
                  <input
                    type="number"
                    min={2000}
                    max={new Date().getFullYear()}
                    value={form.since}
                    onChange={e => setForm(f => ({ ...f, since: e.target.value }))}
                    placeholder="e.g. 2020"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Price Range (Rs.)</p>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
                  <Field label="Min" error={errors.priceMin}>
                    <input
                      type="number"
                      min={0}
                      value={form.priceMin}
                      onChange={e => setForm(f => ({ ...f, priceMin: e.target.value }))}
                      placeholder="e.g. 15000"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </Field>
                  <Field label="Max" error={errors.priceMax}>
                    <input
                      type="number"
                      min={0}
                      value={form.priceMax}
                      onChange={e => setForm(f => ({ ...f, priceMax: e.target.value }))}
                      placeholder="e.g. 25000"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </Field>
                  <Field label="Per">
                    <select
                      value={form.priceUnit}
                      onChange={e => setForm(f => ({ ...f, priceUnit: e.target.value as "month" | "hour" | "day" }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="month">month</option>
                      <option value="hour">hour</option>
                      <option value="day">day</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`rounded-xl px-5 py-2 text-sm font-bold text-primary-foreground transition-colors ${isSubmitting
                  ? "bg-primary/70 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
                  }`}
              >
                {isSubmitting ? "Processing..." : "Publish Gig"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`flex flex-col items-center gap-4 rounded-3xl p-10 shadow-xl text-center w-80 ${toast === "success" ? "bg-card" : "bg-card"
            }`}>
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${toast === "success" ? "bg-primary" : "bg-red-500"
              }`}>
              {toast === "success" ? (
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xl font-black">
                {toast === "success" ? "Gig Published!" : "Something went wrong"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {toast === "success"
                  ? "Your gig is now live on the Services page."
                  : "Failed to create gig. Please try again."}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className={`mt-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors ${toast === "success" ? "bg-primary hover:bg-primary-dark" : "bg-red-500 hover:bg-red-600"
                }`}
            >
              {toast === "success" ? "Great!" : "Try Again"}
            </button>
          </div>
        </div>
      )}

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
        actionLabel={alertState.actionLabel}
        onAction={alertState.onAction}
        cancelLabel={alertState.actionLabel ? "No, go back" : "Got it"}
      />

    </DashboardLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      {children}
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </div>
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