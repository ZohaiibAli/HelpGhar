import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
// import { transactions } from "@/data/mock";
import type { PaymentStatus } from "@/types";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { api } from "@/services/api";

const filters: { id: "all" | PaymentStatus; label: string }[] = [
  { id: "all", label: "All" }, { id: "successful", label: "Successful" },
  { id: "pending", label: "Pending" }, { id: "refunded", label: "Refunded" },
];

export default function TransactionsPage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [filter, setFilter] =
    useState<typeof filters[number]["id"]>("all");

  const [transactions, setTransactions] = useState<any[]>([]);


  useEffect(() => {

    fetchTransactions();

  }, []);

  const fetchTransactions = async () => {

    try {

      const { data: result } = await api.get("/payments/my");

      if (result.success) {

        setTransactions(result.transactions);

      }

    }

    catch (error) {

      console.log(error);

    }

  };

  const rows = transactions.filter(
    t => filter === "all" || t.status === filter
  );

  const downloadReceipt = async (transactionId: string) => {

    try {

      // const token = localStorage.getItem("token");

      // const response = await fetch(
      //   `${API_BASE_URL}/payments/receipt/${transactionId}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`
      //     }
      //   }
      // );

      // const result = await response.json();
      const { data: result } = await api.get(`/payments/receipt/${transactionId}`);

      if (!result.success) return;

      const payment = result.receipt;

      generateReceipt(payment);

    }

    catch (err) {

      console.log(err);

    }

  };

  const generateReceipt = (payment:any) => {
    // if (!payment) return;
  
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
  
    if (payment.customerName)
      detailRow("Customer", payment.customerName);
  
    if (payment.workerName)
      detailRow("Worker", payment.workerName);
  
    if (payment.category)
      detailRow("Service", payment.category);
  
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
  return (
    <DashboardLayout
      title="Customer"
      items={customerItems}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Transactions</h1>
        <p className="mt-2 text-sm text-muted-foreground">All your payments in one place.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><Th>Transaction</Th><Th>Date</Th><Th>Method</Th><Th>Amount</Th><Th>Status</Th><Th>Receipt</Th></tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-4 font-semibold">{t.id}<p className="text-xs font-normal text-muted-foreground">Booking #{t.bookingId}</p></td>
                  <td className="px-4 py-4 text-muted-foreground">{new Date(t.date).toLocaleString()}</td>
                  <td className="px-4 py-4">{t.method}</td>
                  <td className="px-4 py-4 font-bold">Rs. {t.total.toLocaleString()}</td>
                  <td className="px-4 py-4"><StatusPill s={t.status} /></td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => downloadReceipt(t.id)}
                      className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-white hover:bg-primary-dark"
                    >
                      <Download className="h-4 w-4" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No transactions match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}
function StatusPill({ s }: { s: PaymentStatus }) {
  const map: Record<PaymentStatus, string> = {
    successful: "bg-primary-soft text-primary-dark",
    pending: "bg-yellow-100 text-yellow-800",
    refunded: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${map[s]}`}>{s}</span>;
}
