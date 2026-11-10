import { useEffect, useState, type ReactNode } from "react";
import { Download, Loader2, TrendingDown, TrendingUp, Wallet, Landmark, PiggyBank, Receipt } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { adminService, type AdminEarnings } from "@/services/adminService";
import { downloadAdminReport, reportYears, type ReportKind } from "@/lib/adminReport";
import { useWebsiteSettingsStore } from "@/store/websiteSettingsStore";

const rs = (v: number) => `Rs. ${Math.round(v).toLocaleString()}`;
const compact = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${v}`;

const GROSS = "#94a3b8";
const WORKER = "#3b82f6";
const PROFIT = "#16a34a";

function Growth({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center font-semibold ${up ? "text-primary" : "text-destructive"}`}>
      {up ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

export default function AdminEarningsPage() {
  const [data, setData] = useState<AdminEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getEarnings(12);
      setData(res.data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const { websiteLogo, websiteName } = useWebsiteSettingsStore();
  const [kind, setKind] = useState<ReportKind>("monthly");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const download = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await adminService.getReport();
      const years = reportYears(res.data);
      await downloadAdminReport({
        report: res.data,
        kind,
        year: years.includes(year) ? year : years[0],
        logoUrl: websiteLogo,
        siteName: websiteName || "HelpGhar",
      });
    } catch (e: any) {
      setExportError(e?.message ?? "Could not generate the report");
    } finally {
      setExporting(false);
    }
  };

  const monthly = data?.monthly ?? [];
  const rowsDesc = [...monthly].reverse();
  const tooltipStyle = { borderRadius: 12, fontSize: 12 };

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Earnings & profit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer pays the job amount + {data?.feeRate ?? 5}%, and the worker gets the amount − {data?.feeRate ?? 5}%. Both
            cuts are HelpGhar's profit. Only completed (released) bookings count.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error} <button onClick={load} className="font-bold underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center rounded-3xl border border-border bg-card p-16 shadow-soft">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          data && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card
                  icon={PiggyBank}
                  label="Total profit (5% + 5%)"
                  value={rs(data.lifetime.profit)}
                  note={`${data.lifetime.bookings} completed bookings`}
                  highlight
                />
                <Card
                  icon={Receipt}
                  label="This month's profit"
                  value={rs(data.thisMonth?.profit ?? 0)}
                  note={
                    <>
                      <Growth value={data.growth} /> <span className="text-muted-foreground">vs last month</span>
                    </>
                  }
                />
                <Card
                  icon={Wallet}
                  label="Paid by customers"
                  value={rs(data.lifetime.gross)}
                  note={`Workers earned ${rs(data.lifetime.workerShare)}`}
                />
                <Card
                  icon={Landmark}
                  label="Held in escrow"
                  value={rs(data.pending.heldInEscrow)}
                  note={`${rs(data.pending.profitInEscrow)} profit once released`}
                />
              </div>

              <div className="flex flex-wrap items-end gap-4 rounded-3xl border border-primary/30 bg-primary/5 p-5 shadow-soft">
                <div className="min-w-[220px] flex-1">
                  <h2 className="text-base font-bold">Download growth report (PDF)</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Profit, revenue, bookings, new customers and workers, total users and growth comparison, with the
                    HelpGhar logo.
                  </p>
                  {exportError && <p className="mt-1 text-xs text-destructive">{exportError}</p>}
                </div>
                <div className="flex rounded-full border border-border bg-card p-0.5 text-xs font-bold">
                  {(["monthly", "yearly"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`rounded-full px-4 py-1.5 transition ${
                        kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {k === "monthly" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>
                {kind === "monthly" && (
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold"
                    aria-label="Year"
                  >
                    {Array.from(
                      new Set([new Date().getFullYear(), ...monthly.map((m) => Number(m.month.slice(-4)))]),
                    )
                      .sort((a, b) => b - a)
                      .map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={download}
                  disabled={exporting}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {exporting ? "Preparing..." : "Download report"}
                </button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-bold">Platform profit by month</h2>
                <p className="mt-1 text-xs text-muted-foreground">Last 12 months.</p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={PROFIT} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={PROFIT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={compact} width={40} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: number) => [rs(v), "Profit"]}
                        labelFormatter={(_, p) => p?.[0]?.payload?.month ?? ""}
                      />
                      <Area type="monotone" dataKey="profit" stroke={PROFIT} strokeWidth={2.5} fill="url(#profitFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-bold">Money flow by month</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer payments vs worker earnings vs HelpGhar profit.
                </p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={compact} width={40} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: number) => rs(v)}
                        labelFormatter={(_, p) => p?.[0]?.payload?.month ?? ""}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="gross" name="Paid by customers" fill={GROSS} fillOpacity={0.5} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="workerShare" name="Worker earnings" fill={WORKER} radius={[6, 6, 0, 0]} />
                      <Line type="monotone" dataKey="profit" name="Platform profit" stroke={PROFIT} strokeWidth={2.5} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-bold">Month-by-month breakdown</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">Month</th>
                        <th className="text-right">Bookings</th>
                        <th className="text-right">Paid by customers</th>
                        <th className="text-right">Worker earnings</th>
                        <th className="text-right">Profit ({data.feeRate}% + {data.feeRate}%)</th>
                        <th className="text-right">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsDesc.map((r) => (
                        <tr key={r.month} className="border-t border-border text-xs">
                          <td className="py-3 font-bold">{r.month}</td>
                          <td className="text-right">{r.bookings}</td>
                          <td className="text-right">{rs(r.gross)}</td>
                          <td className="text-right">{rs(r.workerShare)}</td>
                          <td className="text-right font-bold text-primary">{rs(r.profit)}</td>
                          <td className="text-right"><Growth value={r.growth} /></td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border text-xs font-black">
                        <td className="py-3">Total</td>
                        <td className="text-right">{data.lifetime.bookings}</td>
                        <td className="text-right">{rs(data.lifetime.gross)}</td>
                        <td className="text-right">{rs(data.lifetime.workerShare)}</td>
                        <td className="text-right text-primary">{rs(data.lifetime.profit)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </DashboardLayout>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  note,
  highlight,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  note: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="mt-1 text-[11px]">{note}</p>
    </div>
  );
}
