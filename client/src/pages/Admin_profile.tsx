import { useMemo, useState, useEffect } from "react";
import { useGigStore } from "@/store/gigStore";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { Button } from "@/components/ui/button";

const slots = ["08:00 – 10:00", "10:00 – 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00"];

export default function BookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const workerId = params.get("workerId");

  const gigs = useGigStore((state) => state.gigs);
  const fetchGigs = useGigStore((state) => state.fetchGigs);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const worker =
    gigs.find((w) => w.id === workerId) ??
    gigs[0];

  if (!worker) {
    return (
      <DashboardLayout title="Admin" items={adminItems}>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [slot, setSlot] = useState(slots[1]);
  const [duration, setDuration] = useState(2);

  const amount = useMemo(() => Math.round(((worker.priceMin + worker.priceMax) / 2) / (worker.priceUnit === "month" ? 30 : 1) * duration), [worker, duration]);
  const fee = Math.round(amount * 0.05);
  const total = amount + fee;

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Book your service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose date, time and confirm details.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-4">
                <img src={worker.avatar} className="h-14 w-14 rounded-2xl object-cover" alt="" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{worker.fullName}</p>
                  <p className="text-xs text-muted-foreground">{worker.category} • {worker.city}</p>
                </div>
                <Link to={`/workers/${worker.id}`} className="text-xs font-semibold text-primary hover:underline">View profile</Link>
              </div>
            </Card>

            <Card title="Select date" icon={Calendar}>
              <input type="date" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Card>

            <Card title="Time slot" icon={Clock}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map(s => (
                  <button key={s} onClick={() => setSlot(s)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${slot === s ? "border-primary bg-primary-soft text-primary-dark" : "border-input bg-background hover:border-primary/40"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Duration">
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={8} value={duration} onChange={(e) => setDuration(+e.target.value)} className="flex-1 accent-primary" />
                <span className="w-20 text-right text-sm font-bold">{duration} hours</span>
              </div>
            </Card>

            <Card title="Service address">
              <textarea rows={3} placeholder="House #, Street, Area, City"
                className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-base font-bold">Booking summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Worker" value={worker.fullName} />
                <Row label="Service" value={worker.category} />
                <Row label="Date" value={date} />
                <Row label="Time" value={slot} />
                <Row label="Duration" value={`${duration}h`} />
              </div>
              <div className="my-4 h-px bg-border" />
              <div className="space-y-2 text-sm">
                <Row label="Amount" value={`Rs. ${amount.toLocaleString()}`} />
                <Row label="Platform fee (5%)" value={`Rs. ${fee.toLocaleString()}`} />
                <div className="flex items-center justify-between pt-2 text-base font-black">
                  <span>Total</span><span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <Button onClick={() => navigate(`/payment?bookingId=b-new&amount=${total}`)}
                className="mt-5 h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark">
                Proceed to payment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Free cancellation up to 4 hours before</p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Card({ title, icon: Icon, children }: { title?: string; icon?: typeof Calendar; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      {title && (
        <div className="mb-4 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
