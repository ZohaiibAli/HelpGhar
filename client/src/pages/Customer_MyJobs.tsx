import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";
import { JobPostCard } from "@/components/jobs/JobPostCard";
import { useJobStore } from "@/store/jobStore";
import { jobService } from "@/services/jobService";

export default function Customer_MyJobs() {
  const myJobs = useJobStore((s) => s.myJobs);
  const fetchMyJobs = useJobStore((s) => s.fetchMyJobs);
  const [loading, setLoading] = useState(true);

  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "warning" | "success" | "server";
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({ open: false, type: "error", title: "", description: "" });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  useEffect(() => {
    fetchMyJobs().finally(() => setLoading(false));
  }, [fetchMyJobs]);

  const confirmCancel = (jobId: string) => {
    setAlertState({
      open: true,
      type: "warning",
      title: "Cancel this job post?",
      description: "Workers will no longer be able to apply once this is cancelled.",
      actionLabel: "Yes, cancel it",
      onAction: () => doCancel(jobId),
    });
  };

  const doCancel = async (jobId: string) => {
    try {
      await jobService.cancelJob(jobId);
      await fetchMyJobs();
      setAlertState({ open: true, type: "success", title: "Job post cancelled", description: "" });
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not cancel",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <DashboardLayout title="Customer" items={customerItems}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">My job posts</h1>
            <p className="mt-2 text-sm text-muted-foreground">Track applicants and manage what you've posted.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary-dark">
            <Link to="/post-job">+ Post a job</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {loading && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              Loading your job posts...
            </div>
          )}
          {!loading && myJobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-bold">No job posts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Post a job and workers will apply with their offers.</p>
            </div>
          )}
          {myJobs.map((job) => (
            <JobPostCard
              key={job.jobId}
              job={job}
              footer={
                <>
                  <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary-dark">
                    <Link to={`/my-jobs/${job.jobId}`}>View applicants</Link>
                  </Button>
                  {job.status === "open" && (
                    <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => confirmCancel(job.jobId)}>
                      Cancel
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      </div>

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
        actionLabel={alertState.actionLabel}
        onAction={alertState.onAction}
        cancelLabel={alertState.actionLabel ? "No, keep it" : "Got it"}
      />
    </DashboardLayout>
  );
}
