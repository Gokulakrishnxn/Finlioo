"use client";

import type { ReactNode } from "react";
import { Landmark, MessageCircle, PiggyBank, Receipt, Target, TrendingUp } from "lucide-react";
import { Stage, type Act, type LookTokens } from "@/components/landing/stage-kit";
import { Bar, Text } from "@/components/landing/stage-kit/window";
import { Check, Meter, Roll } from "@/components/landing/stage-kit";
import { Toggle } from "@/components/landing/stage-kit/controls/Toggle";
import { Badge } from "@/components/landing/stage-kit/controls/Badge";
import { QUARTERS, formatLakh } from "@/lib/landing-content";
import styles from "./feature-scenes.module.css";

// One small product fragment per feature card, after the stageshow skill's
// bento rules: one component per tile (never a whole window), filler only at
// the edges where the card's ground takes it, real words only on the subject.
// Each scene is its own Stage at the card's native size, so text draws 1:1.

const W = 360;
const H = 200;

/** Finlio's feature-card look, taken from the dashboard: warm neutrals and Finlio green. */
const TOKENS: LookTokens = {
  "--ss-font": "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  "--ss-text-strong": "#343433",
  "--ss-text": "#716f6b",
  "--ss-text-faint": "#a5a29b",
  "--ss-icon": "#716f6b",
  "--ss-line": "#ecebe7",
  "--ss-success": "#21803d",
  "--ss-success-text": "#1c6b34",
  "--ss-success-soft": "#eef8f1",
  "--ss-shadow-satellite": "0 0 0 1px rgb(24 22 20 / 6%), 0 12px 28px -10px rgb(24 22 20 / 18%), 0 3px 8px -4px rgb(24 22 20 / 8%)",
};
const ACCENT = "#21803d";

function Scene<S extends object>({
  children,
  initial,
  poster,
  script,
  cursorAt,
}: {
  children: (s: S) => ReactNode;
  initial?: S;
  poster?: S;
  script?: (a: Act<S>) => Promise<void>;
  cursorAt?: { x: number; y: number };
}) {
  return (
    <Stage<S>
      width={W}
      height={H}
      initial={initial}
      poster={poster}
      script={script}
      play="once"
      accent={ACCENT}
      greys="warm"
      tokens={TOKENS}
      cursor={cursorAt ? { at: cursorAt, style: "arrow", idle: 1600 } : undefined}
      className={styles.stage}
    >
      {(s) => children(s)}
    </Stage>
  );
}

/** A quiet placeholder card: the neighbours that tell you this is one of many. */
function Ghost({ className, widths = [64, 40] }: { className: string; widths?: number[] }) {
  return (
    <div className={`${styles.ghost} ${className}`} aria-hidden>
      <Bar w={14} h={14} r={4} tone={2} />
      {widths.map((w, i) => <Bar key={i} w={w} h={5} tone={i ? 1 : 2} />)}
    </div>
  );
}

/* 1. Your whole picture: every account adds up to one number. */
function PictureScene() {
  return (
    <Scene>
      {() => (
        <div className={styles.picture}>
          <Ghost className={styles.pictureGhostTop} widths={[90, 54, 70]} />
          <div className={styles.strip}>
            <span className={styles.segment}><TrendingUp size={13} /><Text>₹7.8L</Text></span>
            <span className={styles.segment}><PiggyBank size={13} /><Text>₹5.51L</Text></span>
            <span className={styles.segment}><Landmark size={13} /><Text>−₹2.78L</Text></span>
            <span className={styles.total}><Text>₹10.53L</Text></span>
          </div>
          <Ghost className={styles.pictureGhostBottom} widths={[70, 44, 86]} />
        </div>
      )}
    </Scene>
  );
}

/* 2. Goals: how far, and the pace to finish on time. */
function GoalsScene() {
  return (
    <Scene>
      {() => (
        <div className={styles.goals}>
          <Ghost className={styles.goalsGhost} widths={[110, 60]} />
          <div className={styles.goalCard}>
            <div className={styles.goalHead}>
              <span className={styles.goalIcon}><Target size={13} /></span>
              <Text className={styles.strong}>Emergency fund</Text>
              <Text className={styles.faint}>64%</Text>
            </div>
            <Meter value={0.64} className={styles.goalMeter} />
            <div className={styles.goalFoot}>
              <Text className={styles.muted}>₹3.2L of ₹5L</Text>
              <Bar w={42} h={5} tone={2} />
            </div>
          </div>
          <div className={styles.pace}>
            <Check on size={14} />
            <Text className={styles.strong}>₹15K a month</Text>
            <Text className={styles.faint}>on track</Text>
          </div>
        </div>
      )}
    </Scene>
  );
}

/* 3. Analytics: this quarter beside the one before, bars rising in on view. */
type Grow = { grown: boolean };
const LOW = QUARTERS[0].value;
const HIGH = QUARTERS[QUARTERS.length - 1].value;
const change = ((HIGH - QUARTERS[QUARTERS.length - 2].value) / QUARTERS[QUARTERS.length - 2].value) * 100;

