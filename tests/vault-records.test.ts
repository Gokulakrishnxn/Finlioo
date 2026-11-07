import { describe, expect, it } from "vitest";
import { applyChanges, countLocalItems, diffRecords, mergeLocalData, toRecords, type VaultData } from "@/lib/vault/records";
import type { Holding } from "@/lib/types";

const holding = (id: string, key: string, extra: Partial<Holding> = {}): Holding => ({
  id,
  instrumentKey: key,
  symbol: key,
  name: key,
  buyDate: "2026-01-01",
  buyPrice: 10,
  quantity: 5,
  lots: [{ id: `${id}-l`, date: "2026-01-01", price: 10, quantity: 5 }],
  ...extra,
});

describe("records", () => {
  it("never turns sample data into records", () => {
    const data: VaultData = {
      holdings: [holding("real", "A"), holding("demo", "B", { sample: true })],
      entries: [{ id: "e", type: "expense", date: "2026-01-01", amount: 1, category: "x", sample: true }],
      snapshots: [{ date: "2026-01-01", netWorth: 1, sample: true }],
    };
    expect([...toRecords(data).keys()]).toEqual(["holding:real"]);
  });

  it("deletes a saved day once it is marked as sample", () => {
    const real: VaultData = { holdings: [], snapshots: [{ date: "2026-11-08", netWorth: 5 }] };
    const sample: VaultData = { holdings: [], snapshots: [{ date: "2026-11-08", netWorth: 5, sample: true }] };
    expect(diffRecords(real, sample)).toEqual([{ kind: "snapshot", id: "2026-11-08", json: null }]);
  });

  it("finds only what changed, including deletions", () => {
    const prev: VaultData = { holdings: [holding("a", "A"), holding("b", "B")] };
    const next: VaultData = { holdings: [holding("a", "A", { quantity: 9 })] };
    const changes = diffRecords(prev, next);
    expect(changes.map((c) => [c.kind, c.id, c.json === null])).toEqual([
      ["holding", "a", false],
      ["holding", "b", true],
    ]);
  });

  it("reports nothing when nothing changed", () => {
    const data: VaultData = { holdings: [holding("a", "A")], profile: { name: "G" } };
    expect(diffRecords(data, structuredClone(data))).toEqual([]);
  });

  it("applies saved changes and leaves this device's sample data alone", () => {
    const data: VaultData = { holdings: [holding("a", "A"), holding("demo", "B", { sample: true })], snapshots: [{ date: "2026-03-01", netWorth: 3 }] };
    const out = applyChanges(data, [
      { kind: "holding", id: "a", json: null },
      { kind: "holding", id: "c", json: JSON.stringify(holding("c", "C")) },
      { kind: "snapshot", id: "2026-01-01", json: JSON.stringify({ date: "2026-01-01", netWorth: 1 }) },
      { kind: "profile", id: "current", json: JSON.stringify({ name: "G" }) },
    ]);
    expect(out.holdings.map((h) => h.id)).toEqual(["demo", "c"]);
    expect(out.snapshots?.map((s) => s.date)).toEqual(["2026-01-01", "2026-03-01"]);
    expect(out.profile?.name).toBe("G");
  });

  it("round-trips everything through records", () => {
    const data: VaultData = { holdings: [holding("a", "A")], assets: [{ id: "x", side: "asset", kind: "gold", name: "Gold", amount: 5 }], profile: { name: "G" } };
    const out = applyChanges({ holdings: [] }, [...toRecords(data).values()]);
    expect(out.holdings).toEqual(data.holdings);
    expect(out.assets).toEqual(data.assets);
    expect(out.profile).toEqual(data.profile);
  });
});

describe("moving local data", () => {
  it("counts only real items", () => {
    expect(countLocalItems({ holdings: [holding("a", "A"), holding("b", "B", { sample: true })], goals: [] })).toBe(1);
  });

  it("combines a stock held in both, and skips sample data", () => {
    const account: VaultData = { holdings: [holding("cloud", "TCS")], profile: { name: "Cloud" } };
    const local: VaultData = {
      holdings: [holding("local", "TCS", { lots: [{ id: "x", date: "2026-02-01", price: 20, quantity: 5 }], buyPrice: 20 }), holding("new", "INFY"), holding("demo", "ITC", { sample: true })],
      profile: { name: "Local" },
    };
    const out = mergeLocalData(account, local);
    expect(out.holdings.map((h) => h.id)).toEqual(["cloud", "new"]);
    expect(out.holdings[0].quantity).toBe(10);
    expect(out.holdings[0].lots).toHaveLength(2);
    expect(out.profile?.name).toBe("Cloud");
  });

  it("is safe to run twice", () => {
    const local: VaultData = { holdings: [holding("a", "A")], entries: [{ id: "e", type: "expense", date: "2026-01-01", amount: 1, category: "x" }] };
    const once = mergeLocalData({ holdings: [] }, local);
    const twice = mergeLocalData(once, local);
    expect(twice.holdings).toHaveLength(1);
    expect(twice.holdings[0].quantity).toBe(5);
    expect(twice.entries).toHaveLength(1);
  });
});
