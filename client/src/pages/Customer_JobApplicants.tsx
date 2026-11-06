import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { HgAlert } from "@/components/ui/HgAlert";
import { JobPostCard } from "@/components/jobs/JobPostCard";
import { ApplicantCard } from "@/components/jobs/ApplicantCard";
import { jobService } from "@/services/jobService";
import type { JobApplication, JobPost } from "@/types";

export default function Customer_JobApplicants() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobPost | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "warning" | "success" | "server";
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({ open: false, type: "error", title: "", description: "" });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const load = () => {
    if (!jobId) return;
    setLoading(true);
    jobService
      .getJobApplications(jobId)
      .then((res) => {
        setJob(res.job);
        setApplications(res.applications);
      })
      .catch((err) =>
        setAlertState({
          open: true,
          type: "error",
          title: "Could not load applicants",
          description: err.message ?? "Something went wrong.",
        })
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [jobId]);

  const confirmAccept = (applicationId: string) => {
    setAlertState({
      open: true,
      type: "warning",
      title: "Accept this applicant?",
      description: "Every other applicant will be rejected and you'll be taken to payment to confirm the booking.",
      actionLabel: "Yes, accept",
      onAction: () => doAccept(applicationId),
    });
  };

  const doAccept = async (applicationId: string) => {
    if (!jobId) return;
    setBusyId(applicationId);
    try {
      const res = await jobService.acceptApplication(jobId, applicationId);
      navigate(`/payment?bookingId=${res.bookingId}`);
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not accept",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async (applicationId: string) => {
    if (!jobId) return;
    setBusyId(applicationId);
    try {
      await jobService.rejectApplication(jobId, applicationId);
      load();
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not reject",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout title="Customer" items={customerItems}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            Loading...
          </div>
        )}

        {!loading && job && (
          <>
            <h1 className="text-3xl font-black md:text-4xl">Applicants</h1>
            <p className="mt-2 text-sm text-muted-foreground">Review proposals and pick who to hire.</p>

            <div className="mt-6">
              <JobPostCard job={job} />
            </div>

            <div className="mt-6 grid gap-4">
              {applications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                  <p className="text-base font-bold">No applicants yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Workers who apply to this job will show up here.</p>
                </div>
              )}
              {applications.map((app) => (
                <ApplicantCard
                  key={app.applicationId}
                  application={app}
                  busy={busyId === app.applicationId}
                  onAccept={job.status === "open" ? () => confirmAccept(app.applicationId) : undefined}
                  onReject={job.status === "open" ? () => doReject(app.applicationId) : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
        actionLabel={alertState.actionLabel}
        onAction={alertState.onAction}
        cancelLabel={alertState.actionLabel ? "Not yet" : "Got it"}
      />
    </DashboardLayout>
  );
}
