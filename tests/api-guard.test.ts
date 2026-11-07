import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
const createClient = vi.fn(async () => ({ auth: { getClaims } }));
const supabaseConfig = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => createClient() }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => supabaseConfig() }));

const { guard, guardAuthForm } = await import("@/lib/api-guard");
const request = (headers: Record<string, string> = {}) =>
  new Request("https://www.finlio.app/api/x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8", host: "www.finlio.app", ...headers } });
let seq = 0;
const limit = (n = 5) => ({ name: `test-${seq++}`, limit: n });
const signedOut = () => getClaims.mockResolvedValue({ data: null, error: null });
const signedIn = () => getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

describe("guard", () => {
  beforeEach(() => {
    getClaims.mockReset();
    supabaseConfig.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects signed-out requests in production, even with Supabase unconfigured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    signedOut();
    supabaseConfig.mockReturnValue(null);
    expect((await guard(request(), limit()))?.status).toBe(401);
  });

  it("treats a session that can't be read as signed out", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getClaims.mockRejectedValue(new Error("bad cookie"));
    expect((await guard(request(), limit()))?.status).toBe(401);
  });

  it("rejects signed-out requests locally once Supabase is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    signedOut();
    supabaseConfig.mockReturnValue({ url: "u", key: "k" });
    expect((await guard(request(), limit()))?.status).toBe(401);
  });

  it("stays open for a local copy with no Supabase keys", async () => {
    vi.stubEnv("NODE_ENV", "development");
    signedOut();
    supabaseConfig.mockReturnValue(null);
    expect(await guard(request(), limit())).toBeNull();
  });

  it("lets a signed-in person through, then returns 429 with Retry-After", async () => {
    vi.stubEnv("NODE_ENV", "production");
    signedIn();
    const rule = limit(1);
    expect(await guard(request(), rule)).toBeNull();
    const blocked = await guard(request(), rule);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("guardAuthForm", () => {
  it("allows same-site posts and blocks other sites", () => {
    expect(guardAuthForm(request({ origin: "https://www.finlio.app" }), limit())).toBeNull();
    expect(guardAuthForm(request({ origin: "https://evil.example" }), limit())?.status).toBe(403);
    expect(guardAuthForm(request({ origin: "not a url" }), limit())?.status).toBe(403);
  });

  it("limits repeated attempts from one address", () => {
    const rule = limit(1);
    expect(guardAuthForm(request(), rule)).toBeNull();
    expect(guardAuthForm(request(), rule)?.status).toBe(429);
  });
});
