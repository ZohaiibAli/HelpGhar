import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Home, Wrench, Zap, Sparkles, ShieldCheck, User } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import CustomerLoginForm from "@/pages/Customer_login";
import WorkerLoginForm from "@/pages/Worker_login";
import AdminLoginForm from "@/pages/Admin_login";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["customer", "worker", "admin"];

function isValidRole(r: string | undefined): r is UserRole {
  return ROLES.includes(r as UserRole);
}

type RoleConfig = {
  accent: string;
  accentSoft: string;
  eyebrow: string;
  tabIcon: typeof User;
  headline: [string, string];
  sub: string;
  stats: { value: string; label: string }[];
};

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  customer: {
    accent: "#0EA5A0",
    accentSoft: "#E4F7F5",
    eyebrow: "Customer Portal",
    tabIcon: User,
    headline: ["Book trusted", "home services."],
    sub: "Browse workers, schedule bookings, and manage your home services.",
    stats: [
      { value: "12k+", label: "Jobs completed" },
      { value: "4.9★", label: "Avg. rating" },
    ],
  },
  worker: {
    accent: "#F2A93B",
    accentSoft: "#FDF1DD",
    eyebrow: "Worker Portal",
    tabIcon: Wrench,
    headline: ["Manage your", "jobs & earnings."],
    sub: "View requests, track jobs and manage your earnings.",
    stats: [
      { value: "500+", label: "Verified pros" },
      { value: "Rs 2.1M", label: "Paid last month" },
    ],
  },
  admin: {
    accent: "#6366F1",
    accentSoft: "#EAEAFD",
    eyebrow: "Admin Portal",
    tabIcon: ShieldCheck,
    headline: ["Platform", "control center."],
    sub: "Manage users, reports and platform settings.",
    stats: [
      { value: "24/7", label: "Monitoring" },
      { value: "99.9%", label: "Uptime" },
    ],
  },
};

export default function LoginPage() {
  const { role } = useParams<{ role?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isValidRole(role)) {
      navigate("/login/customer", { replace: true });
    }
  }, [role, navigate]);

  const activeRole: UserRole = isValidRole(role) ? role : "customer";
  const config = ROLE_CONFIG[activeRole];

  return (
    <MainLayout>
      <style>{`
        @keyframes hg-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes hg-counter-orbit { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .hg-orbit-ring { animation: hg-orbit 22s linear infinite; }
        .hg-orbit-icon { animation: hg-counter-orbit 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hg-orbit-ring, .hg-orbit-icon { animation: none; }
        }
      `}</style>

      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-stretch gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left Side — Hero */}
        <div className="hidden lg:block">
          <div
            className="relative h-full overflow-hidden rounded-3xl p-10 shadow-2xl"
            style={{
              backgroundColor: "#101a2b",
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          >
            {/* accent glow */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl transition-colors duration-500"
              style={{ backgroundColor: config.accent, opacity: 0.25 }}
            />

            <span
              className="relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500"
              style={{ backgroundColor: config.accentSoft, color: config.accent }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: config.accent }}
              />
              {config.eyebrow}
            </span>

            <h2 className="relative mt-5 text-4xl font-black leading-tight tracking-tight text-white">
              {config.headline[0]}
              <br />
              {config.headline[1]}
            </h2>

            <p className="relative mt-3 max-w-md text-sm text-slate-300">
              {config.sub}
            </p>

            {/* Signature: orbiting service icons around the home */}
            <div className="relative mx-auto mt-10 flex h-64 items-center justify-center">
              <div className="hg-orbit-ring relative h-56 w-56 rounded-full border border-dashed border-white/15">
                {[Wrench, Zap, Sparkles].map((Icon, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 h-10 w-10"
                    style={{
                      transform: `rotate(${i * 120}deg) translate(108px) rotate(-${i * 120}deg)`,
                    }}
                  >
                    <div className="hg-orbit-icon flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="absolute flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg transition-colors duration-500"
                style={{ backgroundColor: config.accent }}
              >
                <Home className="h-9 w-9 text-white" />
              </div>
            </div>

            {/* Stats row */}
            <div className="relative mt-6 flex gap-6 border-t border-white/10 pt-6">
              {config.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side — Form */}
        <div className="mx-auto flex w-full max-w-md flex-col">
          {/* Mobile-only role badge (hero is hidden below lg) */}
          <span
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] lg:hidden"
            style={{ backgroundColor: config.accentSoft, color: config.accent }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.accent }} />
            {config.eyebrow}
          </span>

          {/* Tabs */}
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
              {ROLES.map((r) => {
                const isActive = activeRole === r;
                const TabIcon = ROLE_CONFIG[r].tabIcon;
                return (
                  <Link
                    key={r}
                    to={`/login/${r}`}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-center text-sm font-semibold capitalize transition-all ${
                      isActive ? "shadow-soft text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={isActive ? { backgroundColor: ROLE_CONFIG[r].accent } : undefined}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {r}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Form card */}
          {/* Form card */}
          <div className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-[28px] border border-black/5 bg-card p-8 shadow-[0_20px_60px_-15px_rgba(20,36,51,0.25)] sm:p-10">
            <div
              className="absolute inset-x-0 top-0 h-1 transition-colors duration-500"
              style={{ backgroundColor: config.accent }}
            />
            {activeRole === "customer" && <CustomerLoginForm />}
            {activeRole === "worker" && <WorkerLoginForm />}
            {activeRole === "admin" && <AdminLoginForm />}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}