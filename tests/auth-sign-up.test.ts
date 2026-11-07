import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => ({ url: "u", key: "k" }) }));
vi.mock("@/lib/supabase/server", () => ({
  SupabaseNotConfiguredError: class extends Error {},
  createClient: async () => ({ auth: { signUp } }),
}));

const { POST } = await import("@/app/api/auth/sign-up/route");
let ip = 0;
const call = (body: object) =>
  POST(
    new Request("https://www.finlio.app/api/auth/sign-up", {
      method: "POST",
      headers: { host: "www.finlio.app", origin: "https://www.finlio.app", "x-forwarded-for": `10.1.0.${ip++}` },
      body: JSON.stringify(body),
    }),
  );
const valid = { email: "a@example.com", password: "long-enough-1" };

describe("POST /api/auth/sign-up", () => {
  beforeEach(() => signUp.mockReset());

  it("creates the account with only an email and password", async () => {
    signUp.mockResolvedValue({ error: null });
    expect((await call(valid)).status).toBe(200);
    expect(signUp).toHaveBeenCalledWith(valid);
  });

  it("explains when the email is already registered", async () => {
    signUp.mockResolvedValue({ error: { code: "user_already_exists", status: 422 } });
    const res = await call(valid);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already exists/);
  });

  it.each([{ ...valid, password: "short" }, { ...valid, email: "nope" }])("rejects a bad request without calling Supabase", async (body) => {
    expect((await call(body)).status).toBe(400);
    expect(signUp).not.toHaveBeenCalled();
  });
});
