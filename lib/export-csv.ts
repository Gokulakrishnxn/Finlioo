import { ASSET_KINDS, LOAN_KINDS } from "@/lib/types";
import { lotsOf } from "@/lib/portfolio";
import type { VaultData } from "@/lib/vault/records";

const COLUMNS = ["Section", "Date", "Name", "Symbol", "Category", "Quantity", "Price", "Amount", "Saved", "Note"] as const;
type Row = Partial<Record<(typeof COLUMNS)[number], string | number>>;

// Quotes values and neutralises text a spreadsheet would run as a formula.
function cell(value: string | number | undefined) {
  if (value === undefined) return "";
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

// Everything the person has entered, as one spreadsheet. Sample data is left out.
export function dataToCsv(data: VaultData) {
  const rows: Row[] = [];
  const real = <T extends { sample?: boolean }>(list?: T[]) => (list ?? []).filter((x) => !x.sample);

  for (const h of real(data.holdings)) {
    for (const lot of lotsOf(h)) {
      rows.push({ Section: "Stock buy", Date: lot.date, Name: h.name, Symbol: h.symbol, Quantity: lot.quantity, Price: lot.price, Amount: lot.quantity * lot.price });
    }
  }
  for (const a of real(data.assets)) {
    const kinds: Record<string, string> = { ...ASSET_KINDS, ...LOAN_KINDS };
    rows.push({ Section: a.side === "loan" ? "Liability" : "Asset", Name: a.name, Category: kinds[a.kind] ?? a.kind, Amount: a.amount });
  }
  for (const e of real(data.entries)) {
    rows.push({ Section: e.type === "income" ? "Income" : "Expense", Date: e.date, Category: e.category, Amount: e.amount, Note: e.note });
  }
  for (const e of data.expenses?.expenses ?? []) {
    rows.push({ Section: "Expense from Gmail", Date: e.date, Name: e.merchant, Category: e.category, Amount: e.amount });
  }
  for (const g of real(data.goals)) {
    rows.push({ Section: "Goal", Date: g.targetDate, Name: g.name, Category: g.category, Amount: g.targetAmount, Saved: g.savedAmount });
    for (const c of g.contributions) rows.push({ Section: "Goal contribution", Date: c.date, Name: g.name, Amount: c.amount });
  }
  for (const s of real(data.snapshots)) rows.push({ Section: "Net worth", Date: s.date, Amount: s.netWorth });
  if (data.profile?.name || data.profile?.city) {
    rows.push({ Section: "Profile", Name: data.profile.name, Note: data.profile.city });
  }

  const lines = [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((column) => cell(row[column])).join(","))];
  // The byte-order mark makes Excel read ₹ and Indian languages correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
