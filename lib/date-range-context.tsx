"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { previousRange, presetRange, type DateRange, type PresetId } from "@/lib/date-range";
import { todayLocal } from "@/lib/format";
import { getPreferences } from "@/lib/preferences";
import { useStore } from "@/lib/store";

type Selection = { preset: PresetId } | { preset: null; custom: DateRange };

type DateRangeUI = {
  range: DateRange;
  previous: DateRange;
  preset: PresetId | null;
  today: string;
  earliest: string;
  choosePreset: (preset: PresetId) => void;
  chooseRange: (range: DateRange) => void;
};

const DateRangeContext = createContext<DateRangeUI | null>(null);

// One period shared by Analytics, Transactions and Insights, so moving between them
// keeps the same dates. It starts on the default chosen in Settings.
export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const { ready, entries, expenses, snapshots } = useStore();
  const [chosen, setChosen] = useState<Selection | null>(null);

  const value = useMemo<DateRangeUI>(() => {
    // Dates are read only in the browser; Next.js prerenders pages without them.
    const today = ready ? todayLocal() : "";
    const dates = [
      ...(entries ?? []).map((e) => e.date),
      ...(expenses?.expenses ?? []).map((e) => e.date),
      ...(snapshots ?? []).map((s) => s.date),
    ];
    const earliest = dates.reduce((min, date) => (date < min ? date : min), today);
    const selection = chosen ?? { preset: getPreferences().defaultRange };
    const range = selection.preset
      ? today
        ? presetRange(selection.preset, today, earliest)
        : { from: "", to: "" }
      : selection.custom;
    return {
      range,
      previous: range.from ? previousRange(range) : range,
      preset: selection.preset,
      today,
      earliest,
      choosePreset: (preset) => setChosen({ preset }),
      chooseRange: (custom) => setChosen({ preset: null, custom }),
    };
  }, [ready, entries, expenses, snapshots, chosen]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ui = useContext(DateRangeContext);
  if (!ui) throw new Error("useDateRange must be used inside DateRangeProvider");
  return ui;
}
