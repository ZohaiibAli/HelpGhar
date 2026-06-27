import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { complaints as seed } from "@/data/mock";
import { Button } from "@/components/ui/button";
import type { Complaint } from "@/types";

export default function DisputePage() {
  const [list, setList] = useState<Complaint[]>(seed);
  const [form, setForm] = useState({ workerName: "", subject: "", description: "" });

  return (
    <MainLayout>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-base font-bold">File a complaint</h2>
            <p className="mt-1 text-xs text-muted-foreground">We typically respond within 24 hours.</p>
            <div className="mt-4 space-y-3">
              <Input label="Worker name" value={form.workerName} onChange={(v) => setForm(f => ({ ...f, workerName: v }))} />
              <Input label="Subject" value={form.subject} onChange={(v) => setForm(f => ({ ...f, subject: v }))} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Describe the issue</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button
                onClick={() => {
                  if (!form.subject || !form.workerName) return;
                  setList(l => [{ id: "C-" + Math.floor(Math.random() * 999), customerName: "You", workerName: form.workerName, subject: form.subject, description: form.description, status: "open", date: new Date().toISOString().slice(0,10) }, ...l]);
                  setForm({ workerName: "", subject: "", description: "" });
                }}
                className="h-11 w-full bg-primary hover:bg-primary-dark">Submit complaint</Button>
            </div>
          </div>
        </aside>

        <div>
          <h1 className="text-3xl font-black md:text-4xl">Disputes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Track the status of complaints you've raised.</p>
          <div className="mt-6 space-y-3">
            {list.map(c => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-100 text-yellow-700"><AlertTriangle className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">#{c.id}</p>
                      <p className="text-base font-bold">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">Against {c.workerName} • {c.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </div>
  );
}
function StatusBadge({ status }: { status: Complaint["status"] }) {
  const map: Record<Complaint["status"], string> = {
    open: "bg-yellow-100 text-yellow-800",
    in_review: "bg-blue-100 text-blue-800",
    resolved: "bg-primary-soft text-primary-dark",
    closed: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${map[status]}`}>{status.replace("_"," ")}</span>;
}
