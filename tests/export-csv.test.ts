import { describe, expect, it } from "vitest";
import { dataToCsv } from "@/lib/export-csv";
import type { VaultData } from "@/lib/vault/records";

const rowsOf = (data: VaultData) => dataToCsv(data).replace(/^﻿/, "").trimEnd().split("\r\n");

describe("dataToCsv", () => {
  it("exports every kind of data, with one row per stock buy", () => {
    const rows = rowsOf({
      holdings: [{
        id: "h", instrumentKey: "k", symbol: "TCS", name: "TCS Ltd", buyDate: "2026-01-01", buyPrice: 15, quantity: 3,
        lots: [{ id: "a", date: "2026-01-01", price: 10, quantity: 1 }, { id: "b", date: "2026-02-01", price: 20, quantity: 2 }],
      }],
      assets: [{ id: "x", side: "asset", kind: "gold", name: "Gold", amount: 5 }, { id: "y", side: "loan", kind: "car-loan", name: "Car", amount: 9 }],
      entries: [{ id: "e", type: "expense", date: "2026-03-01", amount: 4, category: "Groceries", note: "Milk" }],
      goals: [{ id: "g", name: "Home", category: "home", targetAmount: 100, savedAmount: 7, targetDate: "2030-01-01", contributions: [{ id: "c", date: "2026-04-01", amount: 7 }] }],
      snapshots: [{ date: "2026-05-01", netWorth: 50 }],
      profile: { name: "Asha", city: "Chennai" },
    });
    expect(rows[0]).toBe("Section,Date,Name,Symbol,Category,Quantity,Price,Amount,Saved,Note");
    expect(rows).toContain("Stock buy,2026-01-01,TCS Ltd,TCS,,1,10,10,,");
    expect(rows).toContain("Stock buy,2026-02-01,TCS Ltd,TCS,,2,20,40,,");
    expect(rows).toContain("Asset,,Gold,,Gold,,,5,,");
    expect(rows).toContain("Liability,,Car,,Car loan,,,9,,");
    expect(rows).toContain("Expense,2026-03-01,,,Groceries,,,4,,Milk");
    expect(rows).toContain("Goal,2030-01-01,Home,,home,,,100,7,");
    expect(rows).toContain("Goal contribution,2026-04-01,Home,,,,,7,,");
    expect(rows).toContain("Net worth,2026-05-01,,,,,,50,,");
    expect(rows).toContain("Profile,,Asha,,,,,,,Chennai");
  });

  it("leaves out sample data", () => {
    const rows = rowsOf({
      holdings: [{ id: "h", instrumentKey: "k", symbol: "DEMO", name: "Demo", buyDate: "2026-01-01", buyPrice: 1, quantity: 1, sample: true }],
      snapshots: [{ date: "2026-01-01", netWorth: 1, sample: true }],
    });
    expect(rows).toHaveLength(1);
  });

  it("escapes commas and quotes, and blocks spreadsheet formulas", () => {
    const rows = rowsOf({
      holdings: [],
      assets: [{ id: "a", side: "asset", kind: "other", name: 'A, "B"', amount: 1 }, { id: "b", side: "asset", kind: "other", name: "=HYPERLINK(1)", amount: 1 }],
    });
    expect(rows[1]).toContain('"A, ""B"""');
    expect(rows[2]).toContain("'=HYPERLINK(1)");
  });

  it("starts with a byte-order mark for Excel", () => {
    expect(dataToCsv({ holdings: [] }).charCodeAt(0)).toBe(0xfeff);
  });
});
