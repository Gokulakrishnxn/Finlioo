import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => ({ url: "u", key: "k" }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { verifyOtp } }) }));

const { POST } = await import("@/app/api/auth/verify/route");
let ip = 0;
const call = (body: object) =>
  POST(
    new Request("https://www.finlio.app/api/auth/verify", {
      method: "POST",
      headers: { host: "www.finlio.app", origin: "https://www.finlio.app", "x-forwarded-for": `10.0.0.${ip++}` },
      body: JSON.stringify(body),
    }),
  );
const valid = { email: "a@example.com", code: "123456" };

describe("POST /api/auth/verify", () => {
  beforeEach(() => verifyOtp.mockReset());

  it("verifies a sign-up code with the right type", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    expect((await call(valid)).status).toBe(200);
    expect(verifyOtp).toHaveBeenCalledWith({ email: "a@example.com", token: "123456", type: "signup" });
  });

  it("explains a wrong or expired code", async () => {
    verifyOtp.mockResolvedValue({ error: { code: "otp_expired", status: 403 } });
    const res = await call(valid);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/wrong or has expired/);
  });

  it.each([{ ...valid, code: "12" }, { ...valid, code: "abcdef" }, { ...valid, email: "nope" }])(
    "rejects a bad request without calling Supabase",
    async (body) => {
      expect((await call(body)).status).toBe(400);
      expect(verifyOtp).not.toHaveBeenCalled();
    },
  );

  it("stops repeated guesses from one address", async () => {
    verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });
    const guess = () =>
      POST(
        new Request("https://www.finlio.app/api/auth/verify", {
          method: "POST",
          headers: { host: "www.finlio.app", "x-forwarded-for": "9.9.9.9" },
          body: JSON.stringify(valid),
        }),
      );
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await guess()).status);
    expect(codes.at(-1)).toBe(429);
  });
});
