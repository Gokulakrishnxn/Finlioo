"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// A titled chart with a Chart / Table switch, so every number can also be read as text.
export function ChartCard({
  title,
  subtitle,
  legend,
  chart,
  table,
  className,
}: {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  chart: React.ReactNode;
  table?: React.ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className={cn("card-surface p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {table && (
          <div role="group" aria-label={title} className="flex gap-0.5 rounded-lg bg-sand p-0.5">
            {(["chart", "table"] as const).map((option) => (
              <button
                key={option === "chart" ? t("Chart") : t("Table")}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] text-body capitalize transition-colors",
                  view === option && "bg-card font-medium text-ink shadow-sm",
                )}
              >
                {option === "chart" ? t("Chart") : t("Table")}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "chart" || !table ? (
        <>
          {legend && (
            <ul className="mt-4 flex flex-wrap gap-4 text-[12px] text-body">
              {legend.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
                  {t(item.label)}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">{chart}</div>
        </>
      ) : (
        <div className="mt-4 overflow-x-auto">{table}</div>
      )}
    </section>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: { key: string; cells: React.ReactNode[] }[] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-line text-left text-muted-foreground">
          {head.map((label, i) => (
            <th key={label} scope="col" className={cn("py-2 font-medium", i > 0 && "pl-3 text-right")}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-line last:border-b-0">
            {row.cells.map((cell, i) =>
              i === 0 ? (
                <th key={i} scope="row" className="py-2.5 text-left font-normal text-ink">
                  {cell}
                </th>
              ) : (
                <td key={i} className="nums py-2.5 pl-3 text-right whitespace-nowrap text-body">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[14px] leading-relaxed text-body">
      {children}
    </p>
  );
}

// A round axis top, so ticks land on clean numbers.
export function niceTop(value: number) {
  if (value <= 0) return 1;
  const size = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => value <= s * size) ?? 10;
  return step * size;
}
