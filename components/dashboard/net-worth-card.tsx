"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { formatMoney, formatPct, formatShortDate, formatSignedMoney, todayLocal } from "@/lib/format";
import { compactMoney } from "@/lib/networth";
import { activeLocale } from "@/lib/locale";
import { monthBars, yearBars } from "@/lib/quarters";
import { cn } from "@/lib/utils";
import type { Snapshot } from "@/lib/types";
import { t } from "@/lib/i18n";

type ChartPoint = { key: string; value?: number; label: string; sub?: string; current?: boolean };

// One bar per period. Heights start just below the smallest value so growth between
// periods is visible; a period with no record shows as a dashed stub.
function BarChart({ points }: { points: ChartPoint[] }) {
  const known = points.map((p) => p.value).filter((v): v is number => v !== undefined && v > 0);
  const max = Math.max(...known, 1);
  const floor = known.length > 1 ? Math.min(...known) * 0.85 : 0;
  return (
    <div>
      <div className="flex h-[150px] items-end gap-2 sm:gap-3">
        {points.map((p) => {
          const pct =
            p.value === undefined ? 0 : Math.max(8, ((Math.max(p.value, 0) - floor) / (max - floor || 1)) * 100);
          return (
            <div key={p.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={cn(
                  "nums text-[9px] tracking-tight whitespace-nowrap sm:text-[10px]",
                  p.current ? "font-semibold text-ink" : "text-muted-foreground",
                )}
              >
                {p.value === undefined ? "—" : compactMoney(p.value)}
              </span>
              {p.value === undefined ? (
                <div
                  className="h-[10%] w-full max-w-[52px] rounded-lg border border-dashed border-line"
                  title={`${p.label}${p.sub ? ` ${p.sub}` : ""}: no record`}
                />
              ) : (
                <div
                  title={`${p.label}${p.sub ? ` ${p.sub}` : ""}: ${compactMoney(p.value)}`}
                  style={{ height: `${pct}%` }}
                  className={cn(
                    "w-full max-w-[52px] rounded-lg transition-[height] duration-500 ease-out motion-reduce:transition-none",
                    p.current ? "bg-gain" : "bg-[var(--chart-gain-soft)]",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-line pt-2 sm:gap-3">
        {points.map((p) => (
          <div key={p.key} className="min-w-0 flex-1 text-center leading-tight">
            <p className={cn("text-[11px] font-medium", p.current ? "text-ink" : "text-body")}>{p.label}</p>
            {p.sub && <p className="text-[10px] text-muted-foreground">{p.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const shortDate = (iso: string) =>
  formatShortDate(iso);

export function NetWorthCard({
  netWorth,
  assets,
  loans,
  stocksLive,
  snapshots,
}: {
  netWorth: number;
  assets: number;
  loans: number;
  stocksLive: boolean;
  snapshots: Snapshot[];
}) {
  const first = snapshots[0];
  const change = first ? netWorth - first.netWorth : 0;
  const pct = first?.netWorth ? (change / Math.abs(first.netWorth)) * 100 : 0;
  const [view, setView] = useState<"monthly" | "yearly">("monthly");

  const points: ChartPoint[] = (view === "monthly" ? monthBars : yearBars)(snapshots, todayLocal(), netWorth);
  const gross = assets + Math.abs(loans);
  const assetShare = gross ? Math.round((assets / gross) * 100) : 100;
  const up = change >= 0;

  return (
    <section
      data-tour="networth"
      className="@container card-surface flex flex-col p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="eyebrow">
          {t("Net worth")} · {activeLocale().symbol} {activeLocale().currency}
        </p>
        {!stocksLive && (
          <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {t("Stocks at cost")}
          </span>
        )}
      </div>

      <CountUp
        value={netWorth}
        format={formatMoney}
        className="nums mt-3 block text-[clamp(22px,8.5cqw,44px)] leading-none font-semibold tracking-tight whitespace-nowrap text-ink"
      />

      {snapshots.length > 1 ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px]">
          <span
            className={cn(
              "nums inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
              up ? "bg-success-soft text-success" : "bg-loss/10 text-loss",
            )}
          >
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {formatSignedMoney(change)} ({formatPct(pct)})
          </span>
          <span className="text-muted-foreground">{t("since {date}", { date: shortDate(first.date) })}</span>
        </p>
      ) : (
        <p className="mt-4 text-[13px] text-muted-foreground">
          {t("Your history starts today and grows each day you open Finlio.")}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          {view === "monthly" ? t("Month by month") : t("By financial year (Apr–Mar)")}
        </p>
        <div className="flex gap-0.5 rounded-full bg-sand p-0.5">
          {(["monthly", "yearly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] text-body transition-colors",
                view === v && "bg-card font-medium text-ink shadow-sm",
              )}
            >
              {v === "monthly" ? t("Monthly") : t("Yearly")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <BarChart points={points} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gain" />
              {t("Assets")}
            </p>
            <p className="nums mt-1.5 text-[17px] font-medium text-ink">{compactMoney(assets)}</p>
          </div>
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-loss" />
              {t("Liabilities")}
            </p>
            <p className="nums mt-1.5 text-[17px] font-medium text-ink">{compactMoney(loans)}</p>
          </div>
        </div>
        <div
          className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-loss/60"
          role="img"
          aria-label={`${assetShare}% assets`}
        >
          <div className="h-full rounded-full bg-gain" style={{ width: `${assetShare}%` }} />
        </div>
      </div>
    </section>
  );
}