function AnalyticsScene() {
  return (
    <Scene<Grow>
      initial={{ grown: false }}
      poster={{ grown: true }}
      script={async (a) => {
        await a.wait(250);
        a.set({ grown: true });
        await a.wait(1200);
      }}
    >
      {(s) => (
        <div className={styles.analytics}>
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <div>
                <Text className={styles.faint}>Net worth · Q3 vs Q2</Text>
                <Text className={styles.figure}>{formatLakh(HIGH)}</Text>
              </div>
              <Badge tone="success">{`+${change.toFixed(1)}%`}</Badge>
            </div>
            <div className={styles.bars}>
              {QUARTERS.map((q, i) => (
                <span
                  key={q.label + q.fy}
                  className={styles.bar}
                  data-last={i === QUARTERS.length - 1 || undefined}
                  style={{ height: s.grown ? 18 + ((q.value - LOW) / (HIGH - LOW)) * 54 : 6, transitionDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Scene>
  );
}

/* 4. Spending: payments sorted into categories, drawn as a fan-out. */
const CATEGORIES = [
  { name: "Groceries", amount: "₹8.4K", y: 52 },
  { name: "Bills", amount: "₹5.1K", y: 100 },
  { name: "Other", amount: "₹14.8K", y: 148 },
];

function SpendingScene() {
  return (
    <Scene>
      {() => (
        <div className={styles.spending}>
          <svg className={styles.links} viewBox={`0 0 ${W} ${H}`} aria-hidden>
            {CATEGORIES.map((c) => (
              <path key={c.name} d={`M86 100 C122 100 118 ${c.y} 154 ${c.y}`} />
            ))}
            {CATEGORIES.map((c) => <circle key={c.name} cx={154} cy={c.y} r={2.5} />)}
          </svg>
          <span className={styles.source}><Receipt size={16} /></span>
          <Ghost className={styles.spendGhostTop} widths={[54, 30]} />
          {CATEGORIES.map((c) => (
            <div key={c.name} className={styles.category} style={{ top: c.y - 15 }}>
              <Text className={styles.strong}>{c.name}</Text>
              <Text className={styles.muted}>{c.amount}</Text>
            </div>
          ))}
          <Ghost className={styles.spendGhostBottom} widths={[48, 34]} />
        </div>
      )}
    </Scene>
  );
}

/* 5. Assets meet liabilities: switching loans on brings the total to net worth. */
type Loans = { loans: boolean };
const ACCOUNTS = [
  { name: "Investments", value: "₹7.8L" },
  { name: "Savings", value: "₹5.51L" },
];

/** Where the cursor waits, in the card's right margin (a point, so it hovers nothing). */
const LEDGER_REST = { x: 334, y: 121 };

function LedgerScene() {
  return (
    <Scene<Loans>
      initial={{ loans: false }}
      poster={{ loans: true }}
      cursorAt={LEDGER_REST}
      script={async (a) => {
        await a.wait(500);
        await a.move("loans");
        await a.click();
        a.set({ loans: true });
        await a.wait(500);
        // Step off the toggle so the ending isn't covered (a hovering cursor never fades)
        await a.move(LEDGER_REST);
        await a.wait(1800);
      }}
    >
      {(s) => (
        <div className={styles.ledger}>
          <div className={styles.ledgerCard}>
            <div className={styles.ledgerHead}>
              <Text className={styles.strong}>Count loans</Text>
              <Toggle on={s.loans} data-target="loans" data-cursor="pointer" />
            </div>
            {ACCOUNTS.map((row) => (
              <div key={row.name} className={styles.ledgerRow}>
                <Check on size={14} />
                <Text className={styles.muted}>{row.name}</Text>
                <Text className={styles.value}>{row.value}</Text>
              </div>
            ))}
            <div className={styles.ledgerRow} data-off={!s.loans || undefined}>
              <Check on={s.loans} size={14} />
              <Text className={styles.muted}>Home loan</Text>
              <Text className={styles.value}>−₹2.78L</Text>
            </div>
            <div className={styles.ledgerTotal}>
              <Text className={styles.faint}>Net worth</Text>
              <Roll className={styles.value} delay={250}>{s.loans ? "₹10.53L" : "₹13.31L"}</Roll>
            </div>
          </div>
        </div>
      )}
    </Scene>
  );
}

/* 6. Ask Finlio: a plain question, an answer from your totals. */
function ChatScene() {
  return (
    <Scene>
      {() => (
        <div className={styles.chat}>
          <div className={styles.chatCard}>
            <div className={styles.chatHead}>
              <MessageCircle size={13} />
              <Text className={styles.muted}>How much did I save this month?</Text>
            </div>
            <div className={styles.chatBody}>
              <Text className={styles.answer}>You saved ₹66.7K</Text>
              <Text className={styles.muted}>70% of your ₹95K income.</Text>
              <Meter value={0.7} tone="success" className={styles.chatMeter} />
            </div>
            <div className={styles.chatFoot}>
              <Bar w={56} h={5} tone={2} />
              <Bar w={34} h={14} r={7} tone={2} />
            </div>
          </div>
        </div>
      )}
    </Scene>
  );
}

const SCENES = {
  picture: PictureScene,
  goals: GoalsScene,
  analytics: AnalyticsScene,
  spending: SpendingScene,
  ledger: LedgerScene,
  chat: ChatScene,
} as const;

/** The picture for one feature card. A component, so a server page can render it. */
export function FeatureScene({ id }: { id: keyof typeof SCENES }) {
  const Scene = SCENES[id];
  return <Scene />;
}
