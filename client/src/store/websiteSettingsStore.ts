import { create } from "zustand";
import { applyTheme, saveTheme, DEFAULT_THEME, type WebsiteTheme } from "@/lib/theme";

interface WebsiteSettingsState {
  websiteName: string;
  websiteLogo: string | null;
  theme: WebsiteTheme;
  loading: boolean;

  fetchSettings: () => Promise<void>;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const useWebsiteSettingsStore = create<WebsiteSettingsState>(
  (set) => ({
    websiteName: "HelpGhar",
    websiteLogo: null,
    theme: DEFAULT_THEME,
    loading: true,

    fetchSettings: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/admin/website-settings`
        );

        const data = await res.json();

        if (data.success) {
          const theme: WebsiteTheme = data.settings.theme || DEFAULT_THEME;

          // Server is the source of truth for the theme shown to every
          // visitor; sync it onto this device too so a subsequent reload
          // paints correctly even before this fetch resolves.
          applyTheme(theme);
          saveTheme(theme);

          set({
            websiteName:
              data.settings.website_name || "HelpGhar",

            websiteLogo: data.settings.website_logo || null,

            theme,

            loading: false,
          });
        } else {
          set({ loading: false });
        }
      } catch (err) {
        console.error(err);
        set({ loading: false });
      }
    },
  })
);