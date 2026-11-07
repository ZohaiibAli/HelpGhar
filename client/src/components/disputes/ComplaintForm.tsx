import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { BookedCounterpart } from "@/types";

type Role = "customer" | "worker";

const CONFIG: Record<Role, {
  listUrl: string;
  listKey: "workers" | "customers";
  idKey: "workerId" | "customerId";
  submitUrl: string;
  personLabel: string;
}> = {
  customer: {
    listUrl: "/customer/workers",
    listKey: "workers",
    idKey: "workerId",
    submitUrl: "/customer/dispute",
    personLabel: "Worker",
  },
  worker: {
    listUrl: "/worker/customers",
    listKey: "customers",
    idKey: "customerId",
    submitUrl: "/worker/dispute",
    personLabel: "Customer",
  },
};

function shortDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * "File a complaint" form. Only lists people you've actually had a booking
 * with (most recently booked first), and ties the complaint to one of those
 * bookings -- the server rejects complaints without a real shared booking.
 */
export function ComplaintForm({
  role,
  onResult,
}: {
  role: Role;
  onResult: (result: { ok: boolean; title: string; message: string }) => void;
}) {
  const cfg = CONFIG[role];
  const [people, setPeople] = useState<BookedCounterpart[]>([]);
  const [loading, setLoading] = useState(true);
  const [personId, setPersonId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(cfg.listUrl)
      .then(({ data }) => setPeople(data[cfg.listKey] ?? []))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, [cfg.listUrl, cfg.listKey]);

  const person = useMemo(
    () => people.find((p) => p[cfg.idKey] === personId),
    [people, personId, cfg.idKey]
  );

  const choosePerson = (id: string) => {
    setPersonId(id);
    const chosen = people.find((p) => p[cfg.idKey] === id);
    // Default to the most recent booking with them.
    setBookingId(chosen?.bookings[0]?.bookingId ?? "");
    setError(null);
  };

  const submit = async () => {
    if (!personId || !bookingId) return setError(`Please choose a ${cfg.personLabel.toLowerCase()} and booking.`);
    if (!subject.trim()) return setError("Please add a subject.");
    if (!description.trim()) return setError("Please describe the issue.");

    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(cfg.submitUrl, {
        bookingId,
        [cfg.idKey]: personId,
        subject: subject.trim(),
        description: description.trim(),
      });
      onResult({
        ok: true,
        title: "Complaint submitted",
        message: data.message || "We've received your complaint and will respond within 24 hours.",
      });
      setPersonId("");
      setBookingId("");
      setSubject("");
      setDescription("");
    } catch (err: any) {
      onResult({
        ok: false,
        title: "Submission failed",
        message: typeof err?.message === "string" ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const field = "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (!loading && people.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        You can only file a complaint against someone you've booked.
        {role === "customer" ? " Once you book a worker, they'll appear here." : " Once a customer books you, they'll appear here."}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label htmlFor="complaint-person" className="mb-1.5 block text-xs font-semibold">{cfg.personLabel}</label>
        <select
          id="complaint-person"
          value={personId}
          disabled={loading}
          onChange={(e) => choosePerson(e.target.value)}
          className={field}
        >
          <option value="">{loading ? "Loading..." : `Select ${cfg.personLabel.toLowerCase()} `}</option>
          {people.map((p) => (
            <option key={p[cfg.idKey]} value={p[cfg.idKey]}>
              {p.fullName}
              {p.lastCategory ? ` — ${p.lastCategory}` : ""}
              {p.lastBookedAt ? `, last booked ${shortDate(p.lastBookedAt)}` : ""}
            </option>
          ))}
        </select>
      </div>

      {person && person.bookings.length > 1 && (
        <div>
          <label htmlFor="complaint-booking" className="mb-1.5 block text-xs font-semibold">Which booking?</label>
          <select id="complaint-booking" value={bookingId} onChange={(e) => setBookingId(e.target.value)} className={field}>
            {person.bookings.map((b) => (
              <option key={b.bookingId} value={b.bookingId}>
                {b.bookingId} • {b.category} • {b.date}{b.status ? ` (${b.status.replace("_", " ")})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {person && person.bookings.length === 1 && (
        <p className="text-xs text-muted-foreground">
          Booking {person.bookings[0].bookingId} • {person.bookings[0].category} • {person.bookings[0].date}
        </p>
      )}

      <div>
        <label htmlFor="complaint-subject" className="mb-1.5 block text-xs font-semibold">Subject</label>
        <input id="complaint-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="complaint-description" className="mb-1.5 block text-xs font-semibold">Describe the issue</label>
        <textarea
          id="complaint-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

      <Button onClick={submit} disabled={submitting || loading} className="h-11 w-full bg-primary hover:bg-primary-dark">
        {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        Submit complaint
      </Button>
    </div>
  );
}
