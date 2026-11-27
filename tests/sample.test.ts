import { describe, expect, it } from "vitest";
import { sampleAssets, sampleEntries, sampleGoals, sampleHoldings, sampleSnapshots } from "@/lib/sample";
import { toRecords } from "@/lib/vault/records";

const today = "2026-11-26";
const withIds = <T>(list: T[]) => list.map((item, i) => ({ ...item, id: `demo-${i}` }));

describe("demo data", () => {
  it("never dates anything in the future", () => {
    const dated = [...sampleEntries(today), ...sampleSnapshots(today, 1_000_000)];
    expect(dated.length).toBeGreaterThan(100);
    expect(dated.every((d) => d.date <= today)).toBe(true);
  });

  it("is never saved to the account", () => {
    const records = toRecords({
      holdings: withIds(sampleHoldings()),
      assets: withIds(sampleAssets()),
      entries: withIds(sampleEntries(today)),
      goals: withIds(sampleGoals(today)),
      snapshots: sampleSnapshots(today, 1_000_000),
    });
    expect(records.size).toBe(0);
  });
});
