import { useEffect, useRef, useState } from "react";
import { playgroundUseCases } from "../../infrastructure/factories/playground-module.factory";

/**
 * Provides the server's clock offset (ms) so any "now" computed in the UI reflects
 * the BACKEND's time rather than the client machine's local clock — per the
 * requirement that time-related displays must never trust the browser/OS clock.
 *
 * Usage: const { now } = useBackendClock(); // now() => corrected Date.now()
 */
export function useBackendClock() {
  const offsetRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    playgroundUseCases
      .getServerTime()
      .then((serverTime) => {
        if (cancelled) return;
        if (serverTime) {
          offsetRef.current = new Date(serverTime).getTime() - Date.now();
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    /** Corrected "now" timestamp (ms), based on the backend's clock. */
    now: () => Date.now() + offsetRef.current,
    /** Whether the offset has been fetched from the backend at least once. */
    ready,
    offsetRef,
  };
}
