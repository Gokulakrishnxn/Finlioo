"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { formatMoney, formatMonth } from "@/lib/format";
import { activeLocale } from "@/lib/locale";
import { compactMoney, monthTotals, type Activity } from "@/lib/networth";
import { useStore } from "@/lib/store";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const CHART_MONTHS = 6;

function shiftMonth(key: string, by: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const shortMonth = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString(activeLocale().language, { month: "short" });

function spendingByCategory(items: Activity[], month: string) {
  const totals = new Map<string, number>();
  for (const i of items) {
    if (i.type === "expense" && i.date.startsWith(month)) {
      totals.set(i.category, (totals.get(i.category) ?? 0) + i.amount);
    }
  }
  return totals;
}

// Each recent month's totals, starting from the first month that has any activity.
function buildTrend(items: Activity[], month: string) {
  if (!month) return [];
  const earliest = items.reduce((min, i) => (i.date < min ? i.date : min), month).slice(0, 7);
  return Array.from({ length: CHART_MONTHS }, (_, n) => shiftMonth(month, n - CHART_MONTHS + 1))
    .filter((key) => key >= earliest)
    .map((key) => ({ key, ...monthTotals(items, key) }));
}

// A round top for the axis, so the ticks land on clean numbers.
function niceMax(value: number) {
  if (value <= 0) return 1;
  const size = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => value <= s * size) ?? 10;
  return step * size;
}

