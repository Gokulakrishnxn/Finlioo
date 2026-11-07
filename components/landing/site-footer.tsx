"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FOOTER_COLUMNS } from "@/lib/landing-content";
import styles from "./lower-sections.module.css";

export function SiteFooter() {
  const footer = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footer.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-entered", "true");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    footer.current.querySelectorAll("[data-footer-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footer} className={`relative px-5 pb-8 pt-8 sm:px-8 ${styles.animatedFooter}`}>
      <div className={styles.closing} data-footer-reveal>
        <h2 className={styles.title}>Make room<br />for a clearer picture.</h2>
        <p>Your money, together at last.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          Get started
        </Link>
      </div>
      <div className={styles.footerBody}>
        <div className={styles.footerGrid}>
          <div data-footer-reveal>
            <Link
              href="/"
              aria-label="Finlio home"
              className="inline-flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Image src="/finlio-mark.png" alt="" width={1024} height={1024} className="size-7 mix-blend-multiply" />
              <span className="text-[20px] font-semibold tracking-[-0.03em] text-ink">Finlio</span>
            </Link>
            <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-muted-foreground">
              Your money, clearly understood.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] font-medium text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Get started
            </Link>
          </div>

          <nav aria-label="Footer" className={styles.footerLinks}>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} data-footer-reveal>
                <p className="text-[12px] font-medium text-ink">{column.title}</p>
                <ul className="mt-3 flex flex-col">
                  {column.links.map((link) => {
                    const external = link.href.startsWith("http");
                    const className =
                      "inline-flex min-h-10 items-center text-[13px] text-muted-foreground transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
                    return (
                      <li key={link.label}>
                        {external ? (
                          <a href={link.href} target="_blank" rel="noreferrer" className={className}>
                            {link.label}
                          </a>
                        ) : link.href.startsWith("#") ? (
                          <a href={link.href} className={className}>
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.footerBottom} data-footer-reveal>
          <p>© 2026 Finlio · Finlio is not a SEBI-registered adviser and does not give investment advice</p>
        </div>
      </div>
    </footer>
  );
}
