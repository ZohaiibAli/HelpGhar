import type { NavigateFunction } from "react-router-dom";
import type { User } from "@/types";

/**
 * Deep link into the inbox that opens (creating it if needed) the thread with
 * a specific person. Mirrors `handleHireNowClick` in lib/hireNow.ts so both
 * call-to-actions on a worker's profile behave consistently.
 */
export function messagesPath(params: {
  worker?: string;
  customer?: string;
  booking?: string;
  thread?: string;
}): string {
  const query = new URLSearchParams();

  if (params.worker) query.set("worker", params.worker);
  if (params.customer) query.set("customer", params.customer);
  if (params.booking) query.set("booking", params.booking);
  if (params.thread) query.set("thread", params.thread);

  return `/messages?${query.toString()}`;
}

export function handleMessageWorkerClick({
  user,
  token,
  navigate,
  workerId,
  bookingId,
  onWorkerTriesToMessage,
}: {
  user: User | null;
  token: string | null;
  navigate: NavigateFunction;
  workerId: string;
  bookingId?: string;
  onWorkerTriesToMessage: () => void;
}) {
  const target = messagesPath({ worker: workerId, booking: bookingId });

  // Signed out -> sign in first, then land straight in the conversation.
  if (!token || !user) {
    navigate(`/login/customer?redirect=${encodeURIComponent(target)}`);
    return;
  }

  // A worker viewing another worker's profile can't open a customer thread
  // with them -- messaging pairs one customer with one worker.
  if (user.role === "worker") {
    onWorkerTriesToMessage();
    return;
  }

  if (user.role === "customer") {
    navigate(target);
    return;
  }

  navigate(`/login/customer?redirect=${encodeURIComponent(target)}`);
}
