import { describe, expect, it } from "vitest";
import { cookieValue, verifyCookie } from "@/lib/auth/cookie";

describe("session cookie", () => {
  it("accepts a cookie it signed", () => {
    expect(verifyCookie(cookieValue("abc", "secret"), "secret")).toBe("abc");
  });
  it("rejects tampering, another secret and missing values", () => {
    const good = cookieValue("abc", "secret");
    expect(verifyCookie(good.replace("abc", "abd"), "secret")).toBeNull();
    expect(verifyCookie(good, "other")).toBeNull();
    expect(verifyCookie(good + ".x", "secret")).toBeNull();
    expect(verifyCookie(undefined, "secret")).toBeNull();
    expect(verifyCookie(good, undefined)).toBeNull();
  });
});
