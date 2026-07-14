import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CustomerSettingsPage() {
  const navigate = useNavigate();
  return (
    <DashboardLayout
      title="Customer"
      items={customerItems}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage notifications, language and security.</p>

        <div className="mt-8 space-y-6">
          <Card title="Notifications">
            <Toggle label="Email notifications" defaultChecked />
            <Toggle label="SMS booking updates" defaultChecked />
            <Toggle label="Promotional offers" />
            <Toggle label="Push notifications" defaultChecked />
          </Card>
          <Card title="Preferences">
            <Row label="Language">
              <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option>English</option><option>اردو</option></select>
            </Row>
            <Row label="Default city">
              <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option>Lahore</option><option>Karachi</option><option>Islamabad</option></select>
            </Row>
          </Card>
          <Card title="Security">
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => navigate("/profile")}
              >
                Change password
              </Button>
              <Button variant="outline" className="w-fit">Enable two-factor authentication</Button>
              <Button variant="outline" className="w-fit text-destructive">Delete my account</Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
function Toggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <Row label={label}>
      <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-card shadow transition peer-checked:translate-x-5" />
      </label>
    </Row>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between py-3 text-sm"><span>{label}</span>{children}</div>;
}