export default function AnalyticsPage() {
  const { ready } = useStore();
  const { positions, worth, items, month } = useMoney();

  // The running month is unfinished, so comparisons use the last two full months.
  const lastFull = month ? shiftMonth(month, -1) : "";
  const prevFull = month ? shiftMonth(month, -2) : "";

  const trend = buildTrend(items, month);

  const fullMonths = trend.filter((t) => t.key !== month && (t.spent > 0 || t.income > 0));
  const avgSpend = fullMonths.length ? fullMonths.reduce((s, t) => s + t.spent, 0) / fullMonths.length : null;
  const last = monthTotals(items, lastFull);
  const prev = monthTotals(items, prevFull);
  const savingsRate = last.income > 0 ? (last.saved / last.income) * 100 : null;
  const prevRate = prev.income > 0 ? (prev.saved / prev.income) * 100 : null;
  const debtRatio = worth.assets > 0 ? (worth.loans / worth.assets) * 100 : null;

  const categories = useMemo(() => {
    const a = spendingByCategory(items, lastFull);
    const b = spendingByCategory(items, prevFull);
    return [...new Set([...a.keys(), ...b.keys()])]
      .map((category) => ({ category, last: a.get(category) ?? 0, prev: b.get(category) ?? 0 }))
      .sort((x, y) => y.last - x.last);
  }, [items, lastFull, prevFull]);
  const biggest = categories[0]?.last ? categories[0] : null;

  const holdings = useMemo(() => {
    const rows = positions.map((p) => ({ symbol: p.holding.symbol, amount: p.value ?? p.invested }));
    const total = rows.reduce((s, r) => s + r.amount, 0);
    return rows
      .map((r) => ({ ...r, share: total ? (r.amount / total) * 100 : 0 }))
      .sort((x, y) => y.amount - x.amount);
  }, [positions]);

  if (!ready) return <PageSkeleton />;

  const lastName = formatMonth(lastFull);
  const prevName = formatMonth(prevFull);
  const hasActivity = items.length > 0;

  if (!hasActivity && !positions.length) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Your numbers over time." />
        <section className="card-surface p-8">
          <p className="text-[16px] font-semibold tracking-tight text-ink">Nothing to measure yet</p>
          <p className="mt-2 text-[14px] leading-relaxed text-body">
            Add income and expenses on{" "}
            <Link href="/transactions" className="text-ink underline">
              Transactions
            </Link>{" "}
            or stocks on{" "}
            <Link href="/holdings" className="text-ink underline">
              Holdings
            </Link>{" "}
            and your trends will appear here.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Analytics" subtitle="Your numbers over time." />

      <div className="grid gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={`Savings rate · ${shortMonth(lastFull)}`}
          value={savingsRate === null ? "—" : `${Math.round(savingsRate)}%`}
          note={
            savingsRate === null
              ? "Needs a month with income"
              : prevRate === null
                ? "Share of income you kept"
                : `${prevName}: ${Math.round(prevRate)}%`
          }
        />
        <Stat
          label="Average monthly spend"
          value={avgSpend === null ? "—" : compactMoney(avgSpend)}
          note={
            avgSpend === null
              ? "Needs one full month"
              : `Over ${fullMonths.length} full ${fullMonths.length === 1 ? "month" : "months"}`
          }
        />
        <Stat
          label={`Top category · ${shortMonth(lastFull)}`}
          value={biggest ? compactMoney(biggest.last) : "—"}
          note={biggest ? biggest.category : "Needs a month with spending"}
        />
        <Stat
          label="Debt to assets"
          value={debtRatio === null ? "—" : `${Math.round(debtRatio)}%`}
          note={debtRatio === null ? "Add assets to see this" : `${compactMoney(worth.loans)} owed`}
        />
      </div>

      <IncomeSpendingChart
        trend={trend}
        currentMonth={month}
        className="mt-4"
      />

      <div className="mt-4 grid gap-4 *:min-w-0 lg:grid-cols-12">
        <section className="card-surface px-6 pt-5 pb-3 lg:col-span-7">
          <p className="eyebrow">Spending by category</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {lastName} compared with {prevName}, the last two full months.
          </p>
          {categories.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">{shortMonth(prevFull)}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">{shortMonth(lastFull)}</th>
                    <th scope="col" className="py-2 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.category} className="border-b border-line last:border-b-0">
                      <th scope="row" className="py-2.5 pr-3 text-left font-normal text-ink">{c.category}</th>
                      <td className="nums py-2.5 pr-3 text-right text-body">{compactMoney(c.prev)}</td>
                      <td className="nums py-2.5 pr-3 text-right text-ink">{compactMoney(c.last)}</td>
                      <td className="py-2.5 text-right">
                        <ChangeCell last={c.last} prev={c.prev} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-5 text-[14px] text-body">Your comparison appears after a full month of spending.</p>
          )}
        </section>

        <section className="card-surface p-6 lg:col-span-5">
          <p className="eyebrow">Portfolio by stock</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {worth.stocksLive ? "At current prices." : "At what you paid, until live prices are set up."}
          </p>
          {holdings.length ? (
            <ul className="mt-5 flex flex-col gap-4">
              {holdings.map((h) => (
                <li key={h.symbol} className="text-[13px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium text-ink">{h.symbol}</span>
                    <span className="nums shrink-0 text-body">
                      {compactMoney(h.amount)} · {Math.round(h.share)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-sand">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(h.share, 1)}%`, background: "var(--chart-income)" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-[14px] text-body">
              <Link href="/holdings" className="text-ink underline">
                Add a stock
              </Link>{" "}
              to see how your portfolio is spread.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <section className="card-surface flex flex-col p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className="nums mt-auto text-[26px] leading-none font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 truncate text-[12px] text-muted-foreground">{note}</p>
    </section>
  );
}

// Spending going up is the unfavourable direction; the arrow and sign carry it without colour.
function ChangeCell({ last, prev }: { last: number; prev: number }) {
  const diff = last - prev;
  if (diff === 0) return <span className="nums text-muted-foreground">No change</span>;
  const up = diff > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("nums inline-flex items-center justify-end gap-1", up ? "text-loss" : "text-success")}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {up ? "+" : "−"}
      {compactMoney(Math.abs(diff))}
    </span>
  );
}

type Trend = { key: string; income: number; spent: number; saved: number }[];

function IncomeSpendingChart({
  trend,
  currentMonth,
  className,
}: {
  trend: Trend;
  currentMonth: string;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);

  const top = niceMax(Math.max(0, ...trend.flatMap((t) => [t.income, t.spent])));
  const ticks = [0, 0.5, 1].map((f) => top * f);
  const label = (key: string) => (key === currentMonth ? `${shortMonth(key)} so far` : shortMonth(key));
  const point = active === null ? null : trend[active];

  return (
    <section className={cn("card-surface p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Income and spending</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Up to the last {CHART_MONTHS} months. The current month isn&apos;t finished yet.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-sand p-1">
          {(["chart", "table"] as const).map((v) => (
            <Button
              key={v}
              variant="ghost"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "h-7 rounded-lg px-3 text-[13px] text-body capitalize",
                view === v && "bg-card font-medium text-ink shadow-sm",
              )}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      {view === "chart" ? (
        <>
          <ul className="mt-4 flex gap-4 text-[12px] text-body">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: "var(--chart-income)" }} />
              Income
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: "var(--chart-spend)" }} />
              Spending
            </li>
          </ul>

          <div className="mt-4 flex gap-3">
            <div className="relative h-56 w-12 shrink-0" aria-hidden>
              {ticks.map((t) => (
                <span
                  key={t}
                  className="nums absolute right-0 translate-y-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
                  style={{ bottom: `${(t / top) * 100}%` }}
                >
                  {t === 0 ? "0" : compactMoney(t)}
                </span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="relative h-56">
                {ticks.map((t) => (
                  <span
                    key={t}
                    className="absolute inset-x-0 h-px bg-line"
                    style={{ bottom: `${(t / top) * 100}%` }}
                    aria-hidden
                  />
                ))}
                <div className="absolute inset-0 flex">
                  {trend.map((t, i) => (
                    <div
                      key={t.key}
                      tabIndex={0}
                      role="img"
                      aria-label={`${label(t.key)}: income ${formatMoney(t.income)}, spending ${formatMoney(t.spent)}`}
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      className={cn(
                        "flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active === i && "bg-sand/60",
                      )}
                    >
                      {[
                        { value: t.income, color: "var(--chart-income)" },
                        { value: t.spent, color: "var(--chart-spend)" },
                      ].map(({ value, color }) => (
                        <span
                          key={color}
                          className="w-full max-w-6 rounded-t-[4px]"
                          style={{ height: value > 0 ? `max(${(value / top) * 100}%, 2px)` : 0, background: color }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex" aria-hidden>
                {trend.map((t) => (
                  <span key={t.key} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground">
                    {label(t.key)}
                  </span>
                ))}
              </div>

              {point && active !== null && (
                <div
                  role="status"
                  className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl border border-line bg-card p-3 text-[12px] shadow-lg"
                  style={
                    active < trend.length / 2
                      ? { left: `${((active + 1) / trend.length) * 100}%` }
                      : { right: `${((trend.length - active) / trend.length) * 100}%` }
                  }
                >
                  <p className="font-medium text-ink">{label(point.key)}</p>
                  <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-body">
                    <dt>Income</dt>
                    <dd className="nums text-right text-ink">{compactMoney(point.income)}</dd>
                    <dt>Spending</dt>
                    <dd className="nums text-right text-ink">{compactMoney(point.spent)}</dd>
                    <dt>Saved</dt>
                    <dd className="nums text-right text-ink">{compactMoney(point.saved)}</dd>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Month</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Income</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Spending</th>
                <th scope="col" className="py-2 text-right font-medium">Saved</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((t) => (
                <tr key={t.key} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-2.5 pr-3 text-left font-normal text-ink">{label(t.key)}</th>
                  <td className="nums py-2.5 pr-3 text-right text-body">{formatMoney(t.income)}</td>
                  <td className="nums py-2.5 pr-3 text-right text-body">{formatMoney(t.spent)}</td>
                  <td className="nums py-2.5 text-right text-ink">{formatMoney(t.saved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
