import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import { Button } from "@/components/ui/button";
import { JobPostCard } from "@/components/jobs/JobPostCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { HgAlert } from "@/components/ui/HgAlert";
import { useJobStore } from "@/store/jobStore";
import { useAuthStore } from "@/store/authStore";
import { categories } from "@/data/mock";
import type { JobPost, WorkerCategory } from "@/types";

export default function Worker_JobBoard() {
  const user = useAuthStore((s) => s.user);
  const openJobs = useJobStore((s) => s.openJobs);
  const fetchOpenJobs = useJobStore((s) => s.fetchOpenJobs);

  const [categoryFilter, setCategoryFilter] = useState<WorkerCategory | "all">(
    (user?.category as WorkerCategory) || "all"
  );
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState<JobPost | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);

  const load = () => {
    setLoading(true);
    fetchOpenJobs(categoryFilter === "all" ? undefined : categoryFilter).finally(() => setLoading(false));
  };

  useEffect(load, [categoryFilter]);

  return (
    <DashboardLayout title="Worker" items={workerItems}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Job board</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse job requests and apply with your offer.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategoryFilter(c.name)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${categoryFilter === c.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {loading && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground sm:col-span-2">
              Loading open jobs...
            </div>
          )}
          {!loading && openJobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center sm:col-span-2">
              <p className="text-base font-bold">No open jobs right now</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back later or try a different category.</p>
            </div>
          )}
          {openJobs.map((job) => (
            <JobPostCard
              key={job.jobId}
              job={job}
              footer={
                <Button
                  size="sm"
                  disabled={job.alreadyApplied}
                  className="rounded-xl bg-primary hover:bg-primary-dark"
                  onClick={() => {
                    setApplyTarget(job);
                    setApplyOpen(true);
                  }}
                >
                  {job.alreadyApplied ? "Already applied" : "Apply"}
                </Button>
              }
            />
          ))}
        </div>
      </div>

      <JobApplyModal
        job={applyTarget}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onApplied={() => {
          setSuccessAlert(true);
          load();
        }}
      />

      <HgAlert
        open={successAlert}
        onClose={() => setSuccessAlert(false)}
        type="success"
        title="Application submitted"
        description="The customer will review your proposal and get back to you."
      />
    </DashboardLayout>
  );
}
