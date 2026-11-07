"use client";

import { ChevronRight } from "lucide-react";
import { Change } from "@/components/change";
import { BrandLogo } from "@/components/brand-logo";
import { InitialBadge } from "@/components/initial-badge";
import { stockDomain } from "@/lib/brands";
import { formatMoney } from "@/lib/format";
import type { Position } from "@/lib/portfolio";
import { t } from "@/lib/i18n";

export function HoldingsList({
  positions,
  onSelect,
}: {
  positions: Position[];
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col">
      {positions.map((p) => (
        <li key={p.holding.id} className="border-b border-line last:border-b-0">
          <button
            onClick={() => onSelect(p.holding.id)}
            className="group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-2xl sm:gap-4 px-3 py-4 text-left transition-colors hover:bg-sand/70"
          >
            <span className="shrink-0"><BrandLogo domain={stockDomain(p.holding.symbol)} fallback={<InitialBadge symbol={p.holding.symbol} />} /></span>
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-2 font-medium text-ink">
                <span className="truncate">{p.holding.symbol}</span>
                {p.holding.sample && (
                  <span data-demo-hide className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-line">
                    {t("Sample")}
                  </span>
                )}
              </p>
              <p className="truncate text-[13px] text-muted-foreground">
                {p.holding.quantity === 1 ? t("1 share") : t("{count} shares", { count: p.holding.quantity })} ·{" "}
                {p.holding.name}
              </p>
            </div>
            <div className="hidden w-28 text-right lg:block lg:w-32">
              <p className="nums text-[15px] text-ink">
                {p.quote ? formatMoney(p.quote.price) : "—"}
              </p>
              <Change amount={p.dayChange} pct={p.dayChangePct} className="text-[12px]" />
            </div>
            <div className="shrink-0 text-right lg:w-40">
              <p className="nums whitespace-nowrap text-[15px] font-medium text-ink">
                {p.value !== undefined ? formatMoney(p.value) : formatMoney(p.invested)}
              </p>
              {p.value !== undefined ? (
                <Change amount={p.gain} pct={p.gainPct} className="text-[12px]" />
              ) : (
                <p className="text-[12px] text-muted-foreground">{t("invested")}</p>
              )}
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-ink" />
          </button>
        </li>
      ))}
    </ul>
  );
}
