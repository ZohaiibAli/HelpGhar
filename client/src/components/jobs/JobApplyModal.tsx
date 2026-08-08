import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { JobPost } from "@/types";
import { jobService } from "@/services/jobService";

export function JobApplyModal({
  job,
  open,
  onOpenChange,
  onApplied,
}: {
  job: JobPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}) {
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMessage("");
    setProposedPrice("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!job) return;

    const price = Number(proposedPrice);
    if (!message.trim()) {
      setError("Tell the customer why you're a good fit.");
      return;
    }
    if (!price || price <= 0) {
      setError("Enter a valid proposed price.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await jobService.applyToJob(job.jobId, { message, proposedPrice: price });
      reset();
      onOpenChange(false);
      onApplied();
    } catch (err: any) {
      setError(err.message ?? "Could not submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {job?.title}</DialogTitle>
          <DialogDescription>
            Propose your price and a short message. The customer sees this alongside your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Your message</label>
            <Textarea
              rows={4}
              placeholder="Why you're a good fit for this job..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Proposed price (Rs.)</label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 3000"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
            />
            {job && (
              <p className="mt-1 text-xs text-muted-foreground">
                Customer's budget: Rs. {job.budgetMin.toLocaleString()} – {job.budgetMax.toLocaleString()}
              </p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="rounded-xl bg-primary hover:bg-primary-dark" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
