import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { applyTheme, DEFAULT_THEME, saveTheme, WebsiteTheme } from "@/lib/theme";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const getFileAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "x-api-key": import.meta.env.VITE_API_KEY_ADMIN || "",
});

const swatches = ["#1E3A8A", "#2563EB", "#3B82F6", "#0EA5E9", "#7C3AED", "#0F766E", "#10B981"];

export function ThemeCustomizer() {
  const { t } = useTranslation();
  const [hue, setHue] = useState([DEFAULT_THEME.hue]);
  const [saturation, setSaturation] = useState([DEFAULT_THEME.saturation]);
  const [lightness, setLightness] = useState([DEFAULT_THEME.lightness]);
  const [radius, setRadius] = useState([DEFAULT_THEME.corner_radius]);
  const [isFetching, setIsFetching] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [saved, setSaved] = useState(false);

  const primary = `hsl(${hue[0]} ${saturation[0]}% ${lightness[0]}%)`;
  const primarySoft = `hsl(${hue[0]} ${saturation[0]}% 95%)`;
  const primaryFg = lightness[0] > 62 ? "#0f172a" : "#ffffff";

  const setFromTheme = (theme: WebsiteTheme) => {
    setHue([theme.hue]);
    setSaturation([theme.saturation]);
    setLightness([theme.lightness]);
    setRadius([theme.corner_radius]);
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
    setHue([Math.round(h * 360)]);
    setSaturation([Math.round(s * 100)]);
    setLightness([Math.round(l * 100)]);
  };

  // Load the theme currently saved on the backend (falls back to localStorage,
  // then to the built-in default) so the sliders reflect reality on mount.
  useEffect(() => {
    const fetchTheme = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`${API_BASE}/admin/get-website-settings`, {
          headers: getFileAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.settings?.theme) {
          setFromTheme(data.settings.theme);
          applyTheme(data.settings.theme);
          saveTheme(data.settings.theme);
          return;
        }
      } catch {
        // fall through to localStorage
      } finally {
        setIsFetching(false);
      }

      const cached = localStorage.getItem("website-theme");
      if (cached) {
        try {
          setFromTheme(JSON.parse(cached));
        } catch {
          /* ignore */
        }
      }
    };
    fetchTheme();
  }, []);

  // Keep in sync if another tab/component applies a theme
  useEffect(() => {
    const handler = (e: Event) => setFromTheme((e as CustomEvent).detail);
    window.addEventListener("theme-updated", handler);
    return () => window.removeEventListener("theme-updated", handler);
  }, []);

  const handleApply = async () => {
    setIsApplying(true);
    const theme: WebsiteTheme = {
      hue: hue[0],
      saturation: saturation[0],
      lightness: lightness[0],
      corner_radius: radius[0],
    };

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

        toast.success(t("adminSettings.toast.themeSaved", { defaultValue: "Theme updated" }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(data.message || t("adminSettings.toast.generic"));
      }
    } catch {
      toast.error(t("adminSettings.toast.generic"));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>{t("adminSettings.theme.title", { defaultValue: "Theme customization" })}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Quick palette</Label>
            <div className="flex gap-2">
              {swatches.map((c) => (
                <button
                  key={c}
                  onClick={() => pickSwatch(c)}
                  disabled={isFetching}
                  className="h-10 w-10 rounded-lg border-2 border-transparent ring-2 ring-transparent transition hover:ring-primary disabled:opacity-40"
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between"><Label>Hue</Label><Badge variant="secondary">{hue[0]}°</Badge></div>
            <Slider value={hue} onValueChange={setHue} min={0} max={360} step={1} disabled={isFetching} />
          </div>
          <div>
            <div className="mb-2 flex justify-between"><Label>Saturation</Label><Badge variant="secondary">{saturation[0]}%</Badge></div>
            <Slider value={saturation} onValueChange={setSaturation} min={0} max={100} step={1} disabled={isFetching} />
          </div>
          <div>
            <div className="mb-2 flex justify-between"><Label>Lightness</Label><Badge variant="secondary">{lightness[0]}%</Badge></div>
            <Slider value={lightness} onValueChange={setLightness} min={20} max={80} step={1} disabled={isFetching} />
          </div>
          <div>
            <div className="mb-2 flex justify-between"><Label>Corner radius</Label><Badge variant="secondary">{radius[0]}px</Badge></div>
            <Slider value={radius} onValueChange={setRadius} min={0} max={24} step={1} disabled={isFetching} />
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleApply}
              disabled={isApplying || isFetching}
              className="w-full"
              style={{ backgroundColor: primary, color: primaryFg }}
            >
              {isApplying ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Applying...
                </span>
              ) : "Apply theme"}
            </Button>
            {saved && (
              <span className="flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Theme applied successfully
              </span>
            )}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Live preview</Label>
          <div className="overflow-hidden border bg-background" style={{ borderRadius: radius[0] }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: primary, color: primaryFg }}>
              <div className="flex items-center gap-2 font-semibold">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-xs">H</div>
                HelpGhar
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="opacity-90">Dashboard</span>
                <span className="opacity-70">Bookings</span>
                <span className="opacity-70">Settings</span>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-3 gap-3">
                {[["Bookings", "128"], ["Workers", "42"], ["Rating", "4.8"]].map(([l, v]) => (
                  <div key={l} className="border p-3" style={{ borderRadius: radius[0], backgroundColor: primarySoft }}>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: primary }}>{l}</div>
                    <div className="mt-1 text-lg font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <div className="border p-3" style={{ borderRadius: radius[0] }}>
                <p className="text-sm font-semibold">Dummy section</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This preview shows how buttons, cards, and badges look across the site with the selected theme.
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: primary, color: primaryFg, borderRadius: radius[0] }}>
                    Primary action
                  </button>
                  <button className="border px-3 py-1.5 text-xs font-medium" style={{ color: primary, borderColor: primary, borderRadius: radius[0] }}>
                    Secondary
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-l-4 p-3" style={{ borderLeftColor: primary, backgroundColor: primarySoft, borderRadius: radius[0] }}>
                <span className="text-sm font-medium">Verified badge</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: primary, color: primaryFg, borderRadius: radius[0] }}>
                  NEW
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}