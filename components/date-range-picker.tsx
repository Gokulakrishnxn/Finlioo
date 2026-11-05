"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { DateRange as DayRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select as NativeSelect } from "@/components/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import {
  calendarYearRange,
  fyEndYear,
  fyRange,
  monthEnd,
  monthKey,
  monthStart,
  PRESETS,
  rangeLabel,
  shiftMonth,
  validateRange,
  type DateRange,
  type RangeMode,
  type YearKind,
} from "@/lib/date-range";
import { useDateRange } from "@/lib/date-range-context";
import { uiLocale } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const MODES: { value: RangeMode; label: string }[] = [
  { value: "date", label: "Date to date" },
  { value: "month", label: "Month to month" },
  { value: "year", label: "Year to year" },
];

const toLocalDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function monthOptions(today: string, earliest: string) {
  const out: string[] = [];
  const first = monthKey(earliest < today ? earliest : today);
  // Always offer at least two years, so a new user can still move around.
  const start = first < shiftMonth(monthKey(today), -23) ? first : shiftMonth(monthKey(today), -23);
  for (let key = monthKey(today); key >= start; key = shiftMonth(key, -1)) out.push(key);
  return out;
}

const monthName = (key: string) =>
  toLocalDate(monthStart(key)).toLocaleDateString(uiLocale(), { month: "long", year: "numeric" });

