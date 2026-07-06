import AppRouter from "./Router";
import { useEffect } from "react";
import { useWebsiteSettingsStore } from "@/store/websiteSettingsStore";

export default function App() {
  const fetchSettings =
    useWebsiteSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, []);
  return <AppRouter />;
}
