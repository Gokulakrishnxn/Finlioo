"use client";

import { useState } from "react";
import Link from "next/link";
import { compactMoney } from "@/lib/networth";
import { cn } from "@/lib/utils";
import { niceTop } from "@/components/analytics/chart-card";

export type BarPoint = { key: string; label: string; income: number; spent: number };

const SERIES = [
  { id: "income", label: "Income", color: "var(--chart-income)" },
  { id: "spent", label: "Spending", color: "var(--chart-spend)" },
] as const;

export const CASH_FLOW_LEGEND = SERIES.map(({ label, color }) => ({ label, color }));

// Income next to spending for each period. Hover or tab onto a period for its numbers.
export function CashFlowBars({ points, height = 240 }: { points: BarPoint[]; height?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceTop(Math.max(0, ...points.flatMap((p) => [p.income, p.spent])));
  const ticks = [0, 0.5, 1].map((f) => top * f);
  const point = active === null ? null : points[active];
  // Many narrow periods can't all carry a label, so show every other one.
  const labelEvery = points.length > 14 ? 3 : points.length > 8 ? 2 : 1;

  return (
    <div className="flex gap-3">
      <div className="relative w-12 shrink-0" style={{ height }} aria-hidden>
        {ticks.map((tick) => (
          <span
            key={tick}
            className="nums absolute right-0 translate-y-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
            style={{ bottom: `${(tick / top) * 100}%` }}
          >
            {tick === 0 ? "0" : compactMoney(tick)}
          </span>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute inset-x-0 h-px bg-line"
              style={{ bottom: `${(tick / top) * 100}%` }}
              aria-hidden
            />
          ))}
          <div className="absolute inset-0 flex">
            {points.map((p, i) => (
              <div
                key={p.key}
                tabIndex={0}
                role="img"
                aria-label={`${p.label}: income ${compactMoney(p.income)}, spending ${compactMoney(p.spent)}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={cn(
                  "flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t-md px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === i && "bg-sand/70",
                )}
              >
                {SERIES.map((series) => (
                  <span
                    key={series.id}
                    className="w-full max-w-5 rounded-t-[4px]"
                    style={{
                      height: p[series.id] > 0 ? `max(${(p[series.id] / top) * 100}%, 2px)` : 0,
                      background: series.color,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex" aria-hidden>
          {points.map((p, i) => (
            <span key={p.key} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground">
              {(points.length - 1 - i) % labelEvery === 0 ? p.label : ""}
            </span>
          ))}
        </div>

        {point && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl border border-line bg-popover p-3 text-[12px] shadow-lg"
            style={
              active < points.length / 2
                ? { left: `${((active + 1) / points.length) * 100}%` }
                : { right: `${((points.length - active) / points.length) * 100}%` }
            }
          >
            <p className="font-medium text-ink">{point.label}</p>
            <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-body">
              <dt>Income</dt>
              <dd className="nums text-right text-ink">{compactMoney(point.income)}</dd>
              <dt>Spending</dt>
              <dd className="nums text-right text-ink">{compactMoney(point.spent)}</dd>
              <dt>Saved</dt>
              <dd className="nums text-right text-ink">{compactMoney(point.income - point.spent)}</dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

// Ranked horizontal bars: one colour, longest first, with the value at the end.
export function RankedBars({
  rows,
  color = "var(--chart-income)",
}: {
  rows: { key: string; label: string; value: string; share: number; href?: string }[];
  color?: string;
}) {
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((row) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate font-medium text-ink">{row.label}</span>
              <span className="nums shrink-0 text-body">
                {row.value} · {Math.round(row.share)}%
              </span>
            </span>
            <span className="mt-1.5 block h-2 rounded-full bg-sand">
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.max(row.share, 1)}%`, background: color }}
              />
            </span>
          </>
        );
        return (
          <li key={row.key} className="text-[13px]">
            {row.href ? (
              <Link href={row.href} className="-m-1 block rounded-lg p-1 transition-colors hover:bg-sand/60">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
