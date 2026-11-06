import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { hasValidSession, loginPathForSession } from "@/lib/session";
import { useSessionExpiry } from "@/hooks/useSessionExpiry";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user } = useAuthStore();

  // Every logged-in page goes through here, so this is the one place the
  // proactive expiry watcher needs to be mounted.
  useSessionExpiry();

  // Resolved on the first render, while the token is still readable -- once it
  // is cleared there is nothing left to tell a worker from an admin.
  const loginPath = useRef(loginPathForSession());

  // Expiry is checked BEFORE the role: an expired admin token still carries
  // role "admin", so a role-only check renders the console on a dead session.
  if (!user || !hasValidSession()) {
    return <Navigate to={loginPath.current} replace />;
  }

  // Role check
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
