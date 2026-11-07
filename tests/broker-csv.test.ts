import { describe, expect, it } from "vitest";
import { parseHoldingsCsv } from "@/lib/broker-csv";

describe("parseHoldingsCsv", () => {
  it("reads a Zerodha-style export, cleaning series suffixes and number commas", () => {
    const { rows, error } = parseHoldingsCsv(
      'Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L\nTCS,10,3500.5,4000,40000,5000\nRELIANCE-EQ,5,"1,200.00",1300,6500,500',
    );
    expect(error).toBeUndefined();
    expect(rows).toEqual([
      { symbol: "TCS", isin: undefined, name: undefined, quantity: 10, avgCost: 3500.5 },
      { symbol: "RELIANCE", isin: undefined, name: undefined, quantity: 5, avgCost: 1200 },
    ]);
  });

  it("uses ISIN and company name, and does not take buy value as the average", () => {
    const { rows } = parseHoldingsCsv(
      "Stock Name,ISIN,Quantity,Average buy price,Buy value,Closing price\nTata Consultancy Services Ltd,INE467B01029,10,3500.5,35005,4000",
    );
    expect(rows[0]).toMatchObject({ isin: "INE467B01029", name: "Tata Consultancy Services Ltd", quantity: 10, avgCost: 3500.5 });
  });

  it("handles semicolons, a byte-order mark and title lines above the header", () => {
    const { rows } = parseHoldingsCsv("﻿My holdings report\nDate: today\nScrip Name;Free Qty;Avg Price;Market Value\nINFY;20;1400;28000");
    expect(rows[0]).toMatchObject({ name: "INFY", quantity: 20, avgCost: 1400 });
  });

  it("skips rows with no quantity and explains files it can't read", () => {
    expect(parseHoldingsCsv("Symbol,Qty,Avg cost\nTCS,0,100").error).toBeTruthy();
    expect(parseHoldingsCsv("hello,world").error).toBeTruthy();
    expect(parseHoldingsCsv("Symbol,Qty\nTCS,5").error).toBeTruthy();
  });
});
