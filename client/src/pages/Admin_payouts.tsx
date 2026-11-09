import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Landmark, Loader2, Smartphone, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminService, type AdminPayout } from "@/services/adminService";

const TABS = [
  { id: "pending", label: "Awaiting payout" },
  { id: "paid", label: "Paid" },
  { id: "all", label: "All" },
] as const;

function when(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function AdminPayouts() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pending");
  const [rows, setRows] = useState<AdminPayout[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<AdminPayout | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getPayouts(tab);
      setRows(data.payouts);
      setPendingTotal(data.pendingTotal);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const openPay = (row: AdminPayout) => {
    setPaying(row);
    setReference("");
    setNote("");
    setError(null);
  };

  const markPaid = async () => {
    if (!paying) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await adminService.markPayoutPaid(paying.payoutId, reference.trim(), note.trim() || undefined);
      setPaying(null);
      setNotice(`${data.message}. The worker has been emailed.`);
      load();
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Could not mark as paid.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black md:text-3xl">Payouts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send each worker their earnings for completed jobs, then record the transfer here.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total awaiting payout</p>
            <p className="text-xl font-black">Rs. {pendingTotal.toLocaleString()}</p>
          </div>
        </div>

        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-dark">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
            </p>
            <button onClick={() => setNotice(null)} aria-label="Dismiss" className="text-primary-dark/70 hover:text-primary-dark">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {loading && (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            )}
            {!loading && rows.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground">
                {tab === "pending" ? "Nothing to pay right now." : "No payouts here yet."}
              </p>
            )}
            {!loading && rows.map((p) => {
              const d = p.payoutDetails;
              return (
                <div key={p.payoutId} className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{p.payoutId} • Booking {p.bookingId}</p>
                    <p className="truncate text-sm font-semibold">{p.workerName} <span className="text-xs font-normal text-muted-foreground">({p.workerId})</span></p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.category} • job completed {when(p.createdAt)}
                      {p.workerPhone ? ` • ${p.workerPhone}` : ""}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl bg-muted/50 p-3 text-xs">
                    {d ? (
                      <>
                        <p className="inline-flex items-center gap-1.5 font-bold">
                          {d.method === "bank" ? <Landmark className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                          {d.methodLabel}{d.bankName ? ` • ${d.bankName}` : ""}
                        </p>
                        <p className="mt-1 flex items-center gap-1 font-mono">
                          <span className="truncate">{d.account}</span>
                          {d.account && <CopyButton value={d.account} />}
                        </p>
                        <p className="truncate text-muted-foreground">{d.accountTitle}</p>
                        {p.status === "pending" && p.payoutTitleMatchesName === false && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700">
                            <AlertTriangle className="h-3 w-3" /> Account title doesn't match the worker's name
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="inline-flex items-center gap-1 font-semibold text-orange-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> No payout details yet. Ask the worker to add them in Settings.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                    <p className="text-lg font-black">Rs. {p.amount.toLocaleString()}</p>
                    {p.status === "pending" ? (
                      <Button size="sm" className="rounded-xl bg-primary hover:bg-primary-dark" disabled={!d} onClick={() => openPay(p)}>
                        Mark as paid
                      </Button>
                    ) : (
                      <span className="text-right text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase text-primary-dark">Paid</span>
                        <br />ref {p.reference} • {when(p.paidAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={paying !== null} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark {paying?.payoutId} as paid</DialogTitle>
            <DialogDescription>
              First send Rs. {paying?.amount.toLocaleString()} to {paying?.workerName} on{" "}
              {paying?.payoutDetails?.methodLabel} ({paying?.payoutDetails?.account}), then enter the transaction
              reference from your bank or wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="payout-ref" className="mb-1.5 block text-xs font-semibold">Transaction reference</label>
              <input
                id="payout-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TID 01234567890"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="payout-note" className="mb-1.5 block text-xs font-semibold">Note (optional)</label>
              <input
                id="payout-note"
                value={note}
                maxLength={300}
                onChange={(e) => setNote(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setPaying(null)}>Cancel</Button>
            <Button className="rounded-xl bg-primary hover:bg-primary-dark" disabled={saving || reference.trim().length < 3} onClick={markPaid}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Confirm paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
