import { useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, ShieldCheck, Timer, Trash2, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { Button } from "@/components/ui/button";
import { authHeaders, handleAuthFailure } from "@/lib/session";
import type { AccountStatus, Complaint } from "@/types";
import { ModerationDialog, formatUntil, type ModerationTarget } from "@/components/admin/ModerationDialog";
import { PaymentDisputeSection } from "@/components/admin/PaymentDisputeSection";

const statusStyles: Record<Complaint["status"], string> = {
  open: "bg-red-100 text-red-700",
  in_review: "bg-yellow-100 text-yellow-800",
  resolved: "bg-primary-soft text-primary-dark",
  closed: "bg-secondary text-foreground",
};

const accountStyles: Record<AccountStatus, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-orange-100 text-orange-700",
  blocked: "bg-red-100 text-red-700",
};

type ModerationRequest = {
  target: ModerationTarget;
  disputeId: string;
  action: "warn" | "suspend" | "block" | "restore";
};

function ComplaintSection({
  title,
  complaints,
  onResolve,
  onDelete,
  onModerate,
}: {
  title: string;
  complaints: Complaint[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onModerate: (req: ModerationRequest) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
          {complaints.length} total
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {complaints.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No complaints here.</p>
        )}
        {complaints.map((c) => {
          const against = c.against;
          const target: ModerationTarget | null =
            against && against.status
              ? {
                  role: against.role,
                  code: against.id,
                  name: against.name ?? against.id,
                  status: against.status,
                  suspendedUntil: against.suspendedUntil,
                  reason: against.reason,
                }
              : null;
          const action = typeof c.actionTaken === "object" ? c.actionTaken : null;

          return (
            <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold">#{c.id} • {c.subject}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.customerName} ({c.customerId}) vs {c.workerName} ({c.workerId})
                  </p>
                  {c.bookingId && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Booking {c.bookingId}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyles[c.status]}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>

              {target && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Against</span>
                  <span className="font-semibold">{target.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${accountStyles[target.status]}`}>
                    {target.status}
                    {target.status === "suspended" && target.suspendedUntil ? ` until ${formatUntil(target.suspendedUntil)}` : ""}
                  </span>
                  {action && (
                    <span className="text-[11px] text-muted-foreground">
                      • action taken: {action.action}{action.days ? ` ${action.days}d` : ""}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-lg bg-primary hover:bg-primary-dark"
                  disabled={c.status === "resolved"}
                  onClick={() => onResolve(c.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {c.status === "resolved" ? "Resolved" : "Resolve"}
                </Button>

                {target && target.status === "active" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-amber-700 hover:border-amber-500"
                      onClick={() => onModerate({ target, disputeId: c.id, action: "warn" })}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Warn {target.role}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-orange-700 hover:border-orange-600"
                      onClick={() => onModerate({ target, disputeId: c.id, action: "suspend" })}
                    >
                      <Timer className="h-3.5 w-3.5" /> Suspend {target.role}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-red-700 hover:border-red-600"
                      onClick={() => onModerate({ target, disputeId: c.id, action: "block" })}
                    >
                      <Ban className="h-3.5 w-3.5" /> Block {target.role}
                    </Button>
                  </>
                )}

                {target && target.status !== "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-emerald-700 hover:border-emerald-600"
                    onClick={() => onModerate({ target, disputeId: c.id, action: "restore" })}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Undo ({target.status})
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg hover:border-destructive hover:text-destructive"
                  onClick={() => onDelete(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminComplaints() {
  const [customerComplaints, setCustomerComplaints] = useState<Complaint[]>([]);
  const [workerComplaints, setWorkerComplaints] = useState<Complaint[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [moderation, setModeration] = useState<ModerationRequest | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchCustomerDisputes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/disputes/customer`, {
        headers: authHeaders(),
      });
      if (handleAuthFailure(response)) return;
      const result = await response.json();
      if (result.success) {
        setCustomerComplaints(result.complaints);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchWorkerDisputes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/disputes/worker`, {
        headers: authHeaders(),
      });
      if (handleAuthFailure(response)) return;
      const result = await response.json();
      if (result.success) {
        setWorkerComplaints(result.complaints);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const refresh = () => {
    fetchCustomerDisputes();
    fetchWorkerDisputes();
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(t);
  }, [successMessage]);

  async function resolve(id: string, source: "customer" | "worker") {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dispute/${id}/resolve`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (handleAuthFailure(response)) return;
      const result = await response.json();
      if (result.success) {
        const updater = (list: Complaint[]) =>
          list.map((c) => (c.id === id ? { ...c, status: "resolved" as const } : c));
        if (source === "customer") setCustomerComplaints(updater);
        else setWorkerComplaints(updater);
        setSuccessMessage(`Complaint #${id} has been resolved. The person who filed it has been emailed.`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function remove(id: string, source: "customer" | "worker") {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dispute/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (handleAuthFailure(response)) return;
      const result = await response.json();
      if (result.success) {
        if (source === "customer") setCustomerComplaints((list) => list.filter((c) => c.id !== id));
        else setWorkerComplaints((list) => list.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Complaints</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review complaints, take action on accounts, and resolve disputes raised by customers and workers.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-dark" />
              <p className="text-sm font-semibold text-primary-dark">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-primary-dark/70 hover:text-primary-dark" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <PaymentDisputeSection
          disputes={workerComplaints.filter((c) => c.type === "payment")}
          onDecided={(message) => {
            setSuccessMessage(message);
            refresh();
          }}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComplaintSection
            title="Customer Disputes"
            complaints={customerComplaints}
            onResolve={(id) => resolve(id, "customer")}
            onDelete={(id) => remove(id, "customer")}
            onModerate={setModeration}
          />
          <ComplaintSection
            title="Worker Disputes"
            complaints={workerComplaints.filter((c) => c.type !== "payment")}
            onResolve={(id) => resolve(id, "worker")}
            onDelete={(id) => remove(id, "worker")}
            onModerate={setModeration}
          />
        </div>
      </div>

      <ModerationDialog
        target={moderation?.target ?? null}
        disputeId={moderation?.disputeId}
        initialAction={moderation?.action}
        onClose={() => setModeration(null)}
        onDone={(message) => {
          setModeration(null);
          setSuccessMessage(message);
          refresh();
        }}
      />
    </DashboardLayout>
  );
}
