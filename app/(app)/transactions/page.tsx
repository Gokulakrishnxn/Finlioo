"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, LogOut, Mail, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { DateRangePicker } from "@/components/date-range-picker";
import { ActivityRow } from "@/components/dashboard/recent-activity";
import { EntryDialog } from "@/components/entry-dialog";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { formatMoney, formatTime } from "@/lib/format";
import { inRange, rangeLabel } from "@/lib/date-range";
import { useDateRange } from "@/lib/date-range-context";
import { compactMoney, rangeTotals, spendingByCategory } from "@/lib/networth";
import { useStore } from "@/lib/store";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { t } from "@/lib/i18n";

type Session = { configured: boolean; gmail?: boolean; email?: string };
type Filter = "all" | "expense" | "income";

const MESSAGES: Record<string, string> = {
  connected: "Connected to Google. Press Sync to read your bank alerts.",
  denied: "You didn't allow access, so Finlio can't read your bank alerts.",
  failed: "Google sign-in didn't finish. Please try again.",
  "not-configured": "Google sign-in isn't set up on this copy of Finlio yet.",
};

const BAR_COLORS = ["var(--chart-gain)", "#3784f4", "#ff9f43", "#9553f9", "#ffbe4c", "var(--chart-loss)", "#14b8a6", "#a8a29e", "var(--chart-muted)"];

