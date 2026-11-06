import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CreditCard,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

/**
 * Preview of the assistant at /chat.
 *
 * The version before this one was a looping scripted conversation staged to
 * look live, and its replies invented things the product doesn't do -- "12
 * min away" (no distance is tracked anywhere), "Standard cleaning ... 2.5
 * hrs, PKR 2,200" (there are no packages; every worker sets their own rate),
 * and a worker named Faisal R. who doesn't exist.
 *
 * Stripping it back to a plain box then went too far the other way: nothing
 * about it read as *chat*. So the transcript is back, because a chat mockup
 * is how you make a chat feature legible at a glance -- but it is labelled
 * as an example rather than animated to look live, and every answer in it is
 * one the assistant can actually give. The 5% fee, the refund-on-cancel
 * rule and the two-hour slots below are the real behaviour of
 * booking_route.py.
 */

const TRANSCRIPT: {
  role: "user" | "bot";
  text: string;
  icon?: typeof ShieldCheck;
}[] = [
  {
    role: "user",
    text: "What does CNIC verified actually mean?",
  },
  {
    role: "bot",
    icon: ShieldCheck,
    text: "It means an admin has reviewed that worker's CNIC and approved the account. Workers can't set the badge themselves — if you don't see it, they haven't been through the check yet.",
  },
  {
    role: "user",
    text: "And if I cancel after paying?",
  },
  {
    role: "bot",
    icon: CreditCard,
    text: "You can cancel while a booking is pending or confirmed, and the payment is refunded automatically. Once the worker has started the job it can't be cancelled — raise a dispute instead.",
  },
];

const SUGGESTED = [
  "How is the price calculated?",
  "What are the time slots?",
  "Can I reschedule a booking?",
  "How do reviews work?",
];

export function ChatbotTeaserSection() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");

  const ask = (question: string) => {
    const trimmed = question.trim();

    navigate(trimmed ? `/chat?q=${encodeURIComponent(trimmed)}` : "/chat");
  };

  return (
    <section id="chat" className="border-y border-border bg-card/40 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8">
        {/* ─────────── Left: what it is, and what to ask it ─────────── */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Built-in assistant
          </span>

          <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
            Not sure how something works? Ask.
          </h2>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            The assistant answers questions about the platform itself —
            verification, pricing, cancellations, refunds, disputes and how
            reviews work. For anything specific to one worker (their timings,
            whether they'll do a bigger job) message that worker directly;
            they'll answer better than we can.
          </p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Common questions
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => ask(question)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary-dark"
              >
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                {question}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/chat"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark"
            >
              <Bot className="h-4 w-4" />
              Open the assistant
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/services"
              className="inline-flex h-12 items-center rounded-xl border border-border px-6 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Browse workers instead
            </Link>
          </div>
        </div>

        {/* ─────────── Right: a chat window, so it reads as chat ─────────── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-card">
          <div className="flex items-center gap-2.5 border-b border-border bg-card px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">HelpGhar assistant</p>
              <p className="text-[11px] text-muted-foreground">
                Answers about bookings, payments and verification
              </p>
            </div>
            {/* Said plainly: this is a sample, not a live session. */}
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Example
            </span>
          </div>

          <div className="space-y-3 px-4 py-5">
            {TRANSCRIPT.map((line, index) => {
              const mine = line.role === "user";
              const Icon = line.icon;

              return (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                >
                  {!mine && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      {Icon ? <Icon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </span>
                  )}

                  <p
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-card text-foreground"
                    }`}
                  >
                    {line.text}
                  </p>

                  {mine && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* A working input, not a picture of one -- whatever is typed here
              opens the real assistant with the question already asked. */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask your own question…"
              aria-label="Ask the assistant"
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
            />
            <button
              type="submit"
              aria-label="Ask the assistant"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-dark"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
