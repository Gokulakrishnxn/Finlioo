"use client";

import { useRef, useState } from "react";
import { niceTop } from "@/components/analytics/chart-card";
import { t } from "@/lib/i18n";

export type LinePoint = { key: string; label: string; x: number; y: number };

// One series over time, with a crosshair that follows the pointer or the arrow keys.
export function LineChart({
  points,
  formatValue,
  color = "var(--chart-gain)",
  height = 220,
  zeroBased = false,
  name,
}: {
  points: LinePoint[];
  formatValue: (value: number) => string;
  color?: string;
  height?: number;
  zeroBased?: boolean;
  name: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const plot = useRef<HTMLDivElement>(null);

  const values = points.map((p) => p.y);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const pad = (rawMax - rawMin) * 0.12 || Math.abs(rawMax) * 0.1 || 1;
  const max = zeroBased ? niceTop(Math.max(rawMax, 1)) : rawMax + pad;
  const min = zeroBased ? Math.min(0, rawMin) : Math.max(rawMin >= 0 ? 0 : -Infinity, rawMin - pad);
  const spanY = max - min || 1;
  const firstX = points[0]?.x ?? 0;
  const spanX = (points[points.length - 1]?.x ?? 1) - firstX || 1;

  const xPct = (p: LinePoint) => (points.length === 1 ? 50 : ((p.x - firstX) / spanX) * 100);
  const yPct = (p: LinePoint) => 100 - ((p.y - min) / spanY) * 100;
  const path = points.map((p, i) => `${i ? "L" : "M"}${xPct(p).toFixed(2)} ${yPct(p).toFixed(2)}`).join(" ");
  const area = `${path} L${xPct(points[points.length - 1]).toFixed(2)} 100 L${xPct(points[0]).toFixed(2)} 100 Z`;
  const ticks = [min, min + spanY / 2, max];

  const point = active === null ? null : points[active];
  const last = points[points.length - 1];

  function nearest(clientX: number) {
    const box = plot.current?.getBoundingClientRect();
    if (!box) return;
    const pct = ((clientX - box.left) / box.width) * 100;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(xPct(p) - pct) < Math.abs(xPct(points[best]) - pct)) best = i;
    });
    setActive(best);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActive((current) => Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + step)));
  }

  return (
    <div className="flex gap-3">
      <div className="relative w-12 shrink-0" style={{ height }} aria-hidden>
        {ticks.map((tick) => (
          <span
            key={tick}
            className="nums absolute right-0 translate-y-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
            style={{ bottom: `${((tick - min) / spanY) * 100}%` }}
          >
            {formatValue(tick)}
          </span>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          ref={plot}
          tabIndex={0}
          role="img"
          aria-label={`${name}: ${formatValue(last.y)}, ${last.label}. ${t("Use the left and right arrow keys to read earlier points.")}`}
          onMouseMove={(e) => nearest(e.clientX)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
          className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ height }}
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute inset-x-0 h-px bg-line"
              style={{ bottom: `${((tick - min) / spanY) * 100}%` }}
              aria-hidden
            />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            <path d={area} fill={color} opacity={0.1} />
            <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {point && (
            <span className="absolute inset-y-0 w-px bg-input/50" style={{ left: `${xPct(point)}%` }} aria-hidden />
          )}
          <span
            className="absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-card"
            style={{ left: `${xPct(point ?? last)}%`, bottom: `${100 - yPct(point ?? last)}%`, background: color }}
            aria-hidden
          />
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground" aria-hidden>
          <span>{points[0].label}</span>
          {points.length > 1 && <span>{last.label}</span>}
        </div>

        {point && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 rounded-xl border border-line bg-popover px-3 py-2 text-[12px] whitespace-nowrap shadow-lg"
            style={xPct(point) < 60 ? { left: `calc(${xPct(point)}% + 10px)` } : { right: `calc(${100 - xPct(point)}% + 10px)` }}
          >
            <p className="text-muted-foreground">{point.label}</p>
            <p className="nums mt-0.5 font-medium text-ink">{formatValue(point.y)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
