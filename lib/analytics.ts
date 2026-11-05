import { bucketsFor, inRange, monthEnd, monthKey, type DateRange } from "@/lib/date-range";
import { rangeTotals, spendingByCategory, type Activity } from "@/lib/networth";
import type { Snapshot } from "@/lib/types";

// Figures for the Analytics page, worked out from this browser's data. Pure functions.

export function cashFlowSeries(items: Activity[], range: DateRange, today: string) {
  return bucketsFor(range).map((bucket) => {
    const totals = rangeTotals(items, bucket.range);
    // A period still under way is labelled, so a low bar isn't read as a real drop.
    const unfinished = bucket.range.to === today && today !== monthEnd(monthKey(today));
    return {
      key: bucket.key,
      label: unfinished ? `${bucket.label}*` : bucket.label,
      income: totals.income,
      spent: totals.spent,
      saved: totals.saved,
      rate: totals.income > 0 ? (totals.saved / totals.income) * 100 : null,
      unfinished,
    };
  });
}

export function savingsRate(income: number, saved: number) {
  return income > 0 ? (saved / income) * 100 : null;
}

export function categoryComparison(items: Activity[], range: DateRange, previous: DateRange) {
  const current = spendingByCategory(items, range);
  const before = new Map(spendingByCategory(items, previous).map((c) => [c.category, c.amount]));
  const total = current.reduce((sum, c) => sum + c.amount, 0);
  return current.map((c) => ({
    category: c.category,
    amount: c.amount,
    share: total ? (c.amount / total) * 100 : 0,
    previous: before.get(c.category) ?? 0,
    change: c.amount - (before.get(c.category) ?? 0),
  }));
}

export function topMerchants(items: Activity[], range: DateRange, limit = 6) {
  const totals = new Map<string, { amount: number; count: number }>();
  for (const item of items) {
    if (item.type !== "expense" || !inRange(item.date, range)) continue;
    const entry = totals.get(item.title) ?? { amount: 0, count: 0 };
    totals.set(item.title, { amount: entry.amount + item.amount, count: entry.count + 1 });
  }
  const grand = [...totals.values()].reduce((sum, t) => sum + t.amount, 0);
  return [...totals.entries()]
    .map(([name, t]) => ({ name, ...t, share: grand ? (t.amount / grand) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

// Net worth points in the range, thinned to at most `limit` so the line stays readable.
export function netWorthSeries(snapshots: Snapshot[], range: DateRange, limit = 60) {
  const inside = [...snapshots].filter((s) => inRange(s.date, range)).sort((a, b) => a.date.localeCompare(b.date));
  if (inside.length <= limit) return inside;
  const step = (inside.length - 1) / (limit - 1);
  return Array.from({ length: limit }, (_, i) => inside[Math.round(i * step)]);
}

// Change between two amounts as a percentage, or null when there's nothing to compare with.
export function changePct(current: number, before: number) {
  if (!before) return null;
  return ((current - before) / Math.abs(before)) * 100;
}
