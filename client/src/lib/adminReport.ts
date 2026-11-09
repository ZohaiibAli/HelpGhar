import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdminReport, ReportMonth } from "@/services/adminService";

export type ReportKind = "monthly" | "yearly";

const GREEN: [number, number, number] = [16, 185, 129];
const DARK: [number, number, number] = [30, 41, 59];
const GREY: [number, number, number] = [100, 116, 139];

const rs = (v: number) => `Rs. ${Math.round(v).toLocaleString("en-US")}`;
const num = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (v: number | null) => (v === null ? "-" : `${v >= 0 ? "+" : ""}${v}%`);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function trend(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  if (previous === 0) return current === 0 ? null : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** A period (month or year) with everything the report prints. */
interface Period {
  label: string;
  newCustomers: number;
  newWorkers: number;
  newUsers: number;
  totalUsers: number;
  bookings: number;
  completed: number;
  gross: number;
  workerShare: number;
  profit: number;
  profitGrowth: number | null;
  usersGrowth: number | null;
}

function fromMonth(m: ReportMonth, prev: ReportMonth | null): Period {
  return {
    label: m.month,
    newCustomers: m.newCustomers,
    newWorkers: m.newWorkers,
    newUsers: m.newUsers,
    totalUsers: m.totalUsers,
    bookings: m.bookings,
    completed: m.completed,
    gross: m.gross,
    workerShare: m.workerShare,
    profit: m.profit,
    profitGrowth: trend(m.profit, prev ? prev.profit : null),
    usersGrowth: trend(m.newUsers, prev ? prev.newUsers : null),
  };
}

function rollUpYears(monthly: ReportMonth[]): Period[] {
  const years = [...new Set(monthly.map((m) => m.year))].sort((a, b) => a - b);
  const out: Period[] = [];
  let prev: Period | null = null;
  for (const year of years) {
    const rows = monthly.filter((m) => m.year === year);
    const sum = (f: (m: ReportMonth) => number) => rows.reduce((s, m) => s + f(m), 0);
    const period: Period = {
      label: String(year),
      newCustomers: sum((m) => m.newCustomers),
      newWorkers: sum((m) => m.newWorkers),
      newUsers: sum((m) => m.newUsers),
      totalUsers: rows[rows.length - 1].totalUsers,
      bookings: sum((m) => m.bookings),
      completed: sum((m) => m.completed),
      gross: sum((m) => m.gross),
      workerShare: sum((m) => m.workerShare),
      profit: sum((m) => m.profit),
      profitGrowth: null,
      usersGrowth: null,
    };
    period.profitGrowth = trend(period.profit, prev ? prev.profit : null);
    period.usersGrowth = trend(period.newUsers, prev ? prev.newUsers : null);
    out.push(period);
    prev = period;
  }
  return out;
}

/** Fetch the site logo (admin-configurable URL) as a data URL for the PDF. */
async function loadLogo(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    // Re-draw through a canvas so any format (webp/svg/png) becomes PNG.
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 200;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function downloadAdminReport(opts: {
  report: AdminReport;
  kind: ReportKind;
  year?: number;
  logoUrl?: string | null;
  siteName?: string | null;
}) {
  const { report, kind } = opts;
  const siteName = opts.siteName || "HelpGhar";
  const logo = await loadLogo(opts.logoUrl);

  // ---- Build the periods the report covers ----
  let periods: Period[];
  let title: string;
  let subtitle: string;
  let fileName: string;

  if (kind === "monthly") {
    const year = opts.year ?? new Date().getFullYear();
    const all = report.monthly;
    periods = all
      .map((m, i) => ({ m, prev: i > 0 ? all[i - 1] : null }))
      .filter(({ m }) => m.year === year)
      .map(({ m, prev }) => fromMonth(m, prev));
    title = "MONTHLY GROWTH REPORT";
    subtitle = `Month-by-month performance - ${year}`;
    fileName = `${siteName}_Monthly_Report_${year}.pdf`;
  } else {
    periods = rollUpYears(report.monthly);
    title = "YEARLY GROWTH REPORT";
    subtitle = periods.length ? `Year-by-year performance - ${periods[0].label} to ${periods[periods.length - 1].label}` : "";
    fileName = `${siteName}_Yearly_Report.pdf`;
  }

  const sum = (f: (p: Period) => number) => periods.reduce((s, p) => s + f(p), 0);
  const totals = {
    newCustomers: sum((p) => p.newCustomers),
    newWorkers: sum((p) => p.newWorkers),
    newUsers: sum((p) => p.newUsers),
    bookings: sum((p) => p.bookings),
    completed: sum((p) => p.completed),
    gross: sum((p) => p.gross),
    workerShare: sum((p) => p.workerShare),
    profit: sum((p) => p.profit),
  };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;

  // ================= HEADER (same style as the payment receipt) =================
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 34, "F");

  let textX = M;
  if (logo) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 6, 22, 22, 3, 3, "F");
    try {
      doc.addImage(logo, "PNG", M + 2, 8, 18, 18);
    } catch {
      /* unreadable image: fall through to the text-only header */
    }
    textX = M + 28;
  } else {
    // Fallback mark so the report is always branded.
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 6, 22, 22, 3, 3, "F");
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("H", M + 11, 21, { align: "center" });
    textX = M + 28;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(siteName, textX, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Professional Home Services", textX, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(title, W - M, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(subtitle, W - M, 24, { align: "right" });

  doc.setTextColor(...GREY);
  doc.setFontSize(8.5);
  doc.text(
    `Generated ${new Date(report.generatedAt).toLocaleString("en-GB")}  |  Revenue counts completed (released) bookings only  |  Platform fee ${report.feeRate}%`,
    M,
    41,
  );

  // ================= KPI TILES =================
  const best = periods.reduce<Period | null>((b, p) => (!b || p.profit > b.profit ? p : b), null);
  const avgProfit = periods.length ? totals.profit / periods.length : 0;
  const tiles: [string, string, string][] = [
    ["PLATFORM PROFIT", rs(totals.profit), `${report.feeRate}% cut - avg ${rs(avgProfit)} / ${kind === "monthly" ? "month" : "year"}`],
    ["PAID BY CUSTOMERS", rs(totals.gross), `Workers earned ${rs(totals.workerShare)}`],
    ["NEW USERS", num(totals.newUsers), `${num(totals.newCustomers)} customers, ${num(totals.newWorkers)} workers`],
    ["BOOKINGS", num(totals.bookings), `${num(totals.completed)} completed`],
    ["BEST PERIOD", best && best.profit > 0 ? best.label : "-", best && best.profit > 0 ? `${rs(best.profit)} profit` : "No profit yet"],
  ];
  const tileGap = 4;
  const tileW = (W - M * 2 - tileGap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([label, value, note], i) => {
    const x = M + i * (tileW + tileGap);
    doc.setFillColor(i === 0 ? 220 : 245, i === 0 ? 252 : 245, i === 0 ? 231 : 245);
    doc.roundedRect(x, 46, tileW, 24, 3, 3, "F");
    doc.setTextColor(...GREY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(label, x + 4, 53);
    doc.setTextColor(...(i === 0 ? GREEN : DARK));
    doc.setFontSize(14);
    doc.text(value, x + 4, 61);
    doc.setTextColor(...GREY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(note, x + 4, 67);
  });

  // ================= GROWTH BARS =================
  let y = 78;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(kind === "monthly" ? "Profit and new users by month" : "Profit and new users by year", M, y);

  const chartTop = y + 4;
  const chartH = 42;
  const half = (W - M * 2 - 10) / 2;

  const bars = (x0: number, heading: string, values: number[], color: [number, number, number], fmt: (v: number) => string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...GREY);
    doc.text(heading, x0, chartTop + 3);
    const baseY = chartTop + chartH;
    const area = chartH - 14;
    const max = Math.max(...values, 1);
    const slot = half / Math.max(values.length, 1);
    const bw = Math.min(slot * 0.62, 14);
    doc.setDrawColor(220);
    doc.line(x0, baseY, x0 + half, baseY);
    values.forEach((v, i) => {
      const h = (v / max) * area;
      const bx = x0 + i * slot + (slot - bw) / 2;
      doc.setFillColor(...color);
      if (h > 0) doc.roundedRect(bx, baseY - h, bw, h, 0.8, 0.8, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...GREY);
      const lbl = kind === "monthly" ? periods[i].label.split(" ")[0] : periods[i].label;
      doc.text(lbl, bx + bw / 2, baseY + 3.5, { align: "center" });
      if (v > 0) doc.text(fmt(v), bx + bw / 2, baseY - h - 1, { align: "center" });
    });
  };

  const compactRs = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`);
  bars(M, "PLATFORM PROFIT (Rs.)", periods.map((p) => p.profit), GREEN, compactRs);
  bars(M + half + 10, "NEW USERS (customers + workers)", periods.map((p) => p.newUsers), [59, 130, 246], num);

  // ================= TABLE =================
  const head = [
    kind === "monthly" ? "Month" : "Year",
    "New customers",
    "New workers",
    "New users",
    "Total users",
    "User growth",
    "Bookings",
    "Completed",
    "Paid by customers",
    "Worker earnings",
    "Profit",
    "Profit growth",
  ];
  const body = periods.map((p) => [
    p.label,
    num(p.newCustomers),
    num(p.newWorkers),
    num(p.newUsers),
    num(p.totalUsers),
    pct(p.usersGrowth),
    num(p.bookings),
    num(p.completed),
    rs(p.gross),
    rs(p.workerShare),
    rs(p.profit),
    pct(p.profitGrowth),
  ]);
  const lastTotalUsers = periods.length ? periods[periods.length - 1].totalUsers : 0;
  body.push([
    "TOTAL",
    num(totals.newCustomers),
    num(totals.newWorkers),
    num(totals.newUsers),
    num(lastTotalUsers),
    "",
    num(totals.bookings),
    num(totals.completed),
    rs(totals.gross),
    rs(totals.workerShare),
    rs(totals.profit),
    "",
  ]);

  autoTable(doc, {
    startY: chartTop + chartH + 12,
    head: [head],
    body,
    theme: "grid",
    margin: { left: M, right: M, bottom: 18 },
    styles: { fontSize: 8, cellPadding: 2, textColor: DARK, lineColor: [226, 232, 240] },
    headStyles: { fillColor: GREEN, textColor: 255, halign: "center", fontStyle: "bold" },
    columnStyles: Object.fromEntries(head.map((_, i) => [i, { halign: i === 0 ? "left" : "right" }])),
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [220, 252, 231];
      }
    },
  });

  // ================= PLATFORM SNAPSHOT =================
  const t = report.totals;
  const lastY = (doc as any).lastAutoTable?.finalY ?? 150;
  let sy = lastY + 10;
  if (sy + 40 > H - 18) {
    doc.addPage();
    sy = 20;
  }
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Platform snapshot (all time)", M, sy);
  autoTable(doc, {
    startY: sy + 3,
    theme: "grid",
    margin: { left: M, right: M, bottom: 18 },
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: DARK, lineColor: [226, 232, 240] },
    body: [
      ["Total users", num(t.users), "Total customers", num(t.customers), "Total workers", num(t.workers)],
      ["Verified workers", num(t.verifiedWorkers), "Awaiting verification", num(t.pendingWorkers), "Open complaints", num(t.openDisputes)],
      ["Total bookings", num(t.bookings), "Completed bookings", num(t.completedBookings), "Reviews received", num(t.reviews)],
    ],
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [245, 245, 245] },
      2: { fontStyle: "bold", fillColor: [245, 245, 245] },
      4: { fontStyle: "bold", fillColor: [245, 245, 245] },
      1: { halign: "right" },
      3: { halign: "right" },
      5: { halign: "right" },
    },
  });

  // ================= FOOTER on every page =================
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220);
    doc.line(M, H - 13, W - M, H - 13);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...GREY);
    doc.text(`${siteName} - system-generated report. Confidential: for admin use only.`, M, H - 8);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 8, { align: "right" });
  }

  doc.save(fileName);
}

/** Years that have any activity, newest first (for the year picker). */
export function reportYears(report: AdminReport | null): number[] {
  if (!report) return [new Date().getFullYear()];
  return [...new Set(report.monthly.map((m) => m.year))].sort((a, b) => b - a);
}

export { MONTH_NAMES };
