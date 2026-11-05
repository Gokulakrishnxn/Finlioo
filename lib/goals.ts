import { daysIn, monthEnd, monthKey, monthStart, shiftMonth } from "@/lib/date-range";
import type { Goal } from "@/lib/types";

// Progress on a savings goal, worked out from what's been put towards it. These describe
// the numbers; they never suggest what to invest in.

export type GoalStatus = "achieved" | "overdue" | "on-track" | "behind" | "not-started" | "no-target";

export type GoalProgress = {
  pct: number;
  remaining: number;
  monthsLeft: number;
  neededMonthly: number;
  paceMonthly: number;
  projected: string | null;
  status: GoalStatus;
};

const DAYS_PER_MONTH = 30.44;

const addDays = (value: string, days: number) =>
  new Date(new Date(`${value}T00:00:00Z`).getTime() + days * 864e5).toISOString().slice(0, 10);

export function goalProgress(goal: Goal, today: string): GoalProgress {
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
  const dayCount = goal.targetDate >= today ? daysIn({ from: today, to: goal.targetDate }) : 0;
  const monthsLeft = dayCount / DAYS_PER_MONTH;
  // A goal due within a month still needs the whole remainder this month.
  const neededMonthly = remaining > 0 ? remaining / Math.max(monthsLeft, 1) : 0;

  // The monthly pace, by calendar month so a regular deposit is always counted once a
  // month. The better of the last three full months and the last three including this
  // one, so money added today shows up straight away.
  const month = monthKey(today);
  const within = (from: string, to: string) =>
    goal.contributions.filter((c) => c.date >= from && c.date <= to).reduce((sum, c) => sum + c.amount, 0);
  const paceMonthly =
    Math.max(
      within(monthStart(shiftMonth(month, -3)), monthEnd(shiftMonth(month, -1))),
      within(monthStart(shiftMonth(month, -2)), today),
    ) / 3;
  const projected = remaining > 0 && paceMonthly > 0 ? addDays(today, Math.round((remaining / paceMonthly) * DAYS_PER_MONTH)) : null;

  let status: GoalStatus;
  if (goal.targetAmount <= 0) status = "no-target";
  else if (remaining === 0) status = "achieved";
  else if (goal.targetDate < today) status = "overdue";
  else if (goal.savedAmount === 0 && goal.contributions.length === 0) status = "not-started";
  else status = paceMonthly >= neededMonthly ? "on-track" : "behind";

  return { pct, remaining, monthsLeft, neededMonthly, paceMonthly, projected, status };
}

export function goalsSummary(goals: Goal[], today: string) {
  const progress = goals.map((goal) => goalProgress(goal, today));
  const open = progress.filter((p) => p.status !== "achieved" && p.status !== "no-target");
  return {
    target: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    saved: goals.reduce((sum, g) => sum + Math.min(g.savedAmount, g.targetAmount || g.savedAmount), 0),
    achieved: progress.filter((p) => p.status === "achieved").length,
    onTrack: progress.filter((p) => p.status === "on-track").length,
    open: open.length,
    neededMonthly: open.reduce((sum, p) => sum + (p.status === "overdue" ? 0 : p.neededMonthly), 0),
  };
}
