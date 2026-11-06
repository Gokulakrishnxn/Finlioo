import { createElement, type ReactNode } from "react";

export function SplitHeadline({
  children, className, as = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "p";
  delay?: number;
  stagger?: number;
}) {
  return createElement(as, { className }, children);
}
