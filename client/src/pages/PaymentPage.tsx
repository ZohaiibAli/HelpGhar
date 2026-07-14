import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CreditCard, Wallet, Lock, CheckCircle2, Download } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { api } from "@/services/api";
import { HgAlert } from "@/components/ui/HgAlert";

export default function PaymentPage() {
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [method, setMethod] = useState<"card" | "wallet" | "bank">("card");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "warning" | "success" | "server";
    title: string;
    description: string;
  }>({ open: false, type: "error", title: "", description: "" });

  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    api.get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data.booking))
      .catch((err) => setAlertState({
        open: true,
        type: "error",
        title: "Booking not found",
        description: err.message ?? "We couldn't find this booking.",
      }))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePay = async () => {
    if (!bookingId) return;
    setPaying(true);
    try {
      const res = await api.post("/payments/", {
        bookingId,
        method,
        cardHolder,
        cardNumber,
        expiry,
        cvv,
      });
      setPayment(res.data.payment);
      setDone(true);
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "error",
        title: "Payment failed",
        description: err.message ?? "We couldn't process your payment. Please check your card details.",
      });
    } finally {
      setPaying(false);
    }
  };

const handleDownloadReceipt = () => {
  if (!payment) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ================= HEADER =================
  doc.setFillColor(16, 185, 129); // Emerald Green
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("HelpGhar", 20, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Professional Home Services", 20, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PAYMENT RECEIPT", pageWidth - 20, 22, { align: "right" });

  // Reset
  doc.setTextColor(0, 0, 0);

  // ================= PAID BADGE =================
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(155, 45, 28, 10, 3, 3, "F");

  doc.setTextColor(22, 163, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PAID", 169, 52, { align: "center" });

  doc.setTextColor(0);

  let y = 65;

  // ================= RECEIPT DETAILS =================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Receipt Information", 20, y);

  y += 10;

  const detailRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, 20, y);

    doc.setFont("helvetica", "normal");
    doc.text(value, 75, y);

    y += 9;
  };

  detailRow("Transaction ID", payment.id);
  detailRow("Booking ID", payment.bookingId);
  detailRow("Date", new Date(payment.date).toLocaleString());
  detailRow("Payment Method", payment.method);

  if (booking.customerName)
    detailRow("Customer", booking.customerName);

  if (booking.workerName)
    detailRow("Worker", booking.workerName);

  if (booking.category)
    detailRow("Service", booking.category);

  y += 5;

  // ================= PAYMENT SUMMARY =================
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, y, 170, 60, 3, 3, "F");

  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Payment Summary", 28, y);

  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text("Service Amount", 28, y);
  doc.text(`Rs. ${payment.amount.toLocaleString()}`, 180, y, {
    align: "right",
  });

  y += 10;

  doc.text("Platform Fee", 28, y);
  doc.text(`Rs. ${payment.platformFee.toLocaleString()}`, 180, y, {
    align: "right",
  });

  y += 10;

  doc.setDrawColor(180);
  doc.line(28, y, 180, y);

  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);

  doc.text("TOTAL PAID", 28, y);

  doc.setTextColor(16, 185, 129);
  doc.text(`Rs. ${payment.total.toLocaleString()}`, 180, y, {
    align: "right",
  });

  doc.setTextColor(0);

  y += 25;

  // ================= FOOTER =================
  doc.setDrawColor(220);
  doc.line(20, y, 190, y);

  y += 12;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100);

  doc.text(
    "Thank you for choosing HelpGhar!",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 7;

  doc.text(
    "This is a system-generated payment receipt.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 7;

  doc.text(
    "Please keep this receipt for your records.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  doc.save(`HelpGhar_Receipt_${payment.id}.pdf`);
};

  if (loading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">Loading booking...</div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-base font-bold">Booking not found</p>
          <Button asChild className="mt-4 bg-primary hover:bg-primary-dark"><Link to="/services">Back to services</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const { amount, platformFee, total } = booking;

  if (done && payment) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-lg px-4 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary"><CheckCircle2 className="h-8 w-8" /></div>
            <h1 className="mt-5 text-2xl font-black">Payment successful</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your booking is confirmed and the worker has been notified.</p>
            <div className="mt-6 rounded-2xl bg-muted p-5 text-left text-sm">
              <Row label="Transaction ID" value={payment.id} />
              <Row label="Date" value={new Date(payment.date).toDateString()} />
              <Row label="Method" value={payment.method} />
              <Row label="Amount" value={`Rs. ${payment.total.toLocaleString()}`} />
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleDownloadReceipt}>
                <Download className="mr-2 h-4 w-4" /> Receipt
              </Button>
              <Button asChild className="flex-1 bg-primary hover:bg-primary-dark"><Link to="/my-bookings">My bookings</Link></Button>
            </div>
          </div>
        </div>
        <HgAlert
          open={alertState.open}
          onClose={closeAlert}
          type={alertState.type}
          title={alertState.title}
          description={alertState.description}
        />
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
              <form onSubmit={(e) => { e.preventDefault(); handlePay(); }} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-sm font-bold uppercase tracking-wider">Card details</h3>
                <Field label="Card holder name">
                  <input className="hg-input" placeholder="Hassan Iqbal" required
                    value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                </Field>
                <Field label="Card number">
                  <input className="hg-input" placeholder="1234 5678 9012 3456" maxLength={19} required
                    value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry">
                    <input className="hg-input" placeholder="MM/YY" required
                      value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                  </Field>
                  <Field label="CVV">
                    <input className="hg-input" placeholder="123" maxLength={4} required
                      value={cvv} onChange={(e) => setCvv(e.target.value)} />
                  </Field>
                </div>
                <Button type="submit" disabled={paying} className="h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark">
                  {paying ? "Processing..." : `Pay Rs. ${total.toLocaleString()}`}
                </Button>
              </form>
            )}
            {method !== "card" && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-base font-bold">{method === "wallet" ? "Digital wallet" : "Bank transfer"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Continue to authorize the payment via your provider.</p>
                <Button onClick={handlePay} disabled={paying} className="mt-4 bg-primary hover:bg-primary-dark">
                  {paying ? "Processing..." : `Authorize Rs. ${total.toLocaleString()}`}
                </Button>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-base font-bold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Service amount" value={`Rs. ${amount.toLocaleString()}`} />
                <Row label="Platform commission (5%)" value="Included" />
                <Row label="Tax (5%)" value={`Rs. ${platformFee.toLocaleString()}`} />
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
      <HgAlert
        open={alertState.open}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        description={alertState.description}
      />
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