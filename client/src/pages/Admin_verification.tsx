import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { HgAlert } from "@/components/ui/HgAlert";
import { adminService, type PendingWorker } from "@/services/adminService";

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
};

export default function AdminVerification() {
  const [queue, setQueue] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "success" | "error" | "server";
    title: string;
    description: string;
  }>({ open: false, type: "success", title: "", description: "" });

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await adminService.getOverview();
      setQueue(data.verificationQueue);
    } catch (error: any) {
      setLoadError(error?.message ?? "Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (worker: PendingWorker, action: "approve" | "reject") => {
    setVerifying(worker.workerId);
    try {
      await adminService.setWorkerVerification(worker.workerId, action);
      setQueue((list) => list.filter((w) => w.workerId !== worker.workerId));
      setAlertState({
        open: true,
        type: "success",
        title: action === "approve" ? "Worker verified" : "Verification rejected",
        description:
          action === "approve"
            ? `${worker.fullName} is now a verified worker.`
            : `${worker.fullName}'s verification was rejected.`,
      });
    } catch (error: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Action failed",
        description: error?.message ?? "Could not update this worker. Please try again.",
      });
    } finally {
      setVerifying(null);
    }
  };

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Worker verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review CNIC and payout details, then approve or reject each worker.
          </p>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {loadError}{" "}
            <button onClick={load} className="font-bold underline">Retry</button>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Verification queue</h2>
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold uppercase text-yellow-800">
              {queue.length} pending
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : queue.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              No workers awaiting verification.
            </p>
          ) : (
            <>
            <div className="mt-4 space-y-3 md:hidden">
              {queue.map((w) => (
                <div key={w.workerId} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={w.avatar} name={w.fullName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{w.fullName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{w.category || w.workerId} • {formatDate(w.appliedAt)}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">CNIC:</span> {w.cnic || "—"}{" "}
                      {w.cnicImage && (
                        <a href={w.cnicImage} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">View photo</a>
                      )}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Payout:</span>{" "}
                      {w.payout ? (
                        <>
                          {w.payout.methodLabel}{w.payout.bankName ? ` • ${w.payout.bankName}` : ""} — <span className="break-all font-mono">{w.payout.account}</span> ({w.payout.accountTitle})
                          {w.payoutTitleMatchesName === false && (
                            <span className="block font-semibold text-orange-700">⚠ Title doesn't match name</span>
                          )}
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => decide(w, "approve")}
                      disabled={verifying === w.workerId}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
                    >
                      {verifying === w.workerId ? "…" : "Approve"}
                    </button>
                    <button
                      onClick={() => decide(w, "reject")}
                      disabled={verifying === w.workerId}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:border-destructive hover:text-destructive disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Worker</th><th>CNIC</th><th>Payout</th><th>Applied</th><th></th></tr>
                </thead>
                <tbody>
                  {queue.map((w) => (
                    <tr key={w.workerId} className="border-t border-border">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={w.avatar} name={w.fullName} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold">{w.fullName}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{w.category || w.workerId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground">
                        <div>{w.cnic || "—"}</div>
                        {w.cnicImage ? (
                          <a href={w.cnicImage} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">View CNIC photo</a>
                        ) : (
                          <span className="text-[10px]">No photo</span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {w.payout ? (
                          <>
                            <div className="font-semibold text-foreground">{w.payout.methodLabel}{w.payout.bankName ? ` • ${w.payout.bankName}` : ""}</div>
                            <div className="font-mono text-[10px]">{w.payout.account}</div>
                            <div className="text-[10px]">{w.payout.accountTitle}</div>
                            {w.payoutTitleMatchesName === false && (
                              <div className="text-[10px] font-semibold text-orange-700">⚠ Title doesn't match name</div>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px]">Not provided</span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground">{formatDate(w.appliedAt)}</td>
                      <td className="space-x-1 whitespace-nowrap text-right">
                        <button
                          onClick={() => decide(w, "approve")}
                          disabled={verifying === w.workerId}
                          className="rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
                        >
                          {verifying === w.workerId ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => decide(w, "reject")}
                          disabled={verifying === w.workerId}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold hover:border-destructive hover:text-destructive disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>

      <HgAlert
        open={alertState.open}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />
    </DashboardLayout>
  );
}

function Avatar({ src, name }: { src: string; name: string }) {
  if (src) {
    return <img src={src} className="h-8 w-8 rounded-full object-cover object-top" alt="" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-dark">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
