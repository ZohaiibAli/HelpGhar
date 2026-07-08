import type { NavigateFunction } from "react-router-dom";
import type { User } from "@/types";

export function handleHireNowClick({
  user,
  token,
  navigate,
  workerId,
  onWorkerTriesToHire,
}: {
  user: User | null;
  token: string | null;
  navigate: NavigateFunction;
  workerId: string;
  onWorkerTriesToHire: () => void;
}) {
  const bookingPath = `/booking?workerId=${workerId}`;

  // Not logged in at all -> send to customer login
  if (!token || !user) {
    navigate(`/login/customer?redirect=${encodeURIComponent(bookingPath)}`);
    return;
  }

  // Logged in as worker -> show alert, don't navigate
  if (user.role === "worker") {
    onWorkerTriesToHire();
    return;
  }

  // Logged in as customer -> proceed to booking
  if (user.role === "customer") {
    navigate(bookingPath);
    return;
  }

  // Any other role (e.g. admin) -> not allowed to hire, send to customer login
  navigate(`/login/customer?redirect=${encodeURIComponent(bookingPath)}`);
}