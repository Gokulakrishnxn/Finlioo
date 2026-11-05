import { activeLocale } from "@/lib/locale";
import { getPreferences, uiLocale } from "@/lib/preferences";

// Money and dates in Indian style, like ₹1,24,000.

const MASK = "₹ ••••";

const moneyFormats = new Map<string, Intl.NumberFormat>();

function moneyFormat() {
  const { currency } = activeLocale();
  const language = getPreferences().numberFormat === "indian" ? "en-IN" : "en-US";
  let f = moneyFormats.get(language);
  if (!f) {
    f = new Intl.NumberFormat(language, { style: "currency", currency, maximumFractionDigits: 2 });
    moneyFormats.set(language, f);
  }
  return f;
}

export const formatMoney = (value: number) => (getPreferences().hideAmounts ? MASK : moneyFormat().format(value));

export const formatSignedMoney = (value: number) =>
  getPreferences().hideAmounts ? MASK : `${value >= 0 ? "+" : "−"}${moneyFormat().format(Math.abs(value))}`;

const INTERNATIONAL_UNITS: [number, string][] = [
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

// Short amounts: ₹3.46L and ₹1.2Cr, or ₹346K and ₹12M in international format.
export function compactMoney(value: number) {
  const { hideAmounts, numberFormat } = getPreferences();
  if (hideAmounts) return MASK;
  const { symbol, compactUnits } = activeLocale();
  const units = numberFormat === "indian" ? compactUnits : INTERNATIONAL_UNITS;
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  for (const [size, unit] of units) {
    if (abs >= size) return `${sign}${symbol}${(abs / size).toFixed(size >= 1e5 ? 2 : 1)}${unit}`;
  }
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

export const formatPct = (value: number) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;

// Times and dates use the person's own device time zone, in Indian date style.
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(uiLocale(), { hour: "numeric", minute: "2-digit" });

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(uiLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatShortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(uiLocale(), { day: "numeric", month: "short" });

export const formatMonth = (yearMonth: string, style: "long" | "short-year" = "long") =>
  new Date(`${yearMonth}-01T00:00:00`).toLocaleDateString(
    uiLocale(),
    style === "long" ? { month: "long" } : { month: "short", year: "numeric" },
  );

// Today's date on this device, as "YYYY-MM-DD".
export const todayLocal = () => new Intl.DateTimeFormat("en-CA").format(new Date());

// Today in a given time zone (server routes use the market's zone).
export const todayIn = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
