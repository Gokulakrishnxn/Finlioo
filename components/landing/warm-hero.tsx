"use client";

import Image from "next/image";
import Link from "next/link";
import { Landmark, LineChart, LockKeyhole, Play, ShieldCheck, Sparkles } from "lucide-react";
import { formatLakh, NET_WORTH, NET_WORTH_CHANGE_PCT, QUARTERS } from "@/lib/landing-content";
import { useAnchorScroll } from "./smooth-scroll";
import styles from "./warm.module.css";

const TRUST = [
  { icon: Landmark, label: "Made for India: ₹, NSE, EPF, PPF, NPS" },
  { icon: LineChart, label: "Live NSE prices" },
  { icon: LockKeyhole, label: "Encrypted in your account" },
  { icon: ShieldCheck, label: "Explains. Never advises." },
];

/** A still life of money: product details laid out like plates on a table. */
function StillLife() {
  const max = Math.max(...QUARTERS.map((quarter) => quarter.value));
  return (
    <div aria-hidden>
      <div className={`${styles.plate} ${styles.pNetWorth} ${styles.drift}`}>
        <div className={styles.nwCard}>
          <small>Net worth</small>
          <strong>{formatLakh(NET_WORTH)}</strong>
          <span className={styles.up}>↗ {NET_WORTH_CHANGE_PCT}% this year</span>
          <div className={styles.bars}>
            {QUARTERS.map((quarter) => (
              <span key={quarter.fy + quarter.label} style={{ height: `${(quarter.value / max) * 100}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className={`${styles.plate} ${styles.pRing} ${styles.driftSlow}`}>
        <div className={styles.miniRing}>
          <span>₹28.3K<small>spent</small></span>
        </div>
      </div>

      <div className={`${styles.plate} ${styles.pSaved} ${styles.driftSlow}`}>
        <div className={styles.savedBig}>
          <strong>70%</strong>
          <small>saved this month</small>
        </div>
      </div>

      <div className={`${styles.float} ${styles.fTag} ${styles.drift}`}>
        <Sparkles size={13} /> Salary +₹95.0K
      </div>

      <div className={`${styles.float} ${styles.fShot} ${styles.driftSlow}`}>
        <Image src="/marketing/dashboard.webp" alt="" width={2779} height={1509} sizes="420px" priority />
      </div>

      <div className={`${styles.float} ${styles.fChat} ${styles.drift}`}>
        Why did my net worth go up this quarter?
      </div>

      <div className={`${styles.float} ${styles.fGoal} ${styles.driftSlow}`}>
        <div className={styles.goalHead}><span>Emergency fund</span><span>On track</span></div>
        <div className={styles.goalAmt}>₹3.2L <small>of ₹5L</small></div>
        <div className={styles.goalBar}><span /></div>
        <p className={styles.goalNote}>₹15K a month to finish on time</p>
      </div>
    </div>
  );
}

export function WarmHero() {
  const anchor = useAnchorScroll();
  return (
    <section className={styles.hero}>
      <div className={styles.band}>
        <StillLife />
        <div className={styles.centerCard}>
          <p className={styles.heroEyebrow}>Your money, explained</p>
          <h1 className={styles.heroTitle}>
            Know why your <span>money moved.</span>
          </h1>
          <p className={styles.heroLede}>
            Everything you own and owe in one calm view, with plain-language answers about what changed.
          </p>
          <div className={styles.heroActions}>
            <Link href="/sign-up" className={styles.btn}>Get started free</Link>
            <a href="#tour" onClick={(event) => anchor(event, "#tour")} className={styles.btnQuiet}>
              <span className={styles.playDot}><Play size={14} fill="currentColor" /></span>
              Watch the tour
            </a>
          </div>
        </div>
      </div>
      <ul className={styles.trust}>
        {TRUST.map(({ icon: Icon, label }) => (
          <li key={label}><span><Icon size={15} strokeWidth={1.8} />{label}</span></li>
        ))}
      </ul>
    </section>
  );
}
