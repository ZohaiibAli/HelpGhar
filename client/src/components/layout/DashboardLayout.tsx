// components/layout/DashboardLayout.tsx

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Navbar } from "./Navbar";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { hasValidSession, loginPathForSession } from "@/lib/session";

export interface DashSidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export function DashboardLayout({
  title,
  items,
  children,
}: {
  title: string;
  items: DashSidebarItem[];
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const unreadMessages = useChatStore((state) => state.unreadTotal);

  // Expiry counts as "not logged in" here too, and a worker/admin gets sent to
  // their own login rather than the customer one.
  const signedIn = !!user && hasValidSession();

  useEffect(() => {
    if (!signedIn) {
      navigate(loginPathForSession(), { replace: true });
    }
  }, [signedIn, navigate]);

  if (!signedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        {/* ===== SIDEBAR — hidden on mobile, visible on md+ =====
            Must match Navbar's md:hidden hamburger breakpoint exactly.
            This used to be lg: while the hamburger disappeared at md:,
            leaving a dead zone at tablet widths (768-1023px) where
            neither the hamburger nor the sidebar was reachable --
            My Bookings/Transactions/Reviews/Disputes/Settings had no
            way to be navigated to at all in that range. */}
        <aside className="hidden md:sticky md:top-24 md:self-start md:block">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <nav className="mt-1 space-y-1">
              {items.map((it) => {
                const active = pathname === it.to;
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to + it.label}
                    to={it.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                    {it.to === "/messages" && unreadMessages > 0 && (
                      <span
                        className={`ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${
                          active
                            ? "bg-primary-foreground text-primary"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}