import Link from "next/link";
import { Sprout } from "lucide-react";
import { FeaturePreview, type PreviewId } from "./features";
import { Reveal } from "./reveal";
import styles from "./warm.module.css";

const REASONS: { id: PreviewId; title: string; body: string; cta: string }[] = [
  { id: "picture", title: "Your whole picture", body: "Net worth, every asset and every loan, added up in one clear view.", cta: "See your picture" },
  { id: "spending", title: "Spending, sorted", body: "Bank and UPI alerts turn into tidy categories. Gmail is optional and read-only.", cta: "Track spending" },
  { id: "chat", title: "Answers, not advice", body: "Ask what changed and get a plain answer from your own totals. Never a tip.", cta: "Ask Finlio" },
];

export function WhyFinlio() {
  return (
    <section id="features" className={`${styles.section} scroll-mt-24`}>
      <div className={styles.shell}>
        <Reveal className={styles.sectionHead}>
          <span className={styles.eyebrowMark}><Sprout size={20} /></span>
          <h2 className={styles.title}>Why Finlio?</h2>
          <p className={styles.lede}>
            Most money apps shout. Finlio keeps things quiet: one place for what you own, what you spend and where
            you are headed, explained in words you would use yourself.
          </p>
        </Reveal>
        <div className={styles.cards}>
          {REASONS.map((reason, index) => (
            <Reveal key={reason.id} delay={index * 0.05} as="article" className={styles.card}>
              <FeaturePreview id={reason.id} className={styles.cardStage} />
              <div className={styles.cardBody}>
                <h3>{reason.title}</h3>
                <p>{reason.body}</p>
                <Link href="/sign-up" className={`${styles.btn} ${styles.btnSmall}`}>{reason.cta}</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
