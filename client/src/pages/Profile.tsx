import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Profile</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-primary-soft">
              <div className="grid h-full w-full place-items-center text-3xl font-black text-primary-dark">{user?.fullName?.charAt(0) ?? "U"}</div>
              <button className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"><Camera className="h-4 w-4" /></button>
            </div>
            <p className="mt-4 text-lg font-bold">{user?.fullName ?? "Guest user"}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role ?? "customer"}</p>
          </div>

          <div className="space-y-6">
            <Card title="Personal information">
              <Grid>
                <F label="Full name" defaultValue={user?.fullName ?? ""} />
                <F label="Email" defaultValue={user?.email ?? ""} />
                <F label="Phone" defaultValue={user?.phone ?? ""} />
                <F label="Address" defaultValue={user?.address ?? ""} />
              </Grid>
            </Card>
            <Card title="Change password">
              <Grid>
                <F label="Current password" type="password" />
                <F label="New password" type="password" />
              </Grid>
            </Card>
            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-primary hover:bg-primary-dark">Save changes</Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">{title}</h3>{children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
function F({ label, type = "text", defaultValue = "" }: { label: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <input type={type} defaultValue={defaultValue}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </div>
  );
}
