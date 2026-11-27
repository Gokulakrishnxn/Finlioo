import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { vercelAuthClient } = await import("@/lib/gcp/vercel-auth");

const NAMES = ["GCP_PROJECT_NUMBER", "GCP_SERVICE_ACCOUNT_EMAIL", "GCP_WORKLOAD_IDENTITY_POOL_ID", "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"];

afterEach(() => vi.unstubAllEnvs());

describe("vercelAuthClient", () => {
  it("is off locally, where none of the settings exist", () => {
    NAMES.forEach((name) => vi.stubEnv(name, ""));
    expect(vercelAuthClient()).toBeNull();
  });
  it("refuses half-finished settings", () => {
    NAMES.forEach((name) => vi.stubEnv(name, ""));
    vi.stubEnv("GCP_PROJECT_NUMBER", "1");
    expect(() => vercelAuthClient()).toThrow(/incomplete/);
  });
  it("builds a client when all are set", () => {
    NAMES.forEach((name) => vi.stubEnv(name, "x"));
    expect(vercelAuthClient()).toBeTruthy();
  });
});
