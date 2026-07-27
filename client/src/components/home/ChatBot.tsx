import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  Send,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessageCircle,
  Star,
} from "lucide-react";

/**
 * Scripted preview conversation. Purely presentational — this is the "trailer",
 * not the real chat. Loops on an interval so the section feels alive without
 * requiring the visitor to do anything.
 */
const SCRIPT: { role: "user" | "bot"; text: string }[] = [
  { role: "user", text: "I need a verified electrician in Karachi tonight" },
  {
    role: "bot",
    text: "Found 6 CNIC-verified electricians near you with open slots tonight. Top match: Faisal R. — 4.9★, 3 yrs exp, 12 min away.",
  },
  { role: "user", text: "What's included in the cleaning package?" },
  {
    role: "bot",
    text: "Standard cleaning covers kitchen, bathrooms, living areas & dusting — 2.5 hrs, PKR 2,200. Deep cleaning adds appliances & windows.",
  },
];

const SUGGESTED_PROMPTS = [
  "Find a driver near me",
  "Compare tutor rates",
  "How does verification work?",
];

export function ChatbotTeaserSection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setTyping(true);
    const typingTimer = setTimeout(() => setTyping(false), 900);
    const advanceTimer = setTimeout(() => {
      setStep((s) => (s + 1) % SCRIPT.length);
    }, 2600);
    return () => {
      clearTimeout(typingTimer);
      clearTimeout(advanceTimer);
    };
  }, [step]);

  const visible = SCRIPT.slice(0, step + 1);

  function goToChat(prefill?: string) {
    navigate(prefill ? `/chat?q=${encodeURIComponent(prefill)}` : "/chat");
  }

  return (
    <section id="chat" className="relative overflow-hidden border-y border-border/70 bg-card/60">
      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-10 lg:px-8">
        {/* ─── LEFT: copy + CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI Concierge
          </span>

          <h2 className="font-display mt-6 text-3xl font-semibold leading-[1.1] tracking-tight md:text-[2.75rem]">
            Don't search.
            <br />
            <span className="italic text-primary">Just ask.</span>
          </h2>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Our assistant knows every verified pro on the platform —{" "}
            <span className="font-medium text-foreground">
              availability, ratings, pricing, and reviews
            </span>
            . Describe what you need in plain words and get a matched worker
            in seconds.
          </p>

          {/* Suggested prompts */}
          <div className="mt-7 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <motion.button
                key={prompt}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.07 }}
                onClick={() => goToChat(prompt)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary-dark hover:shadow-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                {prompt}
              </motion.button>
            ))}
          </div>

          {/* Mini input bar that redirects on submit */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onSubmit={(e) => {
              e.preventDefault();
              goToChat(inputValue || undefined);
            }}
            className="mt-8 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/90 p-2 shadow-card backdrop-blur-md transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-lift focus-within:ring-4 focus-within:ring-primary/5"
          >
            <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3">
              <Bot className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about our services…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              type="submit"
              className="group/btn inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary-dark hover:shadow-lg active:scale-[0.97]"
            >
              Chat now
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          </motion.form>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <ShieldCheck className="h-3 w-3 text-primary/60" />
              Grounded in verified worker data
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <Zap className="h-3 w-3 text-primary/60" />
              Instant answers, 24/7
            </span>
          </div>
        </motion.div>

        {/* ─── RIGHT: live-looking chat preview card ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center"
        >
          <Link
            to="/chat"
            className="group relative block w-full overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-lift backdrop-blur-md transition-transform hover:-translate-y-1"
          >
            {/* Header bar */}
            <div className="flex items-center gap-3 border-b border-border/50 bg-primary px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Bot className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-primary-foreground">
                  HelpGhar Assistant
                </p>
                <p className="flex items-center gap-1 text-[11px] text-primary-foreground/70">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  Online now
                </p>
              </div>
              <span className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90">
                Live preview
              </span>
            </div>

            {/* Message scroll area */}
            <div className="flex h-[360px] flex-col justify-end gap-3 overflow-hidden p-5">
              <AnimatePresence initial={false}>
                {visible.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm border border-border/60 bg-accent/40 text-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border/60 bg-accent/40 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: d * 0.15,
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Fake, disabled input footer — hints "click to open real chat" */}
            <div className="flex items-center gap-2 border-t border-border/50 bg-accent/20 px-5 py-4">
              <div className="flex h-10 flex-1 items-center rounded-xl border border-border/60 bg-card/80 px-3.5 text-[13px] text-muted-foreground/60">
                Type your message…
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
                <Send className="h-4 w-4" />
              </span>
            </div>

            {/* Hover overlay CTA */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 backdrop-blur-0 transition-all duration-300 group-hover:bg-background/60 group-hover:opacity-100 group-hover:backdrop-blur-[2px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift">
                Open full chat
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Floating rating chip */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 -top-5 z-20 flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow-card backdrop-blur-lg"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-foreground">
              4.9/5 assistant rating
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}