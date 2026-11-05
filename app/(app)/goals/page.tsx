"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CircleDashed, Clock, Pencil, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { ContributionDialog } from "@/components/goals/contribution-dialog";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { GOAL_ICONS, GOAL_TEMPLATES } from "@/components/goals/goal-look";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { previousRange, monthKey, monthStart, monthEnd, shiftMonth } from "@/lib/date-range";
import { formatDate, todayLocal } from "@/lib/format";
import { goalProgress, goalsSummary, type GoalStatus } from "@/lib/goals";
import { compactMoney, rangeTotals } from "@/lib/networth";
import { useStore } from "@/lib/store";
import { useMoney } from "@/lib/use-money";
import type { Goal, GoalCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const STATUS: Record<GoalStatus, { label: string; icon: typeof Target; className: string }> = {
  achieved: { label: "Achieved", icon: TrendingUp, className: "bg-success-soft text-success" },
  "on-track": { label: "On track", icon: TrendingUp, className: "bg-success-soft text-success" },
  behind: { label: "Behind pace", icon: Clock, className: "bg-warning-soft text-warning" },
  overdue: { label: "Past its date", icon: AlertTriangle, className: "bg-danger-soft text-loss" },
  "not-started": { label: "Not started", icon: CircleDashed, className: "bg-neutral-soft text-neutral" },
  "no-target": { label: "Needs a target", icon: CircleDashed, className: "bg-neutral-soft text-neutral" },
};

type Editing = { goal?: Goal; template?: GoalCategory } | null;

export default function GoalsPage() {
  const { ready, goals = [], removeGoal } = useStore();
  const { items } = useMoney();
  const [editing, setEditing] = useState<Editing>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [justAchieved, setJustAchieved] = useState<string | null>(null);

  const today = ready ? todayLocal() : "";

  // What was actually saved in a typical recent month: the last three full months.
  const recentSavings = useMemo(() => {
    if (!today) return null;
    const month = monthKey(today);
    const range = { from: monthStart(shiftMonth(month, -3)), to: monthEnd(shiftMonth(month, -1)) };
    const totals = rangeTotals(items, range);
    const before = rangeTotals(items, previousRange(range));
    return totals.income || totals.spent || before.income ? totals.saved / 3 : null;
  }, [items, today]);

  const summary = useMemo(() => (today ? goalsSummary(goals, today) : null), [goals, today]);

  if (!ready || !summary) return <PageSkeleton />;

  const addButton = (
    <MagneticButton glow={false} strength={0.15} onClick={() => setEditing({})} className="h-10 rounded-xl px-4">
      <Plus className="size-4" />
      {t("New goal")}
    </MagneticButton>
  );

  const overall = summary.target > 0 ? Math.round((summary.saved / summary.target) * 100) : 0;

  return (
    <>
      <PageHeader title={t("Goals")} subtitle={t("What you're saving towards, and how it's going.")} action={addButton} />

      {goals.length === 0 ? (
        <section className="card-surface p-6 md:p-8">
          <div className="max-w-xl">
            <h2 className="text-[20px] font-semibold tracking-tight text-ink">{t("Set your first goal")}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              {t("Give your savings a purpose. Pick one below or create your own, and Finlio will show how much it needs each month and whether you're on pace.")}
            </p>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GOAL_TEMPLATES.map((template) => {
              const Icon = GOAL_ICONS[template.category];
              return (
                <li key={template.category}>
                  <button
                    type="button"
                    onClick={() => setEditing({ template: template.category })}
                    className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:bg-sand/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand text-ink">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium text-ink">{t(template.name)}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{t(template.hint)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 *:min-w-0 md:gap-4 lg:grid-cols-4">
            <SummaryCard label={t("Saved so far")} value={compactMoney(summary.saved)} note={t("{pct}% of {amount}", { pct: overall, amount: compactMoney(summary.target) })} />
            <SummaryCard
              label={t("On track")}
              value={t("{count} of {total}", { count: summary.onTrack + summary.achieved, total: goals.length })}
              note={summary.achieved ? t("{count} achieved", { count: summary.achieved }) : t("Goals on pace")}
            />
            <SummaryCard
              label={t("Needed each month")}
              value={compactMoney(summary.neededMonthly)}
              note={summary.open === 1 ? t("To finish your open goal on time") : t("To finish {count} open goals on time", { count: summary.open })}
            />
            <SummaryCard
              label={t("You save each month")}
              value={recentSavings === null ? "—" : compactMoney(recentSavings)}
              note={recentSavings === null ? t("Add income and spending") : t("Average of the last 3 months")}
            />
          </div>

          {recentSavings !== null && summary.neededMonthly > 0 && (
            <p className="mt-3 text-[13px] text-body">
              {recentSavings >= summary.neededMonthly
                ? t("Your recent savings cover what your goals need each month.")
                : t("Your goals need {amount} a month more than you've recently been saving.", { amount: compactMoney(summary.neededMonthly - recentSavings) })}
            </p>
          )}

          <ul className="mt-4 grid gap-4 *:min-w-0 lg:grid-cols-2">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                today={today}
                celebrate={justAchieved === goal.id}
                onAdd={() => setContributing(goal)}
                onEdit={() => setEditing({ goal })}
                onDelete={() => setDeleting(goal)}
              />
            ))}
          </ul>

          <p className="mt-4 text-[12px] text-muted-foreground">
            {t("Finlio shows what your numbers mean. It doesn't recommend where to invest.")}
          </p>
        </>
      )}

      <GoalDialog
        key={editing?.goal?.id ?? `new-${editing?.template ?? "blank"}-${editing ? 1 : 0}`}
        goal={editing?.goal}
        template={editing?.template}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      {contributing && (
        <ContributionDialog
          key={contributing.id}
          goal={goals.find((g) => g.id === contributing.id) ?? contributing}
          open
          onOpenChange={(open) => !open && setContributing(null)}
          onAdded={(goal, amount) => {
            if (goal.savedAmount < goal.targetAmount && goal.savedAmount + amount >= goal.targetAmount) {
              setJustAchieved(goal.id);
            }
          }}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold tracking-tight">{t("Delete {name}?", { name: deleting?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("This removes the goal and its history. Your other money isn't affected.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-xl">{t("Keep it")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-10 rounded-xl"
              onClick={() => {
                if (deleting) removeGoal(deleting.id);
                setDeleting(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <SpotlightCard className="flex flex-col">
      <p className="eyebrow">{label}</p>
      <p className="nums mt-2 truncate text-[24px] leading-none font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 truncate text-[12px] text-muted-foreground">{note}</p>
    </SpotlightCard>
  );
}

function GoalCard({
  goal,
  today,
  celebrate,
  onAdd,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  today: string;
  celebrate: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = goalProgress(goal, today);
  const status = STATUS[progress.status];
  const StatusIcon = status.icon;
  const Icon = GOAL_ICONS[goal.category];
  const achieved = progress.status === "achieved";

  return (
    <li className="card-surface flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <ProgressRing pct={progress.pct} celebrate={celebrate} achieved={achieved} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">{goal.name}</h3>
          </div>
          <p className="nums mt-1.5 text-[18px] leading-tight font-semibold tracking-tight text-ink">
            {compactMoney(goal.savedAmount)}
            <span className="ml-1 text-[13px] font-normal text-muted-foreground">{t("of {amount}", { amount: compactMoney(goal.targetAmount) })}</span>
          </p>
          <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>
            <StatusIcon className="size-3" aria-hidden />
            {t(status.label)}
          </span>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("Edit {name}", { name: goal.name })}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-sand hover:text-ink"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t("Delete {name}", { name: goal.name })}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-sand hover:text-loss"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-line pt-3 text-[12px]">
        <Detail label={t("Target date")} value={goal.targetDate ? formatDate(goal.targetDate) : "—"} />
        <Detail
          label={achieved ? t("Left to save") : t("Needs a month")}
          value={achieved ? compactMoney(0) : progress.status === "overdue" ? "—" : compactMoney(progress.neededMonthly)}
        />
        <Detail
          label={t("At this pace")}
          value={achieved ? t("Done") : progress.projected ? formatDate(progress.projected) : t("No recent savings")}
        />
      </dl>

      {!achieved && (
        <Button variant="outline" onClick={onAdd} className="h-9 w-full rounded-xl">
          <Plus className="size-4" />
          {t("Add money")}
        </Button>
      )}
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="nums mt-0.5 truncate font-medium text-ink">{value}</dd>
    </div>
  );
}

function ProgressRing({ pct, achieved, celebrate }: { pct: number; achieved: boolean; celebrate: boolean }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="img"
      aria-label={t("{pct}% saved", { pct: Math.round(pct) })}
      className="relative flex size-16 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--chart-gain)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 480ms var(--ease-standard)" }}
        />
      </svg>
      {achieved ? (
        <span
          className={cn("absolute text-success", celebrate && "t-success-check")}
          data-state={celebrate ? "in" : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      ) : (
        <span className="nums absolute text-[13px] font-semibold text-ink">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
