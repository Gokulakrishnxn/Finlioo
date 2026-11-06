"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { DigitSwap } from "@/components/motion/digit-swap";
import { motionTransitions } from "@/lib/motion-tokens";
import { CURRENCY, PLANS, PRICING_NOTE, price, type Billing } from "@/lib/landing-pricing";
import { usePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import styles from "./lower-sections.module.css";

const BILLING: { id: Billing; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export function Pricing() {
  const { landing } = usePreferences();
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section id="pricing" className={styles.pricing}>
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mx-auto max-w-[640px] text-center">
          <Reveal className="eyebrow">Pricing</Reveal>
          <Reveal delay={0.05} as="h2" className={styles.title}>
            Clarity starts free.
          </Reveal>
          <Reveal delay={0.1} className="mt-4 text-[16px] leading-[1.65] text-body">
            Choose Pro for daily insights. Max adds your preferred AI.
          </Reveal>

          <Reveal delay={0.14} className="mt-7 flex justify-center">
            <div
              role="group"
              aria-label="Billing period"
              className="flex items-center gap-1 rounded-full border border-line bg-secondary p-1"
            >
              {BILLING.map((option) => {
                const active = billing === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setBilling(option.id)}
                    className={cn(
                      "relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="billing-thumb"
                        aria-hidden
                        transition={motionTransitions.springMorph}
                        className="absolute inset-0 rounded-full bg-card shadow-[0_1px_2px_rgb(0_0_0/25%)]"
                      />
                    ) : null}
                    <span className="relative">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map((plan, index) => {
            const amount = price(plan, billing);
            const saving = plan.monthly !== null && plan.yearly !== null ? plan.monthly * 12 - plan.yearly : 0;
            return (
              <Reveal key={plan.id} delay={0.06 + index * 0.06} className="h-full">
                <div
                  className={cn(
                    "flex flex-col",
                    styles.plan,
                    plan.featured && styles.proPlan,
                    plan.id === "max" && styles.maxPlan,
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{plan.name}</h3>
                    {plan.featured ? (
                      <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10.5px] font-medium text-success">
                        The full brief
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-muted-foreground">{plan.tagline}</p>

                  {amount === null ? (
                    <div className="mt-6 flex min-h-[46px] items-center text-[26px] font-medium tracking-[-0.03em]">
                      Coming soon
                    </div>
                  ) : (
                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="pb-1.5 text-[20px] font-medium text-foreground">{CURRENCY}</span>
                    <DigitSwap
                      value={amount}
                      suffixLength={0}
                      className="nums text-[46px] font-semibold leading-none tracking-[-0.04em] text-foreground"
                    />
                    <span className="pb-1.5 text-[12.5px] text-muted-foreground">
                      {plan.id === "free" ? "forever" : billing === "yearly" ? "/ year" : "/ month"}
                    </span>
                  </div>
                  )}
                  <p className="mt-1.5 h-4 text-[11.5px] text-success">
                    {plan.id === "pro" && billing === "yearly" ? `Save ${CURRENCY}${saving}` : ""}
                  </p>

                  {amount === null ? (
                    <button type="button" disabled className="mt-4 rounded-full border border-line bg-secondary px-4 py-3 text-[14px] font-medium text-muted-foreground">
                      {plan.cta}
                    </button>
                  ) : (
                  <Link
                    href={landing}
                    className={cn(
                      "mt-4 inline-flex items-center justify-center rounded-full px-4 py-3 text-[14px] font-medium transition-colors",
                      plan.featured
                        ? "bg-primary text-primary-foreground hover:bg-primary/88"
                        : "border border-line bg-transparent text-foreground hover:bg-secondary",
                    )}
                  >
                    {plan.cta}
                  </Link>
                  )}

                  <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-5">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-[13px] leading-snug text-body">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-success" strokeWidth={2.6} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mx-auto mt-8 max-w-[560px] text-center text-[12px] leading-[1.6] text-muted-foreground">
          {PRICING_NOTE} Max connections are planned. Pricing will be announced.
        </Reveal>
      </div>
    </section>
  );
}
