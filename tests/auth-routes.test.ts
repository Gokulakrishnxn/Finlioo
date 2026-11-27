import { describe, expect, it } from "vitest";
import { gateDecision, safeNext } from "@/lib/auth/routes";

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/holdings?x=1")).toBe("/holdings?x=1");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/\tevil", "evil", "", null, undefined])(
    "rejects %s",
    (value) => expect(safeNext(value)).toBe("/dashboard"),
  );
});

describe("gateDecision", () => {
  it("sends signed-out people to sign in and remembers the page", () => {
    expect(gateDecision("/holdings", "?a=1", false)).toEqual({ redirect: "/sign-in?next=%2Fholdings%3Fa%3D1" });
    expect(gateDecision("/dashboard", "", false)).toEqual({ redirect: "/sign-in?next=%2Fdashboard" });
  });

  it("leaves public pages alone", () => {
    for (const path of ["/", "/terms", "/cookies", "/sign-in"]) {
      expect(gateDecision(path, "", false)).toBeNull();
    }
  });

  it("does not treat a similar path as protected", () => {
    expect(gateDecision("/dashboards", "", false)).toBeNull();
  });

  it("moves signed-in people off sign-in pages, safely", () => {
    expect(gateDecision("/sign-in", "", true)).toEqual({ redirect: "/dashboard" });
    expect(gateDecision("/sign-up", "?next=%2Fgoals", true)).toEqual({ redirect: "/goals" });
    expect(gateDecision("/sign-in", "?next=https%3A%2F%2Fevil.example", true)).toEqual({ redirect: "/dashboard" });
  });

  it("lets signed-in people reach the app and the reset page", () => {
    expect(gateDecision("/holdings", "", true)).toBeNull();
  });
});
