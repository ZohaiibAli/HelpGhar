import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";

/**
 * Tracks in-flight API calls (see services/api.ts) so every page -- customer,
 * worker and admin -- shows a loader while it is fetching, without each page
 * needing its own spinner state.
 */
let pending = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const loadingTracker = {
  start() {
    pending += 1;
    emit();
  },
  end() {
    pending = Math.max(0, pending - 1);
    emit();
  },
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function GlobalLoader() {
  const busy = useSyncExternalStore(
    subscribe,
    () => pending > 0,
    () => false,
  );

  if (!busy) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/15"
        role="progressbar"
        aria-label="Loading"
        translate="no"
      >
        <div className="hg-loader-bar h-full w-1/3 rounded-full bg-primary" />
      </div>
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] grid h-10 w-10 place-items-center rounded-full border border-border bg-card shadow-card"
        translate="no"
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </>
  );
}