export function DateRangePicker({ className }: { className?: string }) {
  const { range, preset, today, earliest, choosePreset, chooseRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<RangeMode>("date");
  const [draft, setDraft] = useState<DateRange>(range);
  const [yearKind, setYearKind] = useState<YearKind>("fy");
  const [startedAt, setStartedAt] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDraft(range);
      setStartedAt(null);
    }
  }

  if (!today) return null;

  const problem = validateRange(draft, today);
  const presetLabel = preset ? PRESETS.find((p) => p.id === preset)?.label : null;
  const months = monthOptions(today, earliest);
  const firstYear = Number((earliest < today ? earliest : today).slice(0, 4));
  const lastYear = Number(today.slice(0, 4));
  const startYear = Math.min(firstYear, lastYear - 4);
  const years: number[] = [];
  for (let y = yearKind === "fy" ? fyEndYear(today) : lastYear; y >= startYear; y--) years.push(y);

  const yearRange = (year: number) => (yearKind === "fy" ? fyRange(year) : calendarYearRange(year));
  const yearLabel = (year: number) => (yearKind === "fy" ? `FY ${year - 1}–${String(year).slice(-2)}` : String(year));
  const draftFromYear = yearKind === "fy" ? fyEndYear(draft.from) : Number(draft.from.slice(0, 4));
  const draftToYear = yearKind === "fy" ? fyEndYear(draft.to) : Number(draft.to.slice(0, 4));

  const selected: DayRange = { from: toLocalDate(draft.from), to: toLocalDate(draft.to) };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button variant="outline" aria-label={t("Date range: {range}", { range: rangeLabel(range) })} className={cn("h-10 rounded-xl px-3", className)} />
        }
      >
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-[13px] font-medium whitespace-nowrap text-ink">{presetLabel ? t(presetLabel) : rangeLabel(range)}</span>
        {presetLabel && (
          <span className="hidden text-[12px] whitespace-nowrap text-muted-foreground sm:inline">{rangeLabel(range)}</span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),36rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-line bg-popover p-0 shadow-xl ring-0 sm:flex-row"
      >
        <ul className="flex shrink-0 gap-1 overflow-x-auto border-b border-line p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0">
          {PRESETS.map((p) => (
            <li key={p.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={preset === p.id}
                onClick={() => {
                  choosePreset(p.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] whitespace-nowrap text-body transition-colors hover:bg-muted",
                  preset === p.id && "bg-success-soft font-medium text-success hover:bg-success-soft dark:bg-muted dark:text-ink",
                )}
              >
                {t(p.label)}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          <Select value={mode} onValueChange={(next) => setMode(next as RangeMode)}>
            <SelectTrigger>
              <SelectValue placeholder={t("Choose how to pick dates")} />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {t(m.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {mode === "date" && (
            <Calendar
              mode="range"
              selected={selected}
              defaultMonth={selected.from}
              endMonth={toLocalDate(today)}
              disabled={{ after: toLocalDate(today) }}
              onDayClick={(day) => {
                // The first click starts a new range; the second finishes it, in either order.
                const picked = toIso(day);
                if (startedAt) {
                  setDraft(picked < startedAt ? { from: picked, to: startedAt } : { from: startedAt, to: picked });
                  setStartedAt(null);
                } else {
                  setDraft({ from: picked, to: picked });
                  setStartedAt(picked);
                }
              }}
              className="mx-auto bg-transparent p-0"
            />
          )}

          {mode === "month" && (
            <div className="grid grid-cols-2 gap-2">
              <PairField label={t("From")}>
                <NativeSelect
                  aria-label={t("From month")}
                  value={monthKey(draft.from)}
                  onChange={(e) => setDraft({ ...draft, from: monthStart(e.target.value) })}
                  className="h-10 text-[13px]"
                >
                  {months.map((key) => (
                    <option key={key} value={key}>
                      {monthName(key)}
                    </option>
                  ))}
                </NativeSelect>
              </PairField>
              <PairField label={t("To")}>
                <NativeSelect
                  aria-label={t("To month")}
                  value={monthKey(draft.to)}
                  onChange={(e) => {
                    const end = monthEnd(e.target.value);
                    setDraft({ ...draft, to: end > today ? today : end });
                  }}
                  className="h-10 text-[13px]"
                >
                  {months.map((key) => (
                    <option key={key} value={key}>
                      {monthName(key)}
                    </option>
                  ))}
                </NativeSelect>
              </PairField>
            </div>
          )}

          {mode === "year" && (
            <div className="flex flex-col gap-2">
              <div role="group" aria-label={t("Year type")} className="flex gap-0.5 self-start rounded-lg bg-sand p-0.5">
                {(
                  [
                    { value: "fy", label: "Financial year" },
                    { value: "calendar", label: "Calendar year" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={yearKind === option.value}
                    onClick={() => {
                      setYearKind(option.value);
                      const convert = option.value === "fy" ? fyRange : calendarYearRange;
                      const year = option.value === "fy" ? fyEndYear(today) : lastYear;
                      setDraft({ from: convert(year).from, to: today });
                    }}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[12px] text-body",
                      yearKind === option.value && "bg-card font-medium text-ink shadow-sm",
                    )}
                  >
                    {t(option.label)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PairField label={t("From")}>
                  <NativeSelect
                    aria-label={t("From year")}
                    value={draftFromYear}
                    onChange={(e) => setDraft({ ...draft, from: yearRange(Number(e.target.value)).from })}
                    className="h-10 text-[13px]"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {yearLabel(y)}
                      </option>
                    ))}
                  </NativeSelect>
                </PairField>
                <PairField label={t("To")}>
                  <NativeSelect
                    aria-label={t("To year")}
                    value={draftToYear}
                    onChange={(e) => {
                      const end = yearRange(Number(e.target.value)).to;
                      setDraft({ ...draft, to: end > today ? today : end });
                    }}
                    className="h-10 text-[13px]"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {yearLabel(y)}
                      </option>
                    ))}
                  </NativeSelect>
                </PairField>
              </div>
            </div>
          )}

          {problem && (
            <p role="alert" className="text-[12px] text-loss">
              {problem === "order" ? t("The end date is before the start date.") : t("That period is in the future.")}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
            <p className="min-w-0 truncate text-[12px] text-muted-foreground">{rangeLabel(draft)}</p>
            <Button
              disabled={Boolean(problem)}
              onClick={() => {
                chooseRange(draft);
                setOpen(false);
              }}
              className="h-9 rounded-xl px-4"
            >
              {t("Apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PairField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
