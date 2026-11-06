import { ArrowUpRight, Check, Newspaper, ShieldCheck } from "lucide-react";
import { FEATURES, QUARTERS, formatLakh, NET_WORTH } from "@/lib/landing-content";
import { Reveal } from "./reveal";
import styles from "./features.module.css";

function WealthPreview() {
  return (
    <div className={styles.wealth}>
      <div className={styles.toolbar}><span>Wealth overview</span><span>INR</span></div>
      <p className={styles.label}>Net worth</p>
      <div className={styles.amount}>{formatLakh(NET_WORTH)}</div>
      <p className={styles.positive}>↗ 42.86% this financial year</p>
      <div className={styles.chart}>
        {QUARTERS.map((quarter, index) => (
          <div key={quarter.fy + quarter.label}>
            <span style={{ height: 45 + index * 17 }} />
            <small>{quarter.label}</small>
          </div>
        ))}
      </div>
      <div className={styles.total}><span>Assets <b>₹13.31L</b></span><span>Liabilities <b>₹2.78L</b></span></div>
    </div>
  );
}

function BriefPreview() {
  return (
    <div className={styles.paper}>
      <div className={styles.toolbar}><Newspaper size={16} /><span>Your morning brief</span></div>
      <p className={styles.label}>What changed</p>
      <p className={styles.headline}>A stronger quarter.<br />A clearer picture.</p>
      <p>Reliance gained after quarterly results.</p>
      <div className={styles.source}><Check size={12} /> Source · NSE</div>
      <div className={styles.paperLines} aria-hidden><span /><span /></div>
    </div>
  );
}

function MovementPreview() {
  return (
    <div className={styles.movement}>
      <div className={styles.toolbar}><span>Reliance</span><span className={styles.positive}>+1.8%</span></div>
      <svg viewBox="0 0 320 90" className={styles.lineChart} aria-hidden>
        <path d="M0 78 L28 66 L53 70 L79 40 L100 50 L128 34 L150 42 L176 24 L202 29 L230 12 L258 20 L285 8 L320 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <p className={styles.reason}>Results beat estimates <ArrowUpRight size={14} /></p>
    </div>
  );
}

function SpendingPreview() {
  return (
    <div className={styles.spending}>
      <div className={styles.toolbar}><span>This month</span><span>Spending</span></div>
      <div className={styles.spendingBody}>
        <div className={styles.ring}><span>₹28.3K<small>Total spent</small></span></div>
        <div className={styles.legend}>
          <p><i />Groceries <b>₹8.4K</b></p>
          <p><i />Bills <b>₹5.1K</b></p>
          <p><i />Other <b>₹14.8K</b></p>
        </div>
      </div>
    </div>
  );
}

function LedgerPreview() {
  return (
    <div className={styles.ledger}>
      <div className={styles.toolbar}><span>Your accounts</span><ShieldCheck size={15} /></div>
      {[["Investments", "₹7.8L"], ["Savings", "₹5.51L"], ["Loans", "−₹2.78L"]].map(([name, value], index) => (
        <div className={styles.account} key={name}><span className={styles.accountNumber}>0{index + 1}</span><span>{name}</span><b>{value}</b></div>
      ))}
    </div>
  );
}

function ChatPreview() {
  return (
    <div className={styles.chat}>
      <p className={styles.question}>How much did I save this month?</p>
      <div className={styles.answer}>
        <p>You saved <strong>₹66.7K</strong></p>
        <span>That’s 70% of your ₹95K income.</span>
        <div className={styles.savingBar}><span /></div>
        <small><ShieldCheck size={12} /> Based on totals only</small>
      </div>
    </div>
  );
}

const PREVIEWS = {
  picture: WealthPreview,
  brief: BriefPreview,
  moved: MovementPreview,
  spending: SpendingPreview,
  ledger: LedgerPreview,
  chat: ChatPreview,
};

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-[1120px]">
        <Reveal className={styles.heading}>
          <p className="eyebrow">Made for your everyday</p>
          <h2>Everything you own.<br /><span>One quiet place.</span></h2>
          <p>Your picture, your spending, your answers.</p>
        </Reveal>
        <div className={styles.grid}>
          {FEATURES.map((feature, index) => {
            const Preview = PREVIEWS[feature.id];
            return (
              <Reveal key={feature.id} delay={index * 0.04} className={feature.id === "picture" || feature.id === "chat" ? styles.wide : undefined}>
                <article className={styles.card}>
                  <div className={styles.stage} data-scene={feature.id}><Preview /></div>
                  <div className={styles.caption}>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
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
