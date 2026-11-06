import AppRouter from "./Router";
import { useEffect } from "react";
import { useWebsiteSettingsStore } from "@/store/websiteSettingsStore";
import AuthWatcher from "@/components/AuthWatcher";
import { useChatConnection } from "@/hooks/useChatConnection";

export default function App() {
  const fetchSettings =
    useWebsiteSettingsStore((state) => state.fetchSettings);

  // Mounted at the root so the messaging socket (and the navbar's unread
  // badge with it) stays live on every page, not just the inbox.
  useChatConnection();

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <>
      <AuthWatcher />
      <AppRouter />
    </>
  );
}