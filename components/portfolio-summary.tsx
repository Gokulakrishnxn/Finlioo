"use client";

import { Change } from "@/components/change";
import { CountUp } from "@/components/count-up";
import { PriceStatus } from "@/components/price-status";
import { formatMoney } from "@/lib/format";
import { activeLocale } from "@/lib/locale";
import { totals, type Position } from "@/lib/portfolio";
import { t } from "@/lib/i18n";

export function PortfolioSummary({ positions }: { positions: Position[] }) {
  const sum = totals(positions);
  // Profit or loss on whichever stocks have a price, so it still shows while others load.
  const priced = positions.filter((p) => p.value !== undefined);
  const partial = !sum.complete && priced.length > 0;
  const pInvested = priced.reduce((s, p) => s + p.invested, 0);
  const pGain = priced.reduce((s, p) => s + (p.gain ?? 0), 0);
  const gain = sum.complete ? sum.gain : partial ? pGain : undefined;
  const gainPct = sum.complete ? sum.gainPct : partial ? (pInvested ? (pGain / pInvested) * 100 : 0) : undefined;

  return (
    <section className="card-surface p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-medium text-ink">{t("Your portfolio")}</h2>
        <PriceStatus />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 *:min-w-0 xl:grid-cols-4 xl:items-end xl:gap-x-12">
        <div className="col-span-2 xl:col-span-1">
          <p className="text-[13px] text-muted-foreground">{t("Worth now")}</p>
          {sum.complete ? (
            <CountUp
              value={sum.value}
              format={formatMoney}
              className="nums mt-1 block text-[30px] leading-none [overflow-wrap:anywhere] sm:text-[36px] font-semibold tracking-tight text-ink"
            />
          ) : (
            <p className="nums mt-1 text-[30px] leading-none sm:text-[36px] font-semibold tracking-tight text-muted-foreground">
              {activeLocale().symbol}—
            </p>
          )}
        </div>
        <Stat label={t("Today")} amount={sum.complete ? sum.dayChange : undefined} pct={sum.complete ? sum.dayChangePct : undefined} />
        <Stat label={t("Profit / loss")} amount={gain} pct={gainPct} />
        <div className="col-span-2 xl:col-span-1">
          <p className="text-[13px] text-muted-foreground">{t("Total investment")}</p>
          <p className="nums mt-1 text-[17px] text-ink">{formatMoney(sum.invested)}</p>
        </div>
      </div>
      {partial ? (
        <p className="mt-4 text-[12px] text-muted-foreground">
          {t("Profit / loss covers {priced} of {total} stocks with a price.", { priced: priced.length, total: positions.length })}
        </p>
      ) : null}
    </section>
  );
}

function Stat({ label, amount, pct }: { label: string; amount?: number; pct?: number }) {
  return (
    <div>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <Change amount={amount} pct={pct} className="mt-1 block text-[17px] [overflow-wrap:anywhere]" />
    </div>
  );
}
