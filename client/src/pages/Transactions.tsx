import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { transactions } from "@/data/mock";
import type { PaymentStatus } from "@/types";

const filters: { id: "all" | PaymentStatus; label: string }[] = [
  { id: "all", label: "All" }, { id: "successful", label: "Successful" },
  { id: "pending", label: "Pending" }, { id: "refunded", label: "Refunded" },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState<typeof filters[number]["id"]>("all");
  const rows = transactions.filter(t => filter === "all" || t.status === filter);

  return (
    <MainLayout>
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
              <tr><Th>Transaction</Th><Th>Date</Th><Th>Method</Th><Th>Amount</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-4 font-semibold">{t.id}<p className="text-xs font-normal text-muted-foreground">Booking #{t.bookingId}</p></td>
                  <td className="px-4 py-4 text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-4">{t.method}</td>
                  <td className="px-4 py-4 font-bold">Rs. {t.amount.toLocaleString()}</td>
                  <td className="px-4 py-4"><StatusPill s={t.status} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No transactions match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
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
