import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { Button } from "@/components/ui/button";
import type { Complaint } from "@/types";
import { HgAlert } from "@/components/ui/HgAlert";
import { api } from "@/services/api";


export default function DisputePage() {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "server" | "success";
    title: string;
    description: string;
  }>({ open: false, type: "success", title: "", description: "" });

  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));
  const [list, setList] = useState<Complaint[]>([]);
  const [form, setForm] = useState({

    workerId: "",

    subject: "",

    description: ""

  });
  const [workers, setWorkers] = useState<
    {
      workerId: string;
      fullName: string;
    }[]
  >([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchWorkers = async () => {
    try {

      const { data } = await api.get("/customer/workers");

      if (data.success) {
        setWorkers(data.workers);
      }

    } catch (error) {
      console.log(error);
    }
  };
  // const fetchComplaints = async () => {

  //   try {

  //     const token = localStorage.getItem("token");

  //     const response = await fetch(

  //       `${API_BASE_URL}/customer/disputes`,

  //       {

  //         headers: {

  //           Authorization: `Bearer ${token}`

  //         }

  //       }

  //     );

  //     const result = await response.json();

  //     if (result.success) {

  //       setList(result.complaints);

  //     }

  //   }

  //   catch (error) {

  //     console.log(error);

  //   }

  // };

  const fetchComplaints = async () => {
    try {

      const { data } = await api.get("/customer/disputes");

      if (data.success) {
        setList(data.complaints);
      }

    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {

    fetchComplaints();
    fetchWorkers();


  }, []);

  return (
    <DashboardLayout
      title="Customer"
      items={customerItems}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-base font-bold">File a complaint</h2>
            <p className="mt-1 text-xs text-muted-foreground">We typically respond within 24 hours.</p>
            <div className="mt-4 space-y-3">
              <div>

                <label className="mb-1.5 block text-xs font-semibold">

                  Worker

                </label>

                <select

                  value={form.workerId}

                  onChange={(e) =>

                    setForm({

                      ...form,

                      workerId: e.target.value

                    })

                  }

                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"

                >

                  <option value="">

                    Select Worker

                  </option>

                  {

                    workers.map(worker => (

                      <option
                        key={worker.workerId}
                        value={worker.workerId}
                      >

                        {worker.fullName}

                      </option>

                    ))

                  }

                </select>

              </div>
              <Input label="Subject" value={form.subject} onChange={(v) => setForm(f => ({ ...f, subject: v }))} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Describe the issue</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button
                onClick={async () => {

                  if (!form.subject || !form.workerId)
                    return;

                  try {

                    const { data: result } = await api.post("/customer/dispute", {
                      workerId: form.workerId,
                      subject: form.subject,
                      description: form.description,
                    });

                    if (result.success) {

                      setAlertState({
                        open: true,
                        type: "success",
                        title: "Complaint submitted",
                        description: result.message || "We've received your complaint and will respond within 24 hours.",
                      });

                      setForm({

                        workerId: "",

                        subject: "",

                        description: ""

                      });
                      fetchComplaints();

                    }

                    else {

                      setAlertState({
                        open: true,
                        type: "error",
                        title: "Submission failed",
                        description: result.message || "Something went wrong. Please try again.",
                      });


                    }

                  }

                  catch (error) {

                    setAlertState({
                      open: true,
                      type: "server",
                      title: "Something went wrong",
                      description: "We couldn't reach the server. Please check your connection and try again.",
                    });

                  }

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
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Complaint
                      </p>

                      <p className="text-base font-bold">
                        {c.subject}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Worker ID: {c.workerId}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Against {c.workerName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
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
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${map[status]}`}>{status.replace("_", " ")}</span>;
}
