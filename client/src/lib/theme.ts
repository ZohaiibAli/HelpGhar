/**
 * Website theme engine.
 *
 * The site's styles.css defines its base palette with oklch(), but CSS custom
 * properties don't care which color function set them — every component
 * reads through var(--primary), var(--ring), etc. So at runtime we can
 * override those variables with plain hsl() strings and the whole app
 * (buttons, badges, focus rings, sidebar, charts...) follows automatically.
 */

export interface WebsiteTheme {
  hue: number; // 0-360
  saturation: number; // 0-100
  lightness: number; // 20-80 (kept inside a safe contrast range)
  corner_radius: number; // px
}

export const DEFAULT_THEME: WebsiteTheme = {
  hue: 162,
  saturation: 55,
  lightness: 55,
  corner_radius: 14,
};

const STORAGE_KEY = "website-theme";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%)`;
}

/**
 * Derives every theme-dependent CSS variable from the four base sliders
 * and writes them onto :root (document.documentElement).
 */
export function applyTheme(theme: WebsiteTheme) {
  if (typeof document === "undefined") return; // SSR guard

  const { hue, saturation, lightness, corner_radius } = theme;

  const primary = hsl(hue, saturation, lightness);
  const primaryDark = hsl(hue, saturation, lightness - 12);
  const primarySoft = hsl(hue, clamp(saturation - 30, 15, 100), 95);
  const primaryForeground = lightness > 62 ? "oklch(0.205 0.024 264)" : "#ffffff";
  const accentForeground = hsl(hue, clamp(saturation - 10, 15, 100), 28);
  const ring = primary;

  const root = document.documentElement.style;

  root.setProperty("--primary", primary);
  root.setProperty("--primary-dark", primaryDark);
  root.setProperty("--primary-soft", primarySoft);
  root.setProperty("--primary-foreground", primaryForeground);

  root.setProperty("--accent", primarySoft);
  root.setProperty("--accent-foreground", accentForeground);

  root.setProperty("--ring", ring);

  root.setProperty("--sidebar-primary", primary);
  root.setProperty("--sidebar-primary-foreground", primaryForeground);
  root.setProperty("--sidebar-accent", primarySoft);
  root.setProperty("--sidebar-accent-foreground", accentForeground);
  root.setProperty("--sidebar-ring", ring);

  // Keep the "brand" chart series and success color in sync with primary too
  root.setProperty("--chart-1", primary);
  root.setProperty("--success", primary);

  root.setProperty("--radius", `${corner_radius}px`);
}

export function getStoredTheme(): WebsiteTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      hue: Number(parsed.hue),
      saturation: Number(parsed.saturation),
      lightness: Number(parsed.lightness),
      corner_radius: Number(parsed.corner_radius),
    };
  } catch {
    return null;
  }
}

export function saveTheme(theme: WebsiteTheme) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}