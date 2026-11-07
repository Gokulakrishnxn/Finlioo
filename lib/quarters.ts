import { activeLocale } from "@/lib/locale";
import type { Snapshot } from "@/lib/types";

// Indian financial year April–March (Q1 Apr–Jun … Q4 Jan–Mar), labelled "FY27" for Apr 2026–Mar 2027.
export function fiscalQuarter(iso: string, startMonth = activeLocale().fyStartMonth) {
  const [y, m] = iso.split("-").map(Number);
  const offset = (m - startMonth + 12) % 12; // months since the year began
  const q = Math.floor(offset / 3) + 1;
  // The year is named after the calendar year it ends in.
  const fyEnd = startMonth === 1 ? y : m >= startMonth ? y + 1 : y;
  return { key: `${fyEnd}-Q${q}`, label: `Q${q}`, fy: activeLocale().fyLabel(fyEnd), fyEnd, q };
}

function previousQuarter(fyEnd: number, q: number) {
  return q === 1 ? { fyEnd: fyEnd - 1, q: 4 } : { fyEnd, q: q - 1 };
}

export type QuarterBar = {
  key: string;
  label: string; // "Q3"
  fy: string; // "FY27" or "2026"
  value?: number; // net worth at the quarter's last recorded day; undefined if no record
  current: boolean;
};

// The last `count` quarters ending with today's, each holding the latest net worth
// recorded in that quarter (today's live value for the current one).
export function quarterBars(snapshots: Snapshot[], today: string, current: number, count = 6): QuarterBar[] {
  const latest = new Map<string, number>();
  for (const s of [...snapshots].sort((a, b) => a.date.localeCompare(b.date))) {
    latest.set(fiscalQuarter(s.date).key, s.netWorth);
  }
  const now = fiscalQuarter(today);
  const bars: QuarterBar[] = [];
  let cursor = { fyEnd: now.fyEnd, q: now.q };
  for (let i = 0; i < count; i++) {
    const key = `${cursor.fyEnd}-Q${cursor.q}`;
    bars.unshift({
      key,
      label: `Q${cursor.q}`,
      fy: activeLocale().fyLabel(cursor.fyEnd),
      value: i === 0 ? current : latest.get(key),
      current: i === 0,
    });
    cursor = previousQuarter(cursor.fyEnd, cursor.q);
  }
  return bars;
}

export type PeriodBar = { key: string; label: string; sub?: string; value?: number; current: boolean };

// The last `count` calendar months ending with this one, each holding the latest net worth
// recorded in that month (today's live value for the current one).
export function monthBars(snapshots: Snapshot[], today: string, current: number, count = 6): PeriodBar[] {
  const latest = new Map<string, number>();
  for (const s of [...snapshots].sort((a, b) => a.date.localeCompare(b.date))) {
    latest.set(s.date.slice(0, 7), s.netWorth);
  }
  const [ty, tm] = today.split("-").map(Number);
  const bars: PeriodBar[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(ty, tm - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    bars.unshift({
      key,
      label: d.toLocaleDateString(activeLocale().language, { month: "short" }),
      // The year only where it changes, so the axis stays light.
      sub: i === count - 1 || d.getMonth() === 0 || i === 0 ? String(d.getFullYear()) : undefined,
      value: i === 0 ? current : latest.get(key),
      current: i === 0,
    });
  }
  return bars;
}

// The last `count` financial years ending with this one, each holding the latest net worth
// recorded in that year (today's live value for the current one).
export function yearBars(snapshots: Snapshot[], today: string, current: number, count = 5): PeriodBar[] {
  const latest = new Map<number, number>();
  for (const s of [...snapshots].sort((a, b) => a.date.localeCompare(b.date))) {
    latest.set(fiscalQuarter(s.date).fyEnd, s.netWorth);
  }
  const now = fiscalQuarter(today).fyEnd;
  const bars: PeriodBar[] = [];
  for (let i = 0; i < count; i++) {
    const fyEnd = now - i;
    bars.unshift({
      key: String(fyEnd),
      label: activeLocale().fyLabel(fyEnd),
      value: i === 0 ? current : latest.get(fyEnd),
      current: i === 0,
    });
  }
  return bars;
}
