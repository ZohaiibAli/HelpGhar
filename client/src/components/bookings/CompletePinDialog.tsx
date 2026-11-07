import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { completeBooking } from "@/services/workerService";

/**
 * Escrow completion: the worker can only mark a job as done by entering the
 * 4-digit PIN the customer gives them once the work is finished. A correct
 * PIN completes the booking and releases the held payment to the worker.
 */
export function CompletePinDialog({
  bookingId,
  customerName,
  onClose,
  onCompleted,
}: {
  bookingId: string | null;
  customerName?: string;
  onClose: () => void;
  onCompleted: (message: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPin("");
    setError(null);
    setLocked(false);
  }, [bookingId]);

  const submit = async () => {
    if (!bookingId || pin.length !== 4 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await completeBooking(bookingId, pin);
      onCompleted(res.message);
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Could not verify the PIN.");
      if (err?.status === 423) setLocked(true);
      setPin("");
    } finally {
      setSubmitting(false);
    }
  };

  const who = customerName?.split(" ")[0] || "the customer";

  return (
    <Dialog open={bookingId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
            <KeyRound className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Enter completion PIN</DialogTitle>
          <DialogDescription className="text-center">
            Ask {who} for the 4-digit PIN once the job is done. The payment for
            this booking is released to your earnings when the PIN is correct.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col items-center gap-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(v) => setPin(v.replace(/\D/g, ""))}
            disabled={locked || submitting}
            inputMode="numeric"
            pattern="^[0-9]*$"
            autoFocus
          >
            <InputOTPGroup>
              {[0, 1, 2, 3].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg font-bold" />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p role="alert" className="text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <p className="inline-flex items-center gap-1 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> After 5 wrong attempts the booking is locked.
          </p>

          <DialogFooter className="mt-2 w-full gap-2 sm:justify-center">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              {locked ? "Close" : "Cancel"}
            </Button>
            {!locked && (
              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary-dark"
                disabled={pin.length !== 4 || submitting}
              >
                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Verify &amp; complete
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
