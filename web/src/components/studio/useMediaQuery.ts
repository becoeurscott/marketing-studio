"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** SSR-safe media query hook (false on the server / first render). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind `lg` breakpoint — where the desktop Inspector column appears. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
