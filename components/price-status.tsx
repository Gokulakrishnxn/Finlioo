"use client";

import { RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/format";
import { isMarketOpen } from "@/lib/market-hours";
import { usePrices } from "@/lib/prices";
import { t } from "@/lib/i18n";

export function PriceStatus() {
  const { updatedAt, error, loading, refresh } = usePrices();

  if (error) {
    return (
      <span data-demo-hide className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-loss" />
        {t(error)}
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 text-ink underline-offset-2 hover:underline"
        >
          <RefreshCw className={loading ? "size-3 animate-spin" : "size-3"} />
          {t("Retry")}
        </button>
      </span>
    );
  }

  const open = isMarketOpen();
  return (
    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className={open ? "size-1.5 rounded-full bg-gain" : "size-1.5 rounded-full bg-[var(--chart-muted)]"} />
      {open ? t("Market open") : t("Market closed")}
      {updatedAt && ` · Updated ${formatTime(updatedAt)}`}
    </span>
  );
}
