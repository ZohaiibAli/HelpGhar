import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminItems } from "@/data/adminMenu";
import { Button } from "@/components/ui/button";
import { applyTheme, DEFAULT_THEME, saveTheme, WebsiteTheme } from "@/lib/theme";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "x-api-key": import.meta.env.VITE_API_KEY_ADMIN || "",
});

const getFileAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "x-api-key": import.meta.env.VITE_API_KEY_ADMIN || "",
});

const swatches = ["#1E3A8A", "#2563EB", "#3B82F6", "#0EA5E9", "#7C3AED", "#0F766E", "#10B981"];

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platformName: "HelpGhar",
    supportEmail: "support@helpghar.com",
    commissionRate: "8",
    autoApproveWorkers: false,
    maintenanceMode: false,
  });

  // ── Theme state ──────────────────────────────────────────────────────
  const [theme, setTheme] = useState<WebsiteTheme>(DEFAULT_THEME);
  const [isFetchingTheme, setIsFetchingTheme] = useState(true);
  const [isApplyingTheme, setIsApplyingTheme] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      setIsFetchingTheme(true);
      try {
        const res = await fetch(`${API_BASE}/admin/get-website-settings`, {
          headers: getFileAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.settings?.theme) {
          setTheme(data.settings.theme);
          applyTheme(data.settings.theme);
          saveTheme(data.settings.theme);
          return;
        }
      } catch {
        // fall back to whatever's cached locally
      } finally {
        setIsFetchingTheme(false);
      }

      const cached = localStorage.getItem("website-theme");
      if (cached) {
        try {
          setTheme(JSON.parse(cached));
        } catch {
          /* ignore */
        }
      }
    };
    fetchTheme();
  }, []);

  const updateThemeField = (field: keyof WebsiteTheme, value: number) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
  };

  const pickSwatch = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    setTheme({
      hue: Math.round(h * 360),
      saturation: Math.round(s * 100),
      lightness: Math.round(l * 100),
      corner_radius: theme.corner_radius,
    });
  };

  const handleApplyTheme = async () => {
    setIsApplyingTheme(true);
    try {
      const formData = new FormData();
      formData.append("hue", String(theme.hue));
      formData.append("saturation", String(theme.saturation));
      formData.append("lightness", String(theme.lightness));
      formData.append("corner_radius", String(theme.corner_radius));

      const res = await fetch(`${API_BASE}/admin/update-website-settings`, {
        method: "PUT",
        headers: getFileAuthHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        applyTheme(theme);
        saveTheme(theme);
        window.dispatchEvent(new CustomEvent("theme-updated", { detail: theme }));
        setThemeSaved(true);
        setTimeout(() => setThemeSaved(false), 3000);
      }
    } finally {
      setIsApplyingTheme(false);
    }
  };

  const previewPrimary = `hsl(${theme.hue} ${theme.saturation}% ${theme.lightness}%)`;
  const previewSoft = `hsl(${theme.hue} ${theme.saturation}% 95%)`;
  const previewFg = theme.lightness > 62 ? "#0f172a" : "#ffffff";

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardLayout title="Admin" items={adminItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure platform-wide preferences.</p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-primary-dark" />
            <p className="text-sm font-semibold text-primary-dark">Settings saved successfully.</p>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">General</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Platform name
              <input
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Support email
              <input
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Commission rate (%)
              <input
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-base font-bold">Platform controls</h2>
          <div className="mt-4 space-y-4">
            <ToggleRow
              label="Auto-approve new workers"
              description="Skip manual CNIC review for new worker sign-ups."
              checked={form.autoApproveWorkers}
              onChange={(v) => setForm({ ...form, autoApproveWorkers: v })}
            />
            <ToggleRow
              label="Maintenance mode"
              description="Temporarily disable new bookings platform-wide."
              checked={form.maintenanceMode}
              onChange={(v) => setForm({ ...form, maintenanceMode: v })}
            />
          </div>
        </div>

        {/* ── Website theme ── */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Website theme</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Changes here update the live site colors for every visitor.
              </p>
            </div>
            {isFetchingTheme && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="mt-5 grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Quick palette</p>
                <div className="mt-2 flex gap-2">
                  {swatches.map((c) => (
                    <button
                      key={c}
                      onClick={() => pickSwatch(c)}
                      disabled={isFetchingTheme}
                      className="h-9 w-9 rounded-xl border-2 border-transparent ring-2 ring-transparent transition hover:ring-primary disabled:opacity-40"
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              <SliderRow
                label="Hue"
                value={theme.hue}
                unit="°"
                min={0}
                max={360}
                disabled={isFetchingTheme}
                onChange={(v) => updateThemeField("hue", v)}
              />
              <SliderRow
                label="Saturation"
                value={theme.saturation}
                unit="%"
                min={0}
                max={100}
                disabled={isFetchingTheme}
                onChange={(v) => updateThemeField("saturation", v)}
              />
              <SliderRow
                label="Lightness"
                value={theme.lightness}
                unit="%"
                min={20}
                max={80}
                disabled={isFetchingTheme}
                onChange={(v) => updateThemeField("lightness", v)}
              />
              <SliderRow
                label="Corner radius"
                value={theme.corner_radius}
                unit="px"
                min={0}
                max={24}
                disabled={isFetchingTheme}
                onChange={(v) => updateThemeField("corner_radius", v)}
              />

              <div className="flex items-center gap-3 pt-1">
                <Button
                  className="rounded-xl"
                  style={{ backgroundColor: previewPrimary, color: previewFg }}
                  onClick={handleApplyTheme}
                  disabled={isApplyingTheme || isFetchingTheme}
                >
                  {isApplyingTheme ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Applying...
                    </span>
                  ) : (
                    "Apply theme"
                  )}
                </Button>
                {themeSaved && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-dark">
                    <CheckCircle2 className="h-4 w-4" /> Theme applied
                  </span>
                )}
              </div>
            </div>

            {/* Live preview */}
            <div className="overflow-hidden rounded-3xl border border-border" style={{ borderRadius: theme.corner_radius }}>
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: previewPrimary, color: previewFg }}
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-xs">H</div>
                  HelpGhar
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="opacity-90">Dashboard</span>
                  <span className="opacity-70">Bookings</span>
                  <span className="opacity-70">Settings</span>
                </div>
              </div>

              <div className="space-y-3 bg-background p-4">
                <div className="grid grid-cols-3 gap-2">
                  {[["Bookings", "128"], ["Workers", "42"], ["Rating", "4.8"]].map(([l, v]) => (
                    <div
                      key={l}
                      className="border border-border p-3"
                      style={{ borderRadius: theme.corner_radius, backgroundColor: previewSoft }}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: previewPrimary }}>
                        {l}
                      </div>
                      <div className="mt-1 text-lg font-black">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 text-xs font-bold"
                    style={{ backgroundColor: previewPrimary, color: previewFg, borderRadius: theme.corner_radius }}
                  >
                    Primary action
                  </button>
                  <button
                    className="border px-3 py-1.5 text-xs font-bold"
                    style={{ color: previewPrimary, borderColor: previewPrimary, borderRadius: theme.corner_radius }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button className="rounded-xl bg-primary hover:bg-primary-dark" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function SliderRow({
  label,
  value,
  unit,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground">{label}</label>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary disabled:opacity-40"
      />
    </div>
  );
}