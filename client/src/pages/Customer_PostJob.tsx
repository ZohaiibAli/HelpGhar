import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { Button } from "@/components/ui/button";
import { HgAlert } from "@/components/ui/HgAlert";
import { categories } from "@/data/mock";
import { jobService } from "@/services/jobService";
import type { WorkerCategory } from "@/types";

const budgetUnits = [
  { value: "fixed", label: "Fixed price" },
  { value: "hour", label: "Per hour" },
  { value: "day", label: "Per day" },
  { value: "month", label: "Per month" },
] as const;

export default function Customer_PostJob() {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split("T")[0];

  const [category, setCategory] = useState<WorkerCategory | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [budgetUnit, setBudgetUnit] = useState<(typeof budgetUnits)[number]["value"]>("fixed");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState(todayStr);
  const [preferredTime, setPreferredTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "warning" | "success" | "server";
    title: string;
    description: string;
  }>({ open: false, type: "error", title: "", description: "" });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const handleSubmit = async () => {
    if (!category || !title.trim() || !description.trim() || !address.trim()) {
      setAlertState({
        open: true,
        type: "warning",
        title: "Missing details",
        description: "Please fill in the category, title, description and address.",
      });
      return;
    }

    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (!min || !max || max < min) {
      setAlertState({
        open: true,
        type: "warning",
        title: "Invalid budget",
        description: "Please enter a valid budget range.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await jobService.createJob({
        category,
        title,
        description,
        budgetMin: min,
        budgetMax: max,
        budgetUnit,
        address,
        preferredDate,
        preferredTime,
      });
      navigate("/my-jobs");
    } catch (err: any) {
      setAlertState({
        open: true,
        type: "server",
        title: "Could not post job",
        description: err.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Customer" items={customerItems}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black md:text-4xl">Post a job</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe what you need and let workers apply with their offer.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkerCategory)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need a driver for morning school runs"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about the job, timing, requirements..."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Budget min (Rs.)">
              <input
                type="number"
                min={0}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Budget max (Rs.)">
              <input
                type="number"
                min={0}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Per">
              <select
                value={budgetUnit}
                onChange={(e) => setBudgetUnit(e.target.value as typeof budgetUnit)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {budgetUnits.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Address">
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #, Street, Area, City"
              className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Preferred date">
              <input
                type="date"
                min={todayStr}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Preferred time">
              <input
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. Mornings, 8am - 10am"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-primary text-base font-bold hover:bg-primary-dark"
          >
            {submitting ? "Posting..." : "Post job"}
          </Button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
