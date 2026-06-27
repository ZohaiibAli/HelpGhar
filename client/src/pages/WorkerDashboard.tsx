import { Link } from "react-router-dom";
import { LayoutDashboard, Briefcase, Star, Award, Bell, User, Settings, Timer, TrendingUp, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { bookings, notifications, categories } from "@/data/mock";
import { useState } from "react";
import { useGigStore } from "@/store/gigStore";
import { WorkerCategory } from "@/types";

const items = [
  { label: "Overview", to: "/dashboard/worker", icon: LayoutDashboard },
  { label: "Jobs", to: "/my-bookings", icon: Briefcase },
  { label: "Reviews", to: "/reviews", icon: Star },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function WorkerDashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const addGig = useGigStore((s) => s.addGig);
  const [form, setForm] = useState({
    fullName: "Ayesha",
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.category) e.category = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.priceMin) e.priceMin = "Required";
    if (!form.priceMax) e.priceMax = "Required";
    if (Number(form.priceMin) >= Number(form.priceMax)) e.priceMax = "Must be greater than min";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addGig({
      id: crypto.randomUUID(),
      fullName: form.fullName,
      avatar: form.avatar || "",
      category: form.category,
      city: form.city,
      gender: form.gender,
      age: Number(form.age) || 0,
      experienceYears: Number(form.experience) || 0,
      memberSince: form.since || String(new Date().getFullYear()),
      priceMin: Number(form.priceMin),
      priceMax: Number(form.priceMax),
      priceUnit: form.priceUnit,
      rating: 0,
      reviewsCount: 0,
      available: true,
      cnicVerified: false,
      badges: [],
      bio: "",
      skills: [],
      certificates: [],
    });
    setModalOpen(false);
    setForm({
      fullName: "Ayesha",
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
    });
    setErrors({});
  }

  function handleClose() {
    setModalOpen(false);
    setErrors({});
  }

  return (
    <DashboardLayout title="Worker" items={items}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black md:text-3xl">Good morning, Ayesha</h1>
            <p className="mt-1 text-sm text-muted-foreground">You have 2 active jobs today.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-dark">Available now</span>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              + Create Gig
            </button>
          </div>
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

              {/* Avatar */}
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
                        const reader = new FileReader();
                        reader.onload = () => setForm(f => ({ ...f, avatar: reader.result as string }));
                        reader.readAsDataURL(file);
                      }}
                    />
                    {form.avatar ? "Click to change photo" : "Click to upload photo"}
                  </label>
                </div>
              </Field>

              {/* Category */}
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

              {/* City */}
              <Field label="City" error={errors.city}>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Karachi"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>

              {/* Gender & Age */}
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

              {/* Experience & Since */}
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

              {/* Price */}
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
                className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                Publish Gig
              </button>
            </div>
          </div>
        </div>
      )}
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