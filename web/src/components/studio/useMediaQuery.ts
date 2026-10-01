"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * SSR-safe media query hook. `serverValue` is used on the server and during hydration
 * (so both renders match), then the real value takes over once mounted.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Tailwind `lg` breakpoint — where the desktop Inspector column appears. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/**
 * Tailwind `xl` breakpoint — below it the sidebar is forced collapsed (64px) so the
 * content + Inspector keep enough room on tablets. Defaults to true (expanded layout) until mounted.
 */
export function useIsWide(): boolean {
  return useMediaQuery("(min-width: 1280px)", true);
}
