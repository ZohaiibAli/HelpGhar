import { AlertTriangle, Scale, ShieldCheck } from "lucide-react";
import type { Complaint } from "@/types";

const resolutionText: Record<string, string> = {
  released: "Payment released to you",
  refunded: "Payment refunded to the customer",
  completed_with_pin: "Closed — the job was completed with the PIN",
};

export function resolutionOf(c: Complaint): string | null {
  const r = c.resolution;
  if (!r) return null;
  return typeof r === "string" ? r : r.decision;
}

export function ComplaintCard({ c, against }: { c: Complaint; against?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-100 text-yellow-700">
            {c.type === "payment" ? <Scale className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">#{c.id}</p>
            <p className="text-base font-bold">{c.subject}</p>
            <p className="text-xs text-muted-foreground">
              Against {against}
              {c.bookingId ? ` • Booking ${c.bookingId}` : ""}
              {c.type === "payment" && c.amount ? ` • Rs. ${c.amount.toLocaleString()}` : ""} • {new Date(c.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
      {c.type === "payment" && resolutionOf(c) && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-dark">
          <Scale className="h-3.5 w-3.5" /> {resolutionText[resolutionOf(c)!] ?? "Decided"}
        </p>
      )}
      {c.actionTaken === true && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-dark">
          <ShieldCheck className="h-3.5 w-3.5" /> HelpGhar has taken action on this complaint
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Complaint["status"] }) {
  const map: Record<Complaint["status"], string> = {
    open: "bg-yellow-100 text-yellow-800",
    in_review: "bg-blue-100 text-blue-800",
    resolved: "bg-primary-soft text-primary-dark",
    closed: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${map[status] ?? map.open}`}>
      {status.replace("_", " ")}
    </span>
  );
}
