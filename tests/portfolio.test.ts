import { describe, expect, it } from "vitest";
import { lotsOf, position, totals, withLots } from "@/lib/portfolio";
import type { Holding } from "@/lib/types";

const base: Holding = {
  id: "h1",
  instrumentKey: "NSE_EQ|INE467B01029",
  symbol: "TCS",
  name: "TCS",
  buyDate: "2026-01-02",
  buyPrice: 10,
  quantity: 700,
};
const lot = (id: string, date: string, quantity: number, price: number) => ({ id, date, quantity, price });

describe("lots", () => {
  it("treats an older holding with no lots as one buy", () => {
    expect(lotsOf(base)).toHaveLength(1);
    expect(lotsOf(base)[0]).toMatchObject({ quantity: 700, price: 10, date: "2026-01-02" });
  });

  it("rolls lots up into quantity, weighted average and earliest date", () => {
    const h = withLots(base, [lot("b", "2026-02-01", 600, 20), lot("a", "2026-01-02", 700, 10)]);
    expect(h.quantity).toBe(1300);
    expect(h.buyPrice).toBeCloseTo(14.62, 2);
    expect(h.buyDate).toBe("2026-01-02");
  });

  it("sums real buy costs, not the rounded average", () => {
    const h = withLots(base, [lot("a", "2026-01-02", 700, 10), lot("b", "2026-02-01", 600, 20)]);
    expect(position(h).invested).toBe(19000);
  });
});

describe("totals", () => {
  it("is incomplete until every stock has a price", () => {
    const a = position(base, { price: 12, prevClose: 11 });
    const b = position({ ...base, id: "h2" });
    expect(totals([a, b]).complete).toBe(false);
    expect(totals([a, b]).invested).toBe(14000);
  });

  it("adds value and gain once priced", () => {
    const sum = totals([position(base, { price: 12, prevClose: 11 })]);
    expect(sum.complete).toBe(true);
    if (sum.complete) {
      expect(sum.value).toBe(8400);
      expect(sum.gain).toBe(1400);
      expect(sum.gainPct).toBeCloseTo(20);
    }
  });
});
