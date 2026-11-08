import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { workerItems } from "@/data/workerMenu";
import type { Complaint } from "@/types";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";
import { ComplaintForm } from "@/components/disputes/ComplaintForm";
import { ComplaintCard } from "@/components/disputes/ComplaintCard";

export default function DisputePage() {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "server" | "success";
    title: string;
    description: string;
  }>({ open: false, type: "success", title: "", description: "" });

  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));
  const [list, setList] = useState<Complaint[]>([]);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get("/worker/disputes");
      if (data.success) setList(data.complaints);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <DashboardLayout title="Worker" items={workerItems}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-base font-bold">File a complaint</h2>
            <p className="mt-1 text-xs text-muted-foreground">We typically respond within 24 hours and email you every update.</p>
            <ComplaintForm
              role="worker"
              onResult={({ ok, title, message }) => {
                setAlertState({ open: true, type: ok ? "success" : "error", title, description: message });
                if (ok) fetchComplaints();
              }}
            />
          </div>
        </aside>

        <div>
          <h1 className="text-3xl font-black md:text-4xl">Disputes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track the status of complaints you've raised. Customer didn't give the PIN? Raise a payment dispute
            from that booking on the My bookings page.
          </p>
          <div className="mt-6 space-y-3">
            {list.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                You haven't filed any complaints.
              </div>
            )}
            {list.map((c) => (
              <ComplaintCard key={c.id} c={c} against={`${c.customerName} (${c.customerId})`} />
            ))}
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
    </DashboardLayout>
  );
}
