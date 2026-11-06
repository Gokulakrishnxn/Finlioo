"use client";

import { useCallback, type MouseEvent } from "react";

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Native scrolling keeps wheel, touch and anchor navigation immediate. */
export function useAnchorScroll() {
  return useCallback((event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: "start", behavior: "instant" });
    window.history.replaceState(null, "", href);
  }, []);
}
