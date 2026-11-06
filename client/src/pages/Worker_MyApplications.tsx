import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicantCard";
import { useJobStore } from "@/store/jobStore";
import { jobService } from "@/services/jobService";

export default function Worker_MyApplications() {
  const myApplications = useJobStore((s) => s.myApplications);
  const fetchMyApplications = useJobStore((s) => s.fetchMyApplications);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "warning" | "success" | "server";
    title: string;
    description: string;
  }>({ open: false, type: "error", title: "", description: "" });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const load = () => {
    setLoading(true);
    fetchMyApplications().finally(() => setLoading(false));
  };

  useEffect(load, []);

  const withdraw = async (jobId: string, applicationId: string) => {
    setBusyId(applicationId);
    try {
      await jobService.withdrawApplication(jobId, applicationId);
      load();
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not withdraw",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout title="Worker" items={workerItems}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">My applications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track the jobs you've applied to.</p>

        <div className="mt-6 grid gap-4">
          {loading && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              Loading your applications...
            </div>
          )}
          {!loading && myApplications.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-bold">No applications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Browse the job board and apply to open requests.</p>
            </div>
          )}
          {myApplications.map((app) => (
            <div key={app.applicationId} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {app.jobCategory}
                  </p>
                  <h3 className="mt-1 truncate text-base font-bold">{app.jobTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{app.message}</p>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-base font-black">Rs. {app.proposedPrice.toLocaleString()} proposed</p>
                {app.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-destructive"
                    disabled={busyId === app.applicationId}
                    onClick={() => withdraw(app.jobId, app.applicationId)}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
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
