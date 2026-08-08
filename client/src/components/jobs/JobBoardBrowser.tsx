import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { JobPostCard } from "@/components/jobs/JobPostCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { HgAlert } from "@/components/ui/HgAlert";
import { useJobStore } from "@/store/jobStore";
import { useAuthStore } from "@/store/authStore";
import { categories } from "@/data/mock";
import type { JobPost, WorkerCategory } from "@/types";

/**
 * Open job requests, browsable by anyone -- same trust level as the gig
 * listings on /services. Only the "Apply" action is gated behind a worker
 * login. Shared by the standalone /job-board page and the "Jobs" tab on
 * /services so there's one implementation of "browse + apply", not two.
 */
export function JobBoardBrowser() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const openJobs = useJobStore((s) => s.openJobs);
  const fetchOpenJobs = useJobStore((s) => s.fetchOpenJobs);
  const myApplications = useJobStore((s) => s.myApplications);
  const fetchMyApplications = useJobStore((s) => s.fetchMyApplications);

  const isWorker = !!user && !!token && user.role === "worker";

  const [categoryFilter, setCategoryFilter] = useState<WorkerCategory | "all">(
    (user?.category as WorkerCategory) || "all"
  );
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState<JobPost | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);
  const [wrongAccountAlert, setWrongAccountAlert] = useState(false);

  const load = () => {
    setLoading(true);
    fetchOpenJobs(categoryFilter === "all" ? undefined : categoryFilter).finally(() => setLoading(false));
    // Only a logged-in worker has applications to cross-check against --
    // the open-jobs listing itself is public and carries no per-viewer state.
    if (isWorker) fetchMyApplications();
  };

  useEffect(load, [categoryFilter, isWorker]);

  const appliedJobIds = new Set(myApplications.map((a) => a.jobId));

  const handleApplyClick = (job: JobPost) => {
    if (!user || !token) {
      navigate(`/login/worker?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (user.role !== "worker") {
      setWrongAccountAlert(true);
      return;
    }
    setApplyTarget(job);
    setApplyOpen(true);
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {isWorker ? "Apply with your offer." : "Log in as a worker to apply."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground sm:col-span-2 xl:col-span-3">
            Loading open jobs...
          </div>
        )}
        {!loading && openJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center sm:col-span-2 xl:col-span-3">
            <p className="text-base font-bold">No open jobs right now</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back later or try a different category.</p>
          </div>
        )}
        {openJobs.map((job) => {
          const alreadyApplied = isWorker && appliedJobIds.has(job.jobId);
          return (
            <JobPostCard
              key={job.jobId}
              job={job}
              footer={
                <Button
                  size="sm"
                  disabled={alreadyApplied}
                  className="rounded-xl bg-primary hover:bg-primary-dark"
                  onClick={() => handleApplyClick(job)}
                >
                  {alreadyApplied ? "Already applied" : "Apply"}
                </Button>
              }
            />
          );
        })}
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

      <HgAlert
        open={wrongAccountAlert}
        onClose={() => setWrongAccountAlert(false)}
        type="warning"
        title="Wrong account type"
        description="Please log in from a worker account to apply to this job."
        cancelLabel="Got it"
      />
    </div>
  );
}
