import { ArrowDownToLine, Check, LockKeyhole, Mail, Monitor, ShieldCheck } from "lucide-react";
import { Reveal } from "./reveal";
import styles from "./lower-sections.module.css";

const CONTROLS = [
  { icon: Monitor, title: "Encrypted in your account", body: "Stored on Google Cloud, encrypted in transit and at rest. Every request is checked against your account." },
  { icon: Mail, title: "Your inbox stays yours", body: "Google is used only to sign you in. Finlio never reads your email." },
  { icon: ArrowDownToLine, title: "Yours to take or delete", body: "Export all your data as CSV or JSON any time, or delete your account and financial data from Settings." },
];

export function Privacy() {
  return (
    <section id="privacy" className={styles.section}>
      <div className={styles.privacy}>
        <Reveal className={styles.privacyIntro}>
          <p className="eyebrow">Private by design</p>
          <h2 className={styles.title}>Your money.<br /><span>Your space.</span></h2>
          <p className={styles.description}>A clear view of your finances, with control over what you share.</p>
          <div className={styles.privacyNote}><ShieldCheck size={17} /> Finlio explains. It never advises.</div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className={styles.device}>
            <div className={styles.deviceHead}><Monitor size={18} /><span>Your account</span><LockKeyhole size={15} /></div>
            <div className={styles.privateRows}>
              {["Holdings", "Assets & loans", "Transactions"].map((name) => (
                <div key={name}><span>{name}</span><span><Check size={13} /> Encrypted</span></div>
              ))}
            </div>
            <div className={styles.shared}>
              <p>Shared when needed</p>
              <span>NSE codes for prices. Totals and percentages for Insights and chat.</span>
            </div>
          </div>
        </Reveal>
        <div className={styles.controls}>
          {CONTROLS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.04}>
              <Icon size={21} strokeWidth={1.6} />
              <h3>{title}</h3>
              <p>{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
