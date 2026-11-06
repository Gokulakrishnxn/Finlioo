"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/landing-content";
import { useAnchorScroll } from "./smooth-scroll";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <Image
        src="/finlio-mark.png"
        alt=""
        width={1024}
        height={1024}
        priority
        className="size-7 mix-blend-multiply"
      />
      <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink">Finlio</span>
    </span>
  );
}

const APP_HOME = "/dashboard";

export function SiteNav() {
  const anchor = useAnchorScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();


  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 16));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const go = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    anchor(event, href);
  };

  const linkClass =
    "rounded-full px-3.5 py-2 text-[14px] font-medium text-body transition-colors hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-success/70"
      />

      <motion.header
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
        className="fixed inset-x-0 top-3 z-50 px-4 sm:px-6"
      >
        <nav
          aria-label="Finlio"
          className={`relative mx-auto flex max-w-[1120px] items-center gap-3 rounded-full border px-3 py-2 transition-all duration-300 sm:px-4 ${
            scrolled
              ? "border-line bg-card/88 shadow-[0_10px_30px_-14px_rgb(18_18_18/18%)] backdrop-blur-xl"
              : "border-line/60 bg-card/60 backdrop-blur-md"
          }`}
        >
          <Link
            href="/"
            aria-label="Finlio home"
            className="flex shrink-0 items-center gap-2 rounded-full px-1.5 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Wordmark className="flex items-center gap-2" />
          </Link>

          {/* Optically centered between the wordmark and the app button. */}
          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={(event) => go(event, link.href)} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href={APP_HOME}
              className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/88 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Open Finlio
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="grid size-11 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-cream/95 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex h-dvh overflow-y-auto max-w-[1120px] flex-col justify-between px-6 pb-10 pt-24">
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <a
                      href={link.href}
                      onClick={(event) => go(event, link.href)}
                      className="block border-b border-line/70 py-4 text-[28px] font-semibold tracking-[-0.03em] text-ink"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="flex flex-col gap-2.5">
                <Link
                  href={APP_HOME}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-[15px] font-medium text-primary-foreground"
                >
                  Open Finlio
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
