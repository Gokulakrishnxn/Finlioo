import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const used: string[] = [];
vi.mock("@google/genai", () => ({ GoogleGenAI: class { constructor(public o: { apiKey: string }) {} get apiKey() { return this.o.apiKey; } } }));
const { withGemini } = await import("@/lib/gemini");

afterEach(() => { vi.unstubAllEnvs(); used.length = 0; });

describe("withGemini", () => {
  it("falls back to the second key when the first is out of quota", async () => {
    vi.stubEnv("GEMINI_API_KEY", "k1");
    vi.stubEnv("GEMINI_API_KEY_2", "k2");
    const result = await withGemini(async (ai) => {
      used.push((ai as unknown as { apiKey: string }).apiKey);
      if (used.length === 1) throw Object.assign(new Error("quota"), { status: 429 });
      return "ok";
    });
    expect(result).toBe("ok");
    expect(used).toEqual(["k1", "k2"]);
  });
  it("does not retry a bad request", async () => {
    vi.stubEnv("GEMINI_API_KEY", "k1");
    vi.stubEnv("GEMINI_API_KEY_2", "k2");
    await expect(withGemini(async () => { throw Object.assign(new Error("bad"), { status: 400 }); })).rejects.toThrow("bad");
  });
});
