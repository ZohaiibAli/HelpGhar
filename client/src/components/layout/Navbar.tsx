import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/reviews", label: "Reviews" },
  { to: "/chat", label: "Chat" },
];

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const dashHref =
    user?.role === "admin" ? "/dashboard/admin"
      : user?.role === "worker" ? "/dashboard/worker"
        : "/dashboard/customer";
  const handleLogout = () => {
    const role = user?.role;

    logout();

    if (role === "worker") {
      navigate("/login/worker");
    } else if (role === "admin") {
      navigate("/login/admin");
    } else {
      navigate("/login/customer");
    }
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <span className="text-lg font-black">H</span>
          </div>
          <span className="text-xl font-black tracking-tight">
            Help<span className="text-primary">Ghar</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to} to={n.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm hover:bg-accent/40">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {(user.fullName ?? "U").charAt(0)}
                  </span>
                  <span className="pr-2 font-medium">{(user.fullName ?? "User").split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to={dashHref}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
              <Button asChild className="rounded-full bg-primary hover:bg-primary-dark">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-border"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to} to={n.to} onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <Link to={dashHref} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">Dashboard</Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-accent">Log out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Button asChild variant="outline" className="flex-1"><Link to="/login" onClick={() => setOpen(false)}>Login</Link></Button>
                <Button asChild className="flex-1 bg-primary hover:bg-primary-dark"><Link to="/register" onClick={() => setOpen(false)}>Register</Link></Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
