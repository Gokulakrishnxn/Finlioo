"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { FAQS } from "@/lib/landing-content";
import { motionTransitions } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import styles from "./lower-sections.module.css";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 px-5 sm:px-8">
      <div className={cn(styles.faq, "grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16")}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal className="eyebrow">FAQ</Reveal>
          <Reveal delay={0.05} as="h2" className={styles.title}>
            Good questions.
          </Reveal>
          <Reveal delay={0.1} className="mt-4 max-w-[380px] text-[15px] leading-[1.65] text-body">
            A few things to know before you begin.
          </Reveal>
          <Reveal delay={0.14} className="mt-5">
            <a
              href="/terms"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Read the Terms
            </a>
          </Reveal>
        </div>

        <ul className={styles.faqList}>
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <li key={item.q} className={styles.faqItem}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  id={`faq-button-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <span className="text-[15.5px] font-medium leading-snug tracking-[-0.01em] text-ink">{item.q}</span>
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
                      isOpen ? "border-success/30 bg-success-soft text-success" : "border-line text-muted-foreground",
                    )}
                  >
                    <Plus
                      className={cn("size-3.5 transition-transform duration-300", isOpen && "rotate-45")}
                      strokeWidth={2.2}
                    />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="panel"
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-button-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={motionTransitions.springGentle}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[62ch] pb-5 pr-8 text-[14.5px] leading-[1.68] text-body">{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
