import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { open, seal, VaultNotConfiguredError } from "@/lib/vault/crypto";

const secret = JSON.stringify({ symbol: "TCS", quantity: 700, buyPrice: 3945.48, note: "private" });

describe("vault encryption", () => {
  beforeEach(() => vi.stubEnv("VAULT_MASTER_KEY", randomBytes(32).toString("base64")));

  it("round-trips, and the sealed text shows nothing readable", () => {
    const sealed = seal("user-a", "holding", "h1", secret);
    expect(open("user-a", "holding", "h1", sealed)).toBe(secret);
    const raw = Buffer.from(sealed, "base64").toString("latin1") + sealed;
    for (const word of ["TCS", "3945", "private", "quantity"]) expect(raw).not.toContain(word);
  });

  it("gives a different result each time for the same data", () => {
    expect(seal("user-a", "holding", "h1", secret)).not.toBe(seal("user-a", "holding", "h1", secret));
  });

  it("can't be opened by another person", () => {
    const sealed = seal("user-a", "holding", "h1", secret);
    expect(() => open("user-b", "holding", "h1", sealed)).toThrow();
  });

  it("can't be moved to another record", () => {
    const sealed = seal("user-a", "holding", "h1", secret);
    expect(() => open("user-a", "holding", "h2", sealed)).toThrow();
    expect(() => open("user-a", "asset", "h1", sealed)).toThrow();
  });

  it("detects tampering", () => {
    const raw = Buffer.from(seal("user-a", "holding", "h1", secret), "base64");
    raw[raw.length - 1] ^= 1;
    expect(() => open("user-a", "holding", "h1", raw.toString("base64"))).toThrow();
  });

  it("can't be opened with a different master key", () => {
    const sealed = seal("user-a", "holding", "h1", secret);
    vi.stubEnv("VAULT_MASTER_KEY", randomBytes(32).toString("base64"));
    expect(() => open("user-a", "holding", "h1", sealed)).toThrow();
  });

  it("refuses to run without a proper master key", () => {
    vi.stubEnv("VAULT_MASTER_KEY", "");
    expect(() => seal("u", "holding", "h", "x")).toThrow(VaultNotConfiguredError);
    vi.stubEnv("VAULT_MASTER_KEY", Buffer.from("short").toString("base64"));
    expect(() => seal("u", "holding", "h", "x")).toThrow(VaultNotConfiguredError);
  });
});
