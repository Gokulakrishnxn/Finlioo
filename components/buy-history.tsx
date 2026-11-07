"use client";

import { History, X } from "lucide-react";
import { Change } from "@/components/change";
import { formatDate, formatMoney, formatQuantity } from "@/lib/format";
import { lotsOf } from "@/lib/portfolio";
import type { Holding } from "@/lib/types";
import { t } from "@/lib/i18n";

// Every purchase of one stock as a timeline, newest first. Each buy shows its
// date, shares, price and cost, how much of the position it is, and, when a live
// price is known, how it is doing. Lays out cleanly from phones to desktops.
export function BuyHistory({
  holding,
  price,
  onRemove,
}: {
  holding: Holding;
  price?: number;
  onRemove: (lotId: string) => void;
}) {
  const lots = lotsOf(holding);
  const total = lots.reduce((s, l) => s + l.quantity, 0);
  const invested = lots.reduce((s, l) => s + l.quantity * l.price, 0);
  const newestFirst = [...lots].reverse();
  const many = lots.length > 1;

  return (
    <section aria-labelledby="buy-history" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 id="buy-history" className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-ink">
          <History className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          {t("Buy history")}
          <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {lots.length}
          </span>
        </h3>
        {many && (
          <p className="nums text-[12px] text-muted-foreground">
            {t("Average")} <span className="font-medium text-ink">{formatMoney(holding.buyPrice)}</span>
          </p>
        )}
      </div>

      <ol className="mt-3">
        {newestFirst.map((lot, index) => {
          const cost = lot.quantity * lot.price;
          const share = total ? (lot.quantity / total) * 100 : 0;
          const gain = price !== undefined ? lot.quantity * price - cost : undefined;
          const last = index === newestFirst.length - 1;
          return (
            <li key={lot.id} className="group relative flex gap-3 pb-3 last:pb-0">
              {/* Timeline rail */}
              <div aria-hidden className="relative flex w-3 shrink-0 justify-center">
                {!last && <span className="absolute top-4 -bottom-3 w-px bg-line" />}
                <span className="relative mt-[7px] size-2.5 rounded-full border-2 border-card bg-gain ring-1 ring-gain/40" />
              </div>

              <div className="min-w-0 flex-1 rounded-xl border border-line bg-card p-3.5 transition-colors hover:border-ink/20">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-medium text-ink">{formatDate(lot.date)}</p>
                  {many && (
                    <button
                      onClick={() => onRemove(lot.id)}
                      aria-label={t("Remove this buy")}
                      title={t("Remove this buy")}
                      className="-mt-1.5 -mr-2 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-sand hover:text-loss focus-visible:outline-2 focus-visible:outline-ring [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p
                    className="nums text-[12.5px] whitespace-nowrap text-muted-foreground"
                    title={t("{qty} shares at {price}", { qty: lot.quantity, price: formatMoney(lot.price) })}
                  >
                    {formatQuantity(lot.quantity)} × {formatMoney(lot.price)}
                  </p>
                  <div className="ml-auto text-right">
                    <p className="nums text-[14px] font-medium whitespace-nowrap text-ink">{formatMoney(cost)}</p>
                    {gain !== undefined && (
                      <Change amount={gain} pct={cost ? (gain / cost) * 100 : 0} className="mt-0.5 text-[12px]" />
                    )}
                  </div>
                </div>

                {many && (
                  <div className="mt-3 flex items-center gap-2.5">
                    <div
                      role="img"
                      aria-label={t("{pct}% of your shares", { pct: Math.round(share) })}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"
                    >
                      <div className="h-full rounded-full bg-gain" style={{ width: `${Math.max(share, 3)}%` }} />
                    </div>
                    <span className="nums w-9 text-right text-[11px] text-muted-foreground">{Math.round(share)}%</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {many && (
        <dl className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-sand px-4 py-3 text-[13px]">
          <dt className="text-muted-foreground">{t("Total")}</dt>
          <dd className="nums [overflow-wrap:anywhere] text-ink">
            <span className="font-medium">{formatQuantity(total)}</span> {t("shares")} ·{" "}
            <span className="font-medium">{formatMoney(invested)}</span> {t("invested")}
          </dd>
        </dl>
      )}
    </section>
  );
}