export default function TransactionsPage() {
  const { ready, expenses, setExpenses, removeEntry } = useStore();
  const { items } = useMoney();
  const { range, previous } = useDateRange();
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<"income" | "expense" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [match, setMatch] = useState<{ kind: "category" | "merchant"; value: string } | null>(null);

  useEffect(() => {
    // Result of the Google redirect, e.g. /transactions?google=connected
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google");
    if (status) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotice(MESSAGES[status] ?? null);
      window.history.replaceState(null, "", "/transactions");
    }
    // Links from Analytics open this list on one category or merchant.
    const category = params.get("category");
    const merchant = params.get("merchant");
    if (category) setMatch({ kind: "category", value: category });
    else if (merchant) setMatch({ kind: "merchant", value: merchant });
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ configured: false }));
  }, []);

  const totals = useMemo(() => rangeTotals(items, range), [items, range]);
  const before = useMemo(() => rangeTotals(items, previous), [items, previous]);
  const byCategory = useMemo(() => spendingByCategory(items, range), [items, range]);
  const shown = items.filter(
    (i) =>
      inRange(i.date, range) &&
      (filter === "all" || i.type === filter) &&
      (!match || (match.kind === "category" ? i.category === match.value : i.title === match.value)),
  );

  async function sync() {
    setSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/expenses/sync", {
        method: "POST",
      });
      const body = await res.json();
      if (res.status === 401) setSession((s) => (s ? { ...s, gmail: false } : s));
      if (!res.ok) throw new Error(body.error);
      setExpenses({ account: body.account, syncedAt: body.syncedAt, expenses: body.expenses });
      if (!body.expenses.length) setNotice(`Read ${body.scanned} alert emails but found no spends.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read your bank alerts.");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    await fetch("/api/auth/gmail", { method: "DELETE" });
    setSession((s) => (s ? { ...s, gmail: false } : s));
    setExpenses(undefined);
  }

  if (!ready || !session) return <PageSkeleton />;
  const max = byCategory[0]?.amount ?? 1;

  return (
    <>
      <PageHeader
        title={t("Transactions")}
        subtitle={t("Where your money came from and where it went.")}
        action={
          <>
            <Button variant="outline" onClick={() => setAdding("income")} className="h-10 rounded-xl px-4">
              <Plus className="size-4" />
              {t("Income")}
            </Button>
            <Button onClick={() => setAdding("expense")} className="h-10 rounded-xl px-4">
              <Plus className="size-4" />
              {t("Expense")}
            </Button>
          </>
        }
      />

      <div className="mb-4 flex justify-end">
        <DateRangePicker />
      </div>

      {notice && (
        <p className="mb-4 rounded-2xl bg-card px-5 py-3 text-[14px] text-body ring-1 ring-line">{notice}</p>
      )}

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-12">
        <section className="card-surface p-6 lg:col-span-5">
          <p className="eyebrow">{t("Spent")}</p>
          <CountUp
            value={totals.spent}
            format={formatMoney}
            className="nums mt-2 block text-[34px] leading-none font-semibold tracking-tight text-ink"
          />
          <p className="mt-3 text-[13px] text-body">
            {t("Previous period ({period}):", { period: rangeLabel(previous) })}{" "}
            <span className="nums text-ink">{formatMoney(before.spent)}</span>
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <div>
              <p className="eyebrow">{t("In")}</p>
              <p className="nums mt-1 text-[16px] font-semibold text-success">{compactMoney(totals.income)}</p>
            </div>
            <div>
              <p className="eyebrow">{t("Saved")}</p>
              <p className={cn("nums mt-1 text-[16px] font-semibold", totals.saved >= 0 ? "text-ink" : "text-loss")}>
                {compactMoney(totals.saved)}
              </p>
            </div>
          </div>
        </section>

        <section className="card-surface p-6 lg:col-span-7">
          <p className="eyebrow">{t("By category")}</p>
          {byCategory.length ? (
            <ul className="mt-4 flex flex-col gap-3">
              {byCategory.map(({ category, amount }) => (
                <li key={category} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-[13px]">
                  <span className="truncate text-body">{category}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-sand">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (amount / max) * 100)}%`,
                        background:
                          BAR_COLORS[EXPENSE_CATEGORIES.indexOf(category as (typeof EXPENSE_CATEGORIES)[number])] ??
                          "var(--chart-muted)",
                      }}
                    />
                  </span>
                  <span className="nums text-ink">{formatMoney(amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[14px] text-body">{t("No spends in this period.")}</p>
          )}
        </section>
      </div>

      <div className="mt-4 empty:hidden">
        {session.gmail && (
          <section className="card-surface flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3 text-[14px] text-body">
              <span className="flex size-8 items-center justify-center rounded-full bg-sand">
                <Mail className="size-4 text-ink" />
              </span>
              <span>
                {t("Gmail ·")} <span className="font-medium text-ink">{session.email}</span>
                {expenses?.syncedAt && (
                  <span className="text-muted-foreground"> · {t("Synced {time}", { time: formatTime(expenses.syncedAt) })}</span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={sync} disabled={syncing} className="h-9 rounded-xl px-4">
                {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {syncing ? t("Reading your alerts…") : expenses ? t("Sync again") : t("Sync bank alerts")}
              </Button>
              <Button variant="ghost" onClick={disconnect} className="h-9 rounded-xl text-muted-foreground">
                <LogOut className="size-4" />
                {t("Disconnect")}
              </Button>
            </div>
          </section>
        )}
        {error &&<p className="mt-3 rounded-2xl bg-card px-5 py-3 text-[14px] text-loss ring-1 ring-line">{error}</p>}
      </div>

      <section className="card-surface mt-4 px-6 pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">{t("Transactions")}</p>
            {match && (
              <button
                type="button"
                onClick={() => {
                  setMatch(null);
                  window.history.replaceState(null, "", "/transactions");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[12px] text-ink ring-1 ring-line hover:bg-muted"
              >
                {match.value}
                <X className="size-3" aria-hidden />
                <span className="sr-only">{t("Clear this filter")}</span>
              </button>
            )}
          </div>
          <div className="flex gap-1 rounded-xl bg-sand p-1">
            {(["all", "expense", "income"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1 text-[13px] text-body",
                  filter === f && "bg-card font-medium text-ink shadow-sm",
                )}
              >
                {f === "all" ? t("All") : f === "expense" ? t("Spends") : t("Income")}
              </button>
            ))}
          </div>
        </div>
        {shown.length ? (
          <ul className="mt-2">
            {shown.slice(0, 60).map((item) => (
              <ActivityRow
                key={item.id}
                item={item}
                action={
                  item.source === "manual" ? (
                    <button
                      onClick={() => removeEntry(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-sand hover:text-loss"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : (
                    <span className="w-[26px]" />
                  )
                }
              />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-[14px] text-body">
            {session.gmail ? t("Nothing in this period. Choose other dates, add an expense or income, or sync your bank alerts.") : t("Nothing in this period. Choose other dates, or add an expense or income.")}
          </p>
        )}
      </section>

      <EntryDialog
        key={adding ?? "none"}
        type={adding ?? "expense"}
        open={adding !== null}
        onOpenChange={(open) => !open && setAdding(null)}
      />
    </>
  );
}

