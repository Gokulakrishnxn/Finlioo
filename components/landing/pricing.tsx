import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PLANS, PRICING_NOTE } from "@/lib/landing-pricing";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import styles from "./lower-sections.module.css";

const SIGN_UP = "/sign-up";

export function Pricing() {
  return (
    <section id="pricing" className={styles.pricing}>
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mx-auto max-w-[640px] text-center">
          <Reveal className="eyebrow">Plans</Reveal>
          <Reveal delay={0.05} as="h2" className={styles.title}>
            Free, Pro or Max.
          </Reveal>
          <Reveal delay={0.1} className="mt-4 text-[16px] leading-[1.65] text-body">
            Start with the whole picture. Pro adds AI summaries and chat. Max connects your preferred AI.
          </Reveal>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map((plan, index) => (
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
                  <h3 className="text-[26px] font-semibold tracking-[-0.03em]">{plan.name}</h3>
                  {plan.featured ? (
                    <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10.5px] font-medium text-success">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 min-h-[42px] text-[13.5px] leading-[1.55] text-muted-foreground">{plan.tagline}</p>

                <Link
                  href={SIGN_UP}
                  className={cn(
                    "group mt-5 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-[14px] font-medium transition-colors",
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/88"
                      : "border border-line bg-transparent text-foreground hover:bg-secondary",
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                </Link>

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
          ))}
        </div>

        <Reveal delay={0.1} className="mx-auto mt-8 max-w-[560px] text-center text-[12px] leading-[1.6] text-muted-foreground">
          {PRICING_NOTE}
        </Reveal>
      </div>
    </section>
  );
}
