import { createElement, type ReactNode } from "react";

type Tag = "div" | "section" | "header" | "footer" | "article" | "li" | "span" | "p" | "h2" | "h3";

export type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait after the element enters the viewport. */
  delay?: number;
  /** Pixels of travel. Small enough to feel like settling, not sliding. */
  y?: number;
  as?: Tag;
};

/** Content renders immediately and remains readable without animation. */
export function Reveal({ children, className, as = "div" }: RevealProps) {
  return createElement(as, { className }, children);
}
