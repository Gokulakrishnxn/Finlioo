"use client";

import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function SampleBanner() {
  const { holdings, removeSample } = useStore();
  if (!holdings.some((h) => h.sample)) return null;

  return (
    <div data-demo-hide className="flex items-center justify-between gap-4 rounded-2xl bg-card px-5 py-3 text-[13px] text-body ring-1 ring-line">
      <span>
        {t("You're looking at sample data. Stock prices are real; the buy details, assets, loans, income and spending are examples.")}
      </span>
      <button onClick={removeSample} className="shrink-0 font-medium text-ink hover:underline">
        {t("Remove sample")}
      </button>
    </div>
  );
}
