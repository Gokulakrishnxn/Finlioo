import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FEATURES } from "@/lib/landing-content";
import { FeatureScene } from "./feature-scenes";
import { Reveal } from "./reveal";
import styles from "./features.module.css";

export function Features() {
  return (
    <section id="features" className={`${styles.section} scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28`}>
      <div className="mx-auto max-w-[1120px]">
        <Reveal className={styles.heading}>
          <p className="eyebrow">Made for your everyday</p>
          <h2>Everything you own.<br /><span>One quiet place.</span></h2>
          <p>Your picture, your spending, your answers.</p>
        </Reveal>
        <div className={styles.grid}>
          {FEATURES.map((feature, index) => {
            return (
              <Reveal key={feature.id} delay={index * 0.04}>
                <article className={styles.card}>
                  <div className={styles.picture} data-scene={feature.id} aria-hidden>
                    <FeatureScene id={feature.id} />
                  </div>
                  <div className={styles.caption}>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                    <Link href="/sign-up" className={styles.link} aria-label={`Get started with ${feature.title}`}>
                      Get started <ArrowRight size={14} strokeWidth={2.2} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className={styles.sample}>Product previews use sample data.</p>
      </div>
    </section>
  );
}
