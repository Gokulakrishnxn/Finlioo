import Image from "next/image";
import { ArrowRight, MessageSquareQuote, ShieldCheck } from "lucide-react";
import { FeaturePreview } from "./features";
import { Reveal } from "./reveal";
import styles from "./warm.module.css";

/** The mosaic: goals, analytics and accounts around the real dashboard. */
export function CloserLook() {
  return (
    <section className={styles.section}>
      <div className={styles.shell}>
        <Reveal className={styles.sectionHead}>
          <p className="eyebrow">A closer look</p>
          <h2 className={`${styles.title} mt-3`}>Everything you own. <em>One quiet place.</em></h2>
        </Reveal>

        <div className={styles.mosaic}>
          <div className={`${styles.tile} ${styles.goals}`}><FeaturePreview id="goals" /></div>
          <div className={`${styles.tile} ${styles.analytics}`}><FeaturePreview id="analytics" /></div>
          <figure className={`${styles.tile} ${styles.shot}`}>
            <Image
              src="/marketing/dashboard.webp"
              alt="Finlio dashboard showing net worth, quarterly growth and recent activity."
              width={2779}
              height={1509}
              sizes="(max-width: 1023px) 90vw, 560px"
            />
          </figure>
          <div className={`${styles.tile} ${styles.ledger}`}><FeaturePreview id="ledger" /></div>
          <div className={`${styles.tile} ${styles.note} ${styles.note1}`}>
            <ShieldCheck size={22} strokeWidth={1.7} />
            <h3>Private by design</h3>
            <p>Encrypted in your account. Export it or delete it whenever you like.</p>
            <a href="#privacy">How we keep it yours <ArrowRight size={14} /></a>
          </div>
          <div className={`${styles.tile} ${styles.note} ${styles.note2}`}>
            <MessageSquareQuote size={22} strokeWidth={1.7} />
            <h3>Explains, never advises</h3>
            <p>Finlio tells you what moved and why. Buying and selling stays your call.</p>
            <a href="#faq">Read the FAQ <ArrowRight size={14} /></a>
          </div>
        </div>
        <p className={styles.sample}>Product previews use sample data.</p>
      </div>
    </section>
  );
}
