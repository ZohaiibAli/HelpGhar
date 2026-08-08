import type { ReactNode } from "react";
import { MapPin, Calendar, Clock } from "lucide-react";
import type { JobPost, JobStatus } from "@/types";

const STATUS_STYLES: Record<JobStatus, string> = {
  open: "bg-primary-soft text-primary-dark",
  assigned: "bg-blue-100 text-blue-800",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-red-100 text-red-700",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function JobPostCard({
  job,
  footer,
}: {
  job: JobPost;
  /** Actions specific to the page this card is rendered on (Apply, View applicants, Cancel...). */
  footer?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {job.jobId} • {job.category}
          </p>
          <h3 className="mt-1 truncate text-base font-bold">{job.title}</h3>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {job.address}
        </span>
        {job.preferredDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {job.preferredDate}
          </span>
        )}
        {job.preferredTime && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {job.preferredTime}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-base font-black">
          Rs. {job.budgetMin.toLocaleString()} – {job.budgetMax.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {job.budgetUnit === "fixed" ? " fixed" : ` /${job.budgetUnit}`}
          </span>
        </p>
        {job.applicationsCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {job.applicationsCount} applicant{job.applicationsCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {footer && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{footer}</div>}
    </article>
  );
}
