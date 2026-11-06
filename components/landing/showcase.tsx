import Image from "next/image";
import { Reveal } from "./reveal";
import styles from "./lower-sections.module.css";

export function Showcase() {
  return (
    <section className={styles.section}>
      <div className={styles.showcase}>
        <Reveal className={styles.showcaseHeading}>
          <div>
            <p className="eyebrow">Meet your dashboard</p>
            <h2 className={styles.title}>A little perspective.<br /><span>Every morning.</span></h2>
          </div>
          <p>Your net worth, spending and daily brief. A clear place to start.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <figure>
            <div className={styles.productStage}>
              <div>
                <Image src="/marketing/dashboard.webp" alt="Finlio dashboard showing net worth, quarterly growth and recent activity." width={2779} height={1509} sizes="(max-width: 767px) 90vw, 1040px" />
              </div>
            </div>
            <figcaption className={styles.productCaption}>A preview with sample data. Your picture makes it yours.</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
