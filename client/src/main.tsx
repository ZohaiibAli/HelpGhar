import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./styles.css";

import "./i18n/rtl-dark.css";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { initI18n } from "@/i18n/engine";
import { applyMode, readMode } from "@/components/PreferencesBar";

applyMode(readMode());

const savedTheme = getStoredTheme();
if (savedTheme) {
  applyTheme(savedTheme);
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

// After the first render so the DOM exists; the observer keeps it translated.
initI18n();