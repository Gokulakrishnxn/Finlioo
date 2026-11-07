import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readSession = vi.fn();
const isGoogleConfigured = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/google-session", () => ({
  readSession: () => readSession(),
  isGoogleConfigured: () => isGoogleConfigured(),
}));

const { guard } = await import("@/lib/api-guard");
const request = () => new Request("https://www.finlio.app/api/x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
let seq = 0;
const limit = (n = 5) => ({ name: `test-${seq++}`, limit: n });

describe("guard", () => {
  beforeEach(() => {
    readSession.mockReset();
    isGoogleConfigured.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects signed-out requests in production, even with Google unconfigured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    readSession.mockResolvedValue(null);
    isGoogleConfigured.mockReturnValue(false);
    expect((await guard(request(), limit()))?.status).toBe(401);
  });

  it("treats an unreadable session cookie as signed out", async () => {
    vi.stubEnv("NODE_ENV", "production");
    readSession.mockRejectedValue(new Error("bad cookie"));
    expect((await guard(request(), limit()))?.status).toBe(401);
  });

  it("rejects signed-out requests locally once Google is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    readSession.mockResolvedValue(null);
    isGoogleConfigured.mockReturnValue(true);
    expect((await guard(request(), limit()))?.status).toBe(401);
  });

  it("stays open for a local copy with no Google keys", async () => {
    vi.stubEnv("NODE_ENV", "development");
    readSession.mockResolvedValue(null);
    isGoogleConfigured.mockReturnValue(false);
    expect(await guard(request(), limit())).toBeNull();
  });

  it("lets a signed-in person through, then returns 429 with Retry-After", async () => {
    vi.stubEnv("NODE_ENV", "production");
    readSession.mockResolvedValue({ email: "a@example.com" });
    const rule = limit(1);
    expect(await guard(request(), rule)).toBeNull();
    const blocked = await guard(request(), rule);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBeTruthy();
  });
});
