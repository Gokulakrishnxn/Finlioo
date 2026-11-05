"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DonutChart,
  DonutChartCenter,
  DonutChartLegend,
  DonutChartPlot,
} from "@/components/charts/donut-chart";
import { SankeyChart, SankeyChartPlot, SankeyChartTooltip } from "@/components/charts/sankey-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { formatMoney } from "@/lib/format";
import { inRange, rangeLabel } from "@/lib/date-range";
import { useDateRange } from "@/lib/date-range-context";
import { allocation, compactMoney, rangeTotals, spendingByCategory } from "@/lib/networth";
import { currentLanguage } from "@/lib/preferences";
import { useStore } from "@/lib/store";
import { useMoney } from "@/lib/use-money";
import { t } from "@/lib/i18n";

const CATEGORY_COLORS = ["var(--chart-loss)", "#ff9f43", "#ffbe4c", "#9553f9", "#3784f4", "#14b8a6", "#a8a29e", "#c084fc", "#94a3b8"];

export default function InsightsPage() {
  const { ready, assets } = useStore();
  const { worth, items } = useMoney();
  const { range, previous } = useDateRange();
  const totals = useMemo(() => rangeTotals(items, range), [items, range]);
  const [points, setPoints] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alloc = useMemo(() => allocation(worth.stocks, assets), [worth.stocks, assets]);
  const allocTotal = alloc.reduce((s, a) => s + a.amount, 0);

  const spending = useMemo(() => spendingByCategory(items, range), [items, range]);

  // Charts show the biggest categories and fold the rest into one "Other" slice,
  // so small amounts don't crowd into unreadable slivers.
  const topSpending = useMemo(() => groupSmall(spending, 5, "Other"), [spending]);
  const flowSpending = useMemo(() => groupSmall(spending, 4, "Other spending"), [spending]);

  const income = useMemo(() => {
    const sums = new Map<string, number>();
    for (const i of items) {
      if (i.type === "income" && inRange(i.date, range)) sums.set(i.category, (sums.get(i.category) ?? 0) + i.amount);
    }
    return [...sums.entries()].map(([category, amount]) => ({ category, amount }));
  }, [items, range]);

  // Income sources → this month's money → spending categories and savings.
  const flow = useMemo(() => {
    if (!income.length || !spending.length) return null;
    const nodes = [
      ...income.map((i) => ({ id: `in:${i.category}`, label: t(i.category), color: "var(--chart-gain)" })),
      { id: "month", label: t("This period"), color: "#3784f4" },
      ...flowSpending.map((s, n) => ({
        id: `out:${s.category}`,
        label: t(s.category),
        color: s.category === "Other spending" ? "#a8a29e" : CATEGORY_COLORS[n % CATEGORY_COLORS.length],
      })),
    ];
    const links = [
      ...income.map((i) => ({ source: `in:${i.category}`, target: "month", value: i.amount })),
      ...flowSpending.map((s) => ({ source: "month", target: `out:${s.category}`, value: s.amount })),
    ];
    if (totals.saved > 0) {
      nodes.push({ id: "saved", label: t("Saved"), color: "var(--success)" });
      links.push({ source: "month", target: "saved", value: totals.saved });
    }
    return { nodes, links };
  }, [income, spending.length, flowSpending, totals.saved]);

  async function explain() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          netWorth: Math.round(worth.netWorth),
          assets: Math.round(worth.assets),
          loans: Math.round(worth.loans),
          language: currentLanguage(),
          period: rangeLabel(range),
          totals,
          previousPeriodSpent: rangeTotals(items, previous).spent,
          spendingByCategory: spending,
          allocation: alloc.map((a) => ({
            label: a.label,
            percent: allocTotal ? Math.round((a.amount / allocTotal) * 100) : 0,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setPoints(body.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't explain your money right now.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <PageSkeleton />;

  return (
    <>
      <PageHeader title={t("Insights")} subtitle={t("Your money, explained in plain words.")} action={<DateRangePicker />} />

      <section className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="max-w-xl">
            <p className="eyebrow">{t("Explain my money")}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-body">
              {t("Finlio looks at your totals (net worth, this period, spending by category and how your money is spread) and tells you what stands out. Only totals are sent; never transactions or names.")}
            </p>
          </div>
          <Button onClick={explain} disabled={loading} className="h-10 rounded-xl px-4">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? t("Reading your numbers…") : points ? t("Explain again") : t("Explain my money")}
          </Button>
        </div>
        {error && <p className="border-t border-line px-6 py-4 text-[14px] text-loss">{error}</p>}
        {points && (
          <ul className="flex flex-col gap-3 border-t border-line bg-success-soft px-6 py-5">
            {points.map((p, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gain" />
                {p}
              </li>
            ))}
            <li className="text-[12px] text-muted-foreground">{t("Finlio explains. It doesn't advise.")}</li>
          </ul>
        )}
      </section>

      <div className="mt-4 grid gap-4 *:min-w-0 lg:grid-cols-2">
        <section className="card-surface p-6">
          <p className="eyebrow mb-5">{t("Where your money sits")}</p>
          {alloc.length ? (
            <DonutChart
              segments={alloc.map((a) => ({ id: a.label, name: t(a.label), color: a.color, value: a.amount }))}
              formatValue={compactMoney}
              label={t("Allocation")}
              thickness={18}
              gap={4}
            >
              <div className="grid items-center gap-6 2xl:grid-cols-[minmax(0,12rem)_1fr]">
                <div className="mx-auto w-full max-w-[13rem]">
                  <DonutChartPlot>
                    <DonutChartCenter totalLabel="Total assets" />
                  </DonutChartPlot>
                </div>
                <DonutChartLegend />
              </div>
            </DonutChart>
          ) : (
            <p className="text-[14px] text-body">{t("Add stocks or assets to see how your money is spread.")}</p>
          )}
        </section>

        <section className="card-surface p-6">
          <p className="eyebrow mb-5">{t("Spending")}</p>
          {spending.length ? (
            <DonutChart
              segments={topSpending.map((s, n) => ({
                id: s.category,
                name: t(s.category),
                color: s.category === "Other" ? "#a8a29e" : CATEGORY_COLORS[n % CATEGORY_COLORS.length],
                value: s.amount,
              }))}
              thickness={18}
              gap={4}
              formatValue={compactMoney}
              label={t("Spending by category")}
            >
              <div className="grid items-center gap-6 2xl:grid-cols-[minmax(0,12rem)_1fr]">
                <div className="mx-auto w-full max-w-[13rem]">
                  <DonutChartPlot>
                    <DonutChartCenter totalLabel="Spent" />
                  </DonutChartPlot>
                </div>
                <DonutChartLegend />
              </div>
            </DonutChart>
          ) : (
            <p className="text-[14px] text-body">{t("No spends recorded in this period.")}</p>
          )}
        </section>
      </div>

      <section className="card-surface mt-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="eyebrow">{t("Money flow")}</p>
          <p className="text-[13px] text-muted-foreground">
            {t("In")} <span className="nums text-ink">{formatMoney(totals.income)}</span> · {t("Out")}{" "}
            <span className="nums text-ink">{formatMoney(totals.spent)}</span>
          </p>
        </div>
        {flow ? (
          <SankeyChart
            nodes={flow.nodes}
            links={flow.links}
            formatValue={compactMoney}
            label={t("Money flow")}
            nodePadding={26}
            nodeWidth={10}
            className="mt-4"
          >
            <SankeyChartPlot className="h-[22rem] min-w-0" />
            <SankeyChartTooltip />
          </SankeyChart>
        ) : (
          <p className="mt-4 text-[14px] text-body">
            {t("Add income and a few expenses in this period to see where your money flows.")}
          </p>
        )}
      </section>
    </>
  );
}

// Up to `keep` of the largest categories that are at least 5% of the total; the rest
// become one combined slice, so tiny amounts don't turn into unreadable slivers.
function groupSmall(rows: { category: string; amount: number }[], keep: number, otherLabel: string) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const big = rows.filter((r, i) => i < keep && r.amount >= total * 0.05);
  if (big.length >= rows.length - 1) return rows;
  const rest = rows.slice(big.length).reduce((sum, r) => sum + r.amount, 0);
  return [...big, { category: otherLabel, amount: rest }];
}
