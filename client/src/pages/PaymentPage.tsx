import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CreditCard, Wallet, Lock, CheckCircle2, Download } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  const [params] = useSearchParams();
  const amount = Number(params.get("amount") ?? 5000);
  const [method, setMethod] = useState<"card" | "wallet" | "bank">("card");
  const [done, setDone] = useState(false);

  const tax = Math.round(amount * 0.05);
  const total = amount + tax;

  if (done) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-lg px-4 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary"><CheckCircle2 className="h-8 w-8" /></div>
            <h1 className="mt-5 text-2xl font-black">Payment successful</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your booking is confirmed and the worker has been notified.</p>
            <div className="mt-6 rounded-2xl bg-muted p-5 text-left text-sm">
              <Row label="Transaction ID" value="TXN-90041" />
              <Row label="Date" value={new Date().toDateString()} />
              <Row label="Method" value={method.toUpperCase()} />
              <Row label="Amount" value={`Rs. ${total.toLocaleString()}`} />
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1"><Download className="mr-2 h-4 w-4" /> Receipt</Button>
              <Button asChild className="flex-1 bg-primary hover:bg-primary-dark"><Link to="/my-bookings">My bookings</Link></Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Secure checkout</h1>
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Your payment details are encrypted.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider">Payment method</h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MethodBtn active={method === "card"} onClick={() => setMethod("card")} icon={CreditCard} label="Card" />
                <MethodBtn active={method === "wallet"} onClick={() => setMethod("wallet")} icon={Wallet} label="Wallet" />
                <MethodBtn active={method === "bank"} onClick={() => setMethod("bank")} icon={Lock} label="Bank" />
              </div>
            </div>

            {method === "card" && (
              <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-sm font-bold uppercase tracking-wider">Card details</h3>
                <Field label="Card holder name"><input className="hg-input" placeholder="Hassan Iqbal" required /></Field>
                <Field label="Card number"><input className="hg-input" placeholder="1234 5678 9012 3456" maxLength={19} required /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry"><input className="hg-input" placeholder="MM/YY" required /></Field>
                  <Field label="CVV"><input className="hg-input" placeholder="123" maxLength={4} required /></Field>
                </div>
                <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark">Pay Rs. {total.toLocaleString()}</Button>
              </form>
            )}
            {method !== "card" && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-base font-bold">{method === "wallet" ? "Digital wallet" : "Bank transfer"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Continue to authorize the payment via your provider.</p>
                <Button onClick={() => setDone(true)} className="mt-4 bg-primary hover:bg-primary-dark">Authorize Rs. {total.toLocaleString()}</Button>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-base font-bold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Service amount" value={`Rs. ${amount.toLocaleString()}`} />
                <Row label="Platform commission (5%)" value="Included" />
                <Row label="Tax (5%)" value={`Rs. ${tax.toLocaleString()}`} />
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base font-black">
                  <span>Total</span><span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> SSL secured & PCI compliant</p>
            </div>
          </aside>
        </div>
      </div>

      <style>{`.hg-input{width:100%;height:44px;border-radius:12px;border:1px solid var(--input);background:var(--card);padding:0 14px;font-size:14px;outline:none;transition:.15s;}
      .hg-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 18%,transparent);}`}</style>
    </MainLayout>
  );
}

function MethodBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof CreditCard; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-xs font-bold transition ${active ? "border-primary bg-primary-soft text-primary-dark" : "border-border bg-background hover:border-primary/40"}`}>
      <Icon className="h-5 w-5" /> {label}
    </button>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-semibold">{label}</label>{children}</div>;
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
