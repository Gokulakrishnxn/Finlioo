// Finlio is for people in India: rupees, Indian number grouping, NSE stocks and
// the April to March financial year. Pure data; safe on server and client.

export type Locale = {
  name: string;
  language: string; // Intl locale for numbers and dates
  currency: "INR";
  symbol: string;
  market: string;
  marketTimeZone: string;
  marketOpen: [number, number]; // [hour, minute] local to the market
  marketClose: [number, number];
  fyStartMonth: number; // 4 = April
  fyLabel: (endYear: number) => string; // "FY27"
  compactUnits: [number, string][]; // largest first
};

const INDIA: Locale = {
  name: "India",
  language: "en-IN",
  currency: "INR",
  symbol: "₹",
  market: "NSE",
  marketTimeZone: "Asia/Kolkata",
  marketOpen: [9, 15],
  marketClose: [15, 30],
  fyStartMonth: 4,
  fyLabel: (endYear) => `FY${String(endYear).slice(-2)}`,
  compactUnits: [
    [1e7, "Cr"],
    [1e5, "L"],
    [1e3, "K"],
  ],
};

export function activeLocale(): Locale {
  return INDIA;
}
