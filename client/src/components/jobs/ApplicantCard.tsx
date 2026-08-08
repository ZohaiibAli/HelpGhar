import { Star, ShieldCheck, User } from "lucide-react";
import type { ApplicationStatus, JobApplication } from "@/types";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-primary text-primary-foreground",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-muted text-muted-foreground",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function ApplicantCard({
  application,
  onAccept,
  onReject,
  busy,
}: {
  application: JobApplication;
  onAccept?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {application.workerAvatar ? (
            <img src={application.workerAvatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <User className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-bold">{application.workerName}</p>
            {application.reviewsCount ? (
              <span className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{application.rating?.toFixed(1)}</span>
                <span className="text-muted-foreground">({application.reviewsCount})</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews yet</span>
            )}
            {application.cnicVerified && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary-dark">
                <ShieldCheck className="h-3 w-3" /> CNIC verified
              </span>
            )}
          </div>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{application.message}</p>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-base font-black">
          Rs. {application.proposedPrice.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground"> proposed</span>
        </p>
      </div>

      {application.status === "pending" && (onAccept || onReject) && (
        <div className="mt-4 flex gap-2 border-t border-border pt-4">
          {onAccept && (
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary-dark" disabled={busy} onClick={onAccept}>
              Accept
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="outline" className="rounded-xl text-destructive" disabled={busy} onClick={onReject}>
              Reject
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
