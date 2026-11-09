import { useEffect, useState } from "react";
import { Landmark, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

type Method = "bank" | "jazzcash" | "easypaisa";

type MaskedPayout = {
  method: Method;
  methodLabel: string;
  accountTitle: string;
  bankName?: string | null;
  account: string;
  updatedAt?: string;
} | null;

const METHODS: [Method, string][] = [
  ["bank", "Bank account"],
  ["jazzcash", "JazzCash"],
  ["easypaisa", "Easypaisa"],
];

const input =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/**
 * Where HelpGhar sends this worker's earnings. Shown masked; changing it
 * needs the current password and triggers an alert email to the worker.
 */
export default function PayoutDetailsSection() {
  const [current, setCurrent] = useState<MaskedPayout>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<Method>("jazzcash");
  const [accountTitle, setAccountTitle] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/worker/payout-details")
      .then(({ data }) => {
        setCurrent(data.payout);
        if (!data.payout) setEditing(true);
      })
      .catch(() => setError("Could not load your payout details."))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => {
    setMethod(current?.method ?? "jazzcash");
    setAccountTitle(current?.accountTitle ?? "");
    setBankName(current?.bankName ?? "");
    setIban("");
    setMobileNumber("");
    setCurrentPassword("");
    setError(null);
    setSaved(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.put("/worker/payout-details", {
        method,
        accountTitle,
        bankName: method === "bank" ? bankName : null,
        iban: method === "bank" ? iban : null,
        mobileNumber: method === "bank" ? null : mobileNumber,
        currentPassword,
      });
      setCurrent(data.payout);
      setEditing(false);
      setSaved("Payout details saved. We've emailed you a confirmation.");
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Could not save. Please check the details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  }

  return (
    <div className="space-y-4">
      {current && !editing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-dark">
              {current.method === "bank" ? <Landmark className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {current.methodLabel}
                {current.bankName ? ` • ${current.bankName}` : ""}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">{current.account}</p>
              <p className="truncate text-xs text-muted-foreground">{current.accountTitle}</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={startEdit}>Change</Button>
        </div>
      )}

      {!current && (
        <p className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
          You haven't added payout details yet. Add them so HelpGhar can send you your earnings.
        </p>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payout method">
            {METHODS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={method === value}
                onClick={() => setMethod(value)}
                className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${method === value ? "border-primary bg-primary-soft text-primary-dark" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="payout-title" className="mb-1.5 block text-xs font-semibold">Account title</label>
            <input id="payout-title" className={input} value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} placeholder="Name on the account" />
          </div>

          {method === "bank" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="payout-bank" className="mb-1.5 block text-xs font-semibold">Bank name</label>
                <input id="payout-bank" className={input} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Meezan Bank" />
              </div>
              <div>
                <label htmlFor="payout-iban" className="mb-1.5 block text-xs font-semibold">IBAN</label>
                <input id="payout-iban" className={`${input} uppercase`} value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PK36 SCBL 0000 0011 2345 6702" autoComplete="off" />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="payout-mobile" className="mb-1.5 block text-xs font-semibold">
                {method === "jazzcash" ? "JazzCash" : "Easypaisa"} mobile number
              </label>
              <input id="payout-mobile" className={input} inputMode="numeric" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="03001234567" autoComplete="off" />
            </div>
          )}

          <div>
            <label htmlFor="payout-password" className="mb-1.5 block text-xs font-semibold">Current password</label>
            <input id="payout-password" type="password" className={input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            <p className="mt-1 text-[11px] text-muted-foreground">Needed to change where your money is sent.</p>
          </div>

          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !currentPassword} className="rounded-xl bg-primary hover:bg-primary-dark">
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Save payout details
            </Button>
            {current && (
              <Button variant="outline" className="rounded-xl" onClick={() => setEditing(false)}>Cancel</Button>
            )}
          </div>
        </div>
      )}

      {saved && <p className="text-sm font-medium text-primary-dark">{saved}</p>}
    </div>
  );
}
