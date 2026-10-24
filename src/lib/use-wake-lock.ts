import { useEffect } from "react";

/**
 * Keep the screen on while `enabled`. The browser drops the lock whenever the
 * tab is hidden, so it is re-requested each time the page becomes visible.
 * No-op where the Screen Wake Lock API is unavailable.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible" || (sentinel && !sentinel.released)) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) lock.release().catch(() => {});
        else sentinel = lock;
      } catch {
        // Denied (battery saver, permissions policy) — the screen just sleeps as usual.
      }
    };

    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      sentinel?.release().catch(() => {});
    };
  }, [enabled]);
}
