"use client";

import { MotionConfig } from "motion/react";

// Every Motion animation in the app follows the person's reduced-motion setting.
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
