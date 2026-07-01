import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platformName: "HelpGhar",
    supportEmail: "support@helpghar.com",
    commissionRate: "8",
    autoApproveWorkers: false,
    maintenanceMode: false,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure platform-wide preferences.</p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-primary-dark" />
            <p className="text-sm font-semibold text-primary-dark">Settings saved successfully.</p>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">General</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Platform name
              <input
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Support email
              <input
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Commission rate (%)
              <input
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">Platform controls</h2>
          <div className="mt-4 space-y-4">
            <ToggleRow
              label="Auto-approve new workers"
              description="Skip manual CNIC review for new worker sign-ups."
              checked={form.autoApproveWorkers}
              onChange={(v) => setForm({ ...form, autoApproveWorkers: v })}
            />
            <ToggleRow
              label="Maintenance mode"
              description="Temporarily disable new bookings platform-wide."
              checked={form.maintenanceMode}
              onChange={(v) => setForm({ ...form, maintenanceMode: v })}
            />
          </div>
        </div>

        <Button className="rounded-xl bg-primary hover:bg-primary-dark" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}