// this is DashboardLayout.tsx

import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Navbar } from "./Navbar";

export interface DashSidebarItem { label: string; to: string; icon: LucideIcon }

export function DashboardLayout({
  title, items, children,
}: {
  title: string;
  items: DashSidebarItem[];
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
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
                    key={it.to + it.label} to={it.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
