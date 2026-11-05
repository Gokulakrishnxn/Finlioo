"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CASH_FLOW_LEGEND, CashFlowBars, RankedBars } from "@/components/analytics/bar-chart";
import { ChartCard, DataTable, EmptyChart } from "@/components/analytics/chart-card";
import { LineChart } from "@/components/analytics/line-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  cashFlowSeries,
  categoryComparison,
  changePct,
  netWorthSeries,
  savingsRate,
  topMerchants,
} from "@/lib/analytics";
import { rangeLabel } from "@/lib/date-range";
import { useDateRange } from "@/lib/date-range-context";
import { formatDate, formatMoney } from "@/lib/format";
import { allocation, compactMoney, rangeTotals } from "@/lib/networth";
import { totals as portfolioTotals } from "@/lib/portfolio";
import { useStore } from "@/lib/store";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "cash-flow", label: "Cash flow" },
  { id: "spending", label: "Spending" },
  { id: "portfolio", label: "Portfolio" },
];

type Tone = "good-up" | "bad-up" | "neutral";

export default function AnalyticsPage() {
  const { ready, assets } = useStore();
  const { positions, worth, items, snapshots } = useMoney();
  const { range, previous, today } = useDateRange();
  const [tab, setTab] = useState("overview");

  const current = useMemo(() => rangeTotals(items, range), [items, range]);
  const before = useMemo(() => rangeTotals(items, previous), [items, previous]);
  const cashFlow = useMemo(() => (today ? cashFlowSeries(items, range, today) : []), [items, range, today]);
  const categories = useMemo(() => categoryComparison(items, range, previous), [items, range, previous]);
  const merchants = useMemo(() => topMerchants(items, range), [items, range]);
  const history = useMemo(() => netWorthSeries(snapshots, range), [snapshots, range]);
  const spread = useMemo(() => allocation(worth.stocks, assets), [worth.stocks, assets]);
  const portfolio = useMemo(() => portfolioTotals(positions), [positions]);
  const stocks = useMemo(() => {
    const rows = positions.map((p) => ({ symbol: p.holding.symbol, amount: p.value ?? p.invested }));
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return rows.map((r) => ({ ...r, share: total ? (r.amount / total) * 100 : 0 })).sort((a, b) => b.amount - a.amount);
  }, [positions]);

  if (!ready) return <PageSkeleton />;

  const hasAnything = items.length > 0 || positions.length > 0 || (assets?.length ?? 0) > 0;
  if (!hasAnything) {
    return (
      <>
        <PageHeader title={t("Analytics")} subtitle={t("Your money, measured over time.")} />
        <section className="card-surface p-8">
          <p className="text-[16px] font-semibold tracking-tight text-ink">{t("Nothing to measure yet")}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-body">
            {t("Add income and expenses on Transactions, or stocks on Holdings, and your trends will appear here.")}
          </p>
        </section>
      </>
    );
  }

  const rate = savingsRate(current.income, current.saved);
  const rateBefore = savingsRate(before.income, before.saved);
  const startWorth = history[0]?.netWorth;
  const worthChange = startWorth !== undefined ? worth.netWorth - startWorth : null;
  const debtRatio = worth.assets > 0 ? (worth.loans / worth.assets) * 100 : null;
  const unfinished = cashFlow.some((c) => c.unfinished);
  const previousName = rangeLabel(previous);
  const rateSeries = cashFlow
    .map((c, i) => ({ key: c.key, label: c.label, x: i, y: c.rate }))
    .filter((p): p is { key: string; label: string; x: number; y: number } => p.y !== null);
  const cashFlowTable = (
    <DataTable
      head={[t("Period"), t("Income"), t("Spending"), t("Saved")]}
      rows={cashFlow.map((c) => ({
        key: c.key,
        cells: [c.label, formatMoney(c.income), formatMoney(c.spent), formatMoney(c.saved)],
      }))}
    />
  );
  const worthChart = history.length > 1 ? (
    <LineChart
      name="Net worth"
      formatValue={compactMoney}
      points={history.map((s) => ({
        key: s.date,
        label: formatDate(s.date),
        x: new Date(`${s.date}T00:00:00Z`).getTime(),
        y: s.netWorth,
      }))}
    />
  ) : (
    <EmptyChart>
      {t("Not enough net worth history in this period. Finlio records a point each day you open the dashboard.")}
    </EmptyChart>
  );
  const cashFlowChart = cashFlow.some((c) => c.income > 0 || c.spent > 0) ? (
    <CashFlowBars points={cashFlow} />
  ) : (
    <EmptyChart>{t("No income or spending in this period. Choose other dates above.")}</EmptyChart>
  );
  const unfinishedNote = unfinished ? ` * ${t("The latest period isn't finished yet.")}` : "";

  return (
    <>
      <PageHeader title={t("Analytics")} subtitle={t("Your money, measured over time.")} action={<DateRangePicker />} />

      <div className="grid grid-cols-2 gap-3 *:min-w-0 md:gap-4 lg:grid-cols-5">
        <Kpi label={t("Income")} value={compactMoney(current.income)} current={current.income} before={before.income} tone="good-up" />
        <Kpi label={t("Spending")} value={compactMoney(current.spent)} current={current.spent} before={before.spent} tone="bad-up" />
        <Kpi label={t("Saved")} value={compactMoney(current.saved)} current={current.saved} before={before.saved} tone="good-up" />
        <Kpi
          label={t("Savings rate")}
          value={rate === null ? "—" : `${Math.round(rate)}%`}
          note={
            rate !== null && rateBefore !== null
              ? t("Was {pct}%", { pct: Math.round(rateBefore) })
              : t("Of income kept")
          }
        />
        <Kpi
          label={t("Net worth today")}
          value={compactMoney(worth.netWorth)}
          note={
            worthChange === null
              ? worth.stocksLive
                ? t("At current prices")
                : t("Stocks at what you paid")
              : t("{amount} this period", { amount: `${worthChange >= 0 ? "+" : "−"}${compactMoney(Math.abs(worthChange))}` })
          }
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <p className="mt-3 text-[12px] text-muted-foreground">{t("Changes compare with {period}.", { period: previousName })}</p>

      <AnimatedTabs
        tabs={TABS.map((tab) => ({ ...tab, label: t(tab.label) }))}
        activeTab={tab}
        onChange={setTab}
        renderContent={false}
        className="mt-5"
        tabsContainerClassName="max-w-full overflow-x-auto [scrollbar-width:none]"
      />

      <div role="tabpanel" aria-label={t(TABS.find((item) => item.id === tab)?.label ?? "")} className="mt-4 flex flex-col gap-4">
        {tab === "overview" && (
          <>
            <ChartCard
              title={t("Income and spending")}
              subtitle={`${t("How money came in and went out.")}${unfinishedNote}`}
              legend={CASH_FLOW_LEGEND}
              chart={cashFlowChart}
              table={cashFlowTable}
            />
            <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
              <ChartCard title={t("Net worth")} subtitle={t("What you own minus what you owe.")} chart={worthChart} />
              <ChartCard
                title={t("Where it went")}
                subtitle={t("Your biggest spending categories.")}
                chart={
                  categories.length ? (
                    <RankedBars
                      color="var(--chart-spend)"
                      rows={categories.slice(0, 5).map((c) => ({
                        key: c.category,
                        label: t(c.category),
                        value: compactMoney(c.amount),
                        share: c.share,
                        href: `/transactions?category=${encodeURIComponent(c.category)}`,
                      }))}
                    />
                  ) : (
                    <EmptyChart>{t("No spending in this period.")}</EmptyChart>
                  )
                }
              />
            </div>
          </>
        )}

        {tab === "cash-flow" && (
          <>
            <ChartCard
              title={t("Income and spending")}
              subtitle={`${t("Grouped to suit the length of the period.")}${unfinishedNote}`}
              legend={CASH_FLOW_LEGEND}
              chart={cashFlowChart}
              table={cashFlowTable}
            />
            <ChartCard
              title={t("Savings rate")}
              subtitle={t("The share of income you kept in each period.")}
              chart={
                rateSeries.length > 1 ? (
                  <LineChart
                    name="Savings rate"
                    formatValue={(value) => `${Math.round(value)}%`}
                    points={rateSeries}
                    color="var(--chart-income)"
                    zeroBased
                  />
                ) : (
                  <EmptyChart>{t("This needs income in at least two periods. Try a longer date range.")}</EmptyChart>
                )
              }
              table={
                rateSeries.length ? (
                  <DataTable
                    head={[t("Period"), t("Savings rate")]}
                    rows={rateSeries.map((p) => ({ key: p.key, cells: [p.label, `${Math.round(p.y)}%`] }))}
                  />
                ) : undefined
              }
            />
          </>
        )}

        {tab === "spending" && (
          <div className="grid gap-4 *:min-w-0 lg:grid-cols-12">
            <ChartCard
              className="lg:col-span-7"
              title={t("By category")}
              subtitle={t("Compared with {period}. Select a category to see its transactions.", { period: previousName })}
              chart={
                categories.length ? (
                  <div className="overflow-x-auto">
                    <DataTable
                      head={[t("Category"), t("Spent"), t("Share"), t("Change")]}
                      rows={categories.map((c) => ({
                        key: c.category,
                        cells: [
                          <Link
                            key="name"
                            href={`/transactions?category=${encodeURIComponent(c.category)}`}
                            className="hover:underline"
                          >
                            {t(c.category)}
                          </Link>,
                          compactMoney(c.amount),
                          `${Math.round(c.share)}%`,
                          <SpendChange key="change" change={c.change} />,
                        ],
                      }))}
                    />
                  </div>
                ) : (
                  <EmptyChart>{t("No spending in this period.")}</EmptyChart>
                )
              }
            />
            <ChartCard
              className="lg:col-span-5"
              title={t("Top merchants")}
              subtitle={t("Where most of your money went.")}
              chart={
                merchants.length ? (
                  <RankedBars
                    color="var(--chart-spend)"
                    rows={merchants.map((m) => ({
                      key: m.name,
                      label: `${m.name} (${m.count})`,
                      value: compactMoney(m.amount),
                      share: m.share,
                      href: `/transactions?merchant=${encodeURIComponent(m.name)}`,
                    }))}
                  />
                ) : (
                  <EmptyChart>{t("No spending in this period.")}</EmptyChart>
                )
              }
            />
          </div>
        )}

        {tab === "portfolio" && (
          <>
            <div className="grid grid-cols-2 gap-3 *:min-w-0 md:gap-4 lg:grid-cols-4">
              <Kpi label={t("Stocks")} value={compactMoney(worth.stocks)} note={worth.stocksLive ? t("At current prices") : t("At what you paid")} />
              <Kpi
                label={t("Stock gain")}
                value={portfolio.complete ? compactMoney(portfolio.gain) : "—"}
                note={portfolio.complete ? t("{pct}% on what you paid", { pct: portfolio.gainPct.toFixed(1) }) : t("Needs live prices")}
              />
              <Kpi label={t("Liabilities")} value={compactMoney(worth.loans)} note={t("Everything you owe")} />
              <Kpi
                label={t("Debt to assets")}
                value={debtRatio === null ? "—" : `${Math.round(debtRatio)}%`}
                note={debtRatio === null ? t("Add assets to see this") : t("Share of assets owed")}
              />
            </div>
            <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
              <ChartCard
                title={t("Where your money sits")}
                subtitle={t("Your assets, by type.")}
                chart={
                  spread.length ? (
                    <RankedBars
                      rows={spread.map((a) => ({
                        key: a.label,
                        label: t(a.label),
                        value: compactMoney(a.amount),
                        share: worth.assets ? (a.amount / worth.assets) * 100 : 0,
                      }))}
                    />
                  ) : (
                    <EmptyChart>{t("Add stocks or assets to see how your money is spread.")}</EmptyChart>
                  )
                }
              />
              <ChartCard
                title={t("Portfolio by stock")}
                subtitle={worth.stocksLive ? t("At current prices.") : t("At what you paid, until live prices are set up.")}
                chart={
                  stocks.length ? (
                    <RankedBars
                      rows={stocks.map((s) => ({
                        key: s.symbol,
                        label: s.symbol,
                        value: compactMoney(s.amount),
                        share: s.share,
                      }))}
                    />
                  ) : (
                    <EmptyChart>{t("Add a stock on Holdings to see how your portfolio is spread.")}</EmptyChart>
                  )
                }
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  current,
  before,
  tone = "neutral",
  note,
  className,
}: {
  label: string;
  value: string;
  current?: number;
  before?: number;
  tone?: Tone;
  note?: string;
  className?: string;
}) {
  const change = current !== undefined && before !== undefined ? changePct(current, before) : null;
  const up = change !== null && change > 0;
  const good = tone === "good-up" ? up : !up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <SpotlightCard className={cn("flex flex-col", className)}>
      <p className="eyebrow">{label}</p>
      <p className="nums mt-2 truncate text-[24px] leading-none font-semibold tracking-tight text-ink">{value}</p>
      {change !== null && Math.round(change) !== 0 ? (
        <p className={cn("nums mt-2 flex items-center gap-1 text-[12px]", good ? "text-success" : "text-loss")}>
          <Icon className="size-3.5 shrink-0" aria-hidden />
          {up ? "+" : "−"}
          {Math.abs(Math.round(change))}%
        </p>
      ) : (
        <p className="mt-2 truncate text-[12px] text-muted-foreground">
          {note ?? (current !== undefined && before ? t("No change") : t("No earlier data"))}
        </p>
      )}
    </SpotlightCard>
  );
}

// More spending is the unfavourable direction; the arrow and sign carry it without colour alone.
function SpendChange({ change }: { change: number }) {
  if (Math.round(change) === 0) return <span className="text-muted-foreground">{t("No change")}</span>;
  const up = change > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center justify-end gap-1", up ? "text-loss" : "text-success")}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {up ? "+" : "−"}
      {compactMoney(Math.abs(change))}
    </span>
  );
}
