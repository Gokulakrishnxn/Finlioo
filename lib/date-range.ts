// Date ranges for looking back at earlier periods. Dates are "YYYY-MM-DD" strings, so
// they compare correctly as text and never shift across time zones. Pure helpers; safe
// on server and client.

export type DateRange = { from: string; to: string };
export type RangeMode = "date" | "month" | "year";
export type YearKind = "fy" | "calendar";

export const PRESETS = [
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "last-3", label: "Last 3 months" },
  { id: "last-6", label: "Last 6 months" },
  { id: "this-fy", label: "This financial year" },
  { id: "last-fy", label: "Last financial year" },
  { id: "all", label: "All time" },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"];

const FY_START_MONTH = 4; // April

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);
const fromDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (value: string, days: number) => fromDate(new Date(toDate(value).getTime() + days * 864e5));

export const monthKey = (value: string) => value.slice(0, 7);

export function shiftMonth(key: string, by: number) {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + by;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export const monthStart = (key: string) => `${key}-01`;

export function monthEnd(key: string) {
  const [y, m] = key.split("-").map(Number);
  return iso(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate());
}

// The calendar year a financial year ends in: FY27 runs April 2026 to March 2027.
export function fyEndYear(value: string) {
  const [y, m] = value.split("-").map(Number);
  return m >= FY_START_MONTH ? y + 1 : y;
}

export const fyRange = (endYear: number): DateRange => ({
  from: iso(endYear - 1, FY_START_MONTH, 1),
  to: monthEnd(`${endYear}-03`),
});

export const calendarYearRange = (year: number): DateRange => ({ from: iso(year, 1, 1), to: iso(year, 12, 31) });

const capAtToday = (range: DateRange, today: string): DateRange => ({
  from: range.from,
  to: range.to > today ? today : range.to,
});

export function presetRange(preset: PresetId, today: string, earliest: string): DateRange {
  const month = monthKey(today);
  switch (preset) {
    case "this-month":
      return { from: monthStart(month), to: today };
    case "last-month":
      return { from: monthStart(shiftMonth(month, -1)), to: monthEnd(shiftMonth(month, -1)) };
    case "last-3":
      return { from: monthStart(shiftMonth(month, -2)), to: today };
    case "last-6":
      return { from: monthStart(shiftMonth(month, -5)), to: today };
    case "this-fy":
      return capAtToday(fyRange(fyEndYear(today)), today);
    case "last-fy":
      return fyRange(fyEndYear(today) - 1);
    case "all":
      return { from: earliest < today ? earliest : monthStart(month), to: today };
  }
}

export const inRange = (date: string, range: DateRange) => date >= range.from && date <= range.to;

export const daysIn = (range: DateRange) =>
  Math.round((toDate(range.to).getTime() - toDate(range.from).getTime()) / 864e5) + 1;

// The period just before, for comparisons. Whole months compare with the same number
// of whole months, so February isn't measured against a 28-day slice of January.
export function previousRange(range: DateRange): DateRange {
  const startsMonth = range.from.endsWith("-01");
  if (startsMonth && range.to === monthEnd(monthKey(range.to))) {
    const [fy, fm] = monthKey(range.from).split("-").map(Number);
    const [ty, tm] = monthKey(range.to).split("-").map(Number);
    const months = (ty - fy) * 12 + (tm - fm) + 1;
    return {
      from: monthStart(shiftMonth(monthKey(range.from), -months)),
      to: monthEnd(shiftMonth(monthKey(range.to), -months)),
    };
  }
  const days = daysIn(range);
  return { from: addDays(range.from, -days), to: addDays(range.from, -1) };
}

export type RangeProblem = "order" | "future" | null;

export function validateRange(range: DateRange, today: string): RangeProblem {
  if (range.to < range.from) return "order";
  if (range.from > today) return "future";
  return null;
}

export function rangeLabel(range: DateRange, language = "en-IN") {
  const format = (value: string, withYear: boolean) =>
    toDate(value).toLocaleDateString(language, {
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    });
  if (range.from === range.to) return format(range.from, true);
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  return `${format(range.from, !sameYear)} – ${format(range.to, true)}`;
}

// How a range is split up on charts: fine for short ranges, coarser for long ones.
export type Bucket = { key: string; label: string; range: DateRange };

export function bucketsFor(range: DateRange, language = "en-IN"): Bucket[] {
  const days = daysIn(range);
  const clip = (from: string, to: string): DateRange => ({
    from: from < range.from ? range.from : from,
    to: to > range.to ? range.to : to,
  });
  const out: Bucket[] = [];

  if (days <= 62) {
    // Weekly, counted from the start of the range.
    for (let start = range.from; start <= range.to; start = addDays(start, 7)) {
      const clipped = clip(start, addDays(start, 6));
      out.push({
        key: start,
        label: toDate(start).toLocaleDateString(language, { day: "numeric", month: "short", timeZone: "UTC" }),
        range: clipped,
      });
    }
    return out;
  }

  const months = (Number(range.to.slice(0, 4)) - Number(range.from.slice(0, 4))) * 12 + Number(range.to.slice(5, 7)) - Number(range.from.slice(5, 7)) + 1;
  const step = months <= 18 ? 1 : months <= 48 ? 3 : 12;

  if (step === 12) {
    for (let end = fyEndYear(range.from); fyRange(end).from <= range.to; end++) {
      const fy = fyRange(end);
      out.push({ key: `fy${end}`, label: `FY${String(end).slice(-2)}`, range: clip(fy.from, fy.to) });
    }
    return out;
  }

  for (let key = monthKey(range.from); monthStart(key) <= range.to; key = shiftMonth(key, step)) {
    const label = toDate(monthStart(key)).toLocaleDateString(language, {
      month: "short",
      year: months > 12 || step > 1 ? "2-digit" : undefined,
      timeZone: "UTC",
    });
    out.push({ key, label, range: clip(monthStart(key), monthEnd(shiftMonth(key, step - 1))) });
  }
  return out;
}
