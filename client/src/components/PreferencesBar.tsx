import { useEffect, useRef, useState } from "react";
import { Check, Globe, Moon, Sun } from "lucide-react";
import { LANGUAGES, setLang, useLang, type Lang } from "@/i18n/engine";
import { reapplyTheme } from "@/lib/theme";

const MODE_KEY = "hg-color-mode";

export type ColorMode = "light" | "dark";

export function readMode(): ColorMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage blocked */
  }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyMode(mode: ColorMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
  reapplyTheme();
}

/**
 * Language + light/dark switcher, rendered inside the Navbar so customers,
 * workers and admins (and signed-out visitors) all get it.
 */
export function PreferencesControls() {
  const lang = useLang();
  const [mode, setMode] = useState<ColorMode>(readMode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggleMode = () => {
    const next: ColorMode = mode === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* storage blocked */
    }
    setMode(next);
  };

  const pick = (id: Lang) => {
    setLang(id);
    setOpen(false);
  };

  const current = LANGUAGES.find((l) => l.id === lang)!;

  return (
    <div
      ref={ref}
      translate="no"
      className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
      dir="ltr"
    >
      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={mode === "dark" ? "Light mode" : "Dark mode"}
        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Language"
          className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          {current.short}
        </button>

        {open && (
          <ul
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-card"
          >
            {LANGUAGES.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={l.id === lang}
                  onClick={() => pick(l.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-accent ${
                    l.id === lang ? "text-primary" : "text-foreground"
                  }`}
                >
                  {l.label}
                  {l.id === lang && <Check className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
