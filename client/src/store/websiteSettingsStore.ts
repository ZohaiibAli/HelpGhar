import { create } from "zustand";

interface WebsiteSettingsState {
  websiteName: string;
  websiteLogo: string | null;
  loading: boolean;

  fetchSettings: () => Promise<void>;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const useWebsiteSettingsStore = create<WebsiteSettingsState>(
  (set) => ({
    websiteName: "HelpGhar",
    websiteLogo: null,
    loading: true,

    fetchSettings: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/admin/website-settings`
        );

        const data = await res.json();

        if (data.success) {
          set({
            websiteName:
              data.settings.website_name || "HelpGhar",

            websiteLogo: data.settings.website_logo || null,

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