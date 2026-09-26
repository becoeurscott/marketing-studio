"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Honors the visitor's "reduce motion" OS setting for every Framer Motion animation on the page. */
export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
