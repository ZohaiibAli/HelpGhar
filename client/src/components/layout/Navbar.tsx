// components/layout/Navbar.tsx

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Home,
  Calendar,
  CreditCard,
  Star,
  MessageSquareWarning,
  Settings,
  Wrench,
  MessageCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { logout as endSession, loginPathForSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { useWebsiteSettingsStore } from "@/store/websiteSettingsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { customerItems } from "@/data/customerMenu";
import { adminItems } from "@/data/adminMenu";
import { workerItems } from "@/data/workerMenu";

const NAV = [
  { to: "/#home", label: "Home", icon: Home },
  { to: "/#services", label: "Services", icon: Wrench },
  { to: "/#reviews", label: "Reviews", icon: Star },
  { to: "/#chat", label: "Chat", icon: MessageCircle },
];

const CUSTOMER_DASHBOARD_ROUTES = [
  "/dashboard/customer",
  "/my-bookings",
  "/transactions",
  "/reviews",
  "/disputes",
  "/profile",
  "/settings",
];

function isOnDashboard(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/worker/") ||
    CUSTOMER_DASHBOARD_ROUTES.includes(pathname)
  );
}

export function Navbar() {
  const { websiteLogo, websiteName, loading } = useWebsiteSettingsStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  const onDashboard = isOnDashboard(pathname);

  const dashboardItems =
    user?.role === "admin"
      ? adminItems
      : user?.role === "worker"
        ? workerItems
        : customerItems;

  const dashHref =
    user?.role === "admin"
      ? "/dashboard/admin"
      : user?.role === "worker"
        ? "/dashboard/worker"
        : "/dashboard/customer";
  const profileHref =
    user?.role === "admin"
      ? "/dashboard/admin/profile"
      : user?.role === "worker"
        ? "/worker/profile"
        : "/profile";

  const handleLogout = () => {
    // Login page is resolved before the token is cleared; "manual" leaves no
    // notice behind, so a deliberate sign-out arrives without an explanation.
    const loginPath = loginPathForSession();
    endSession("manual", { redirect: false });
    navigate(loginPath);
  };

  const closeMobile = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          {!loading && websiteLogo && (
            <img
              src={websiteLogo}
              alt="Logo"
              className="h-10 w-10 rounded-xl object-contain"
            />
          )}
          {!loading && (
            <span className="text-xl font-black">{websiteName}</span>
          )}
        </Link>

        {/* Desktop nav — only on landing page */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active =
                n.to === "/" ? pathname === "/" && !hash : pathname + hash === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm hover:bg-accent/40">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {(user.fullName ?? "U").charAt(0)}
                  </span>
                  <span className="pr-2 font-medium">
                    {(user.fullName ?? "User").split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={dashHref}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={profileHref}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full bg-primary hover:bg-primary-dark">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-border"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ===== MOBILE MENU ===== */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {onDashboard ? (
              /* ---------- ON DASHBOARD ---------- */
              <>
                <Link
                  to="/"
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  <Home className="h-5 w-5 text-muted-foreground" />
                  Home
                </Link>

                <div className="my-2 h-px bg-border" />

                {dashboardItems.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-2 h-px bg-border" />

                <button
                  onClick={() => {
                    handleLogout();
                    closeMobile();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </button>
              </>
            ) : (
              /* ---------- ON LANDING ---------- */
              <>
                {user && (
                  <Link
                    to={dashHref}
                    onClick={closeMobile}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                    Dashboard
                  </Link>
                )}

                <div className="my-2 h-px bg-border" />

                {NAV.map((n) => {
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={closeMobile}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      {n.label}
                    </Link>
                  );
                })}

                <div className="my-2 h-px bg-border" />

                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobile();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Log out
                  </button>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/login" onClick={closeMobile}>
                        Login
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="flex-1 bg-primary hover:bg-primary-dark"
                    >
                      <Link to="/register" onClick={closeMobile}>
                        Register
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}