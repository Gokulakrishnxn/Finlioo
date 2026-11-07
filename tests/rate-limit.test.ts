import { describe, expect, it } from "vitest";
import { takeToken } from "@/lib/rate-limit";

describe("takeToken", () => {
  it("allows up to the limit, then blocks with a wait time", () => {
    const now = 1_000;
    expect(takeToken("a", 2, 60_000, now).allowed).toBe(true);
    expect(takeToken("a", 2, 60_000, now).allowed).toBe(true);
    const third = takeToken("a", 2, 60_000, now);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(60);
  });

  it("opens again after the window and keeps keys apart", () => {
    const now = 5_000;
    takeToken("b", 1, 1_000, now);
    expect(takeToken("b", 1, 1_000, now).allowed).toBe(false);
    expect(takeToken("c", 1, 1_000, now).allowed).toBe(true);
    expect(takeToken("b", 1, 1_000, now + 1_000).allowed).toBe(true);
  });
});
