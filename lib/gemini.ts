import "server-only";
import { GoogleGenAI } from "@google/genai";

// Free Google AI Studio keys have small quotas. List up to two keys; when one is out of quota
// or briefly failing, the next one answers instead.
// Gemini 3.5 Flash-Lite: Google's small, low-cost stable model (free tier in AI Studio; paid at
// $0.30 in / $2.50 out per 1M tokens as of November 2026). Plenty for short explanations of totals.
// Override with GEMINI_MODEL, for example "gemini-3.1-flash-lite" for cheaper output tokens.
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

export const geminiKeys = () =>
  [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].map((k) => k?.trim()).filter((k): k is string => Boolean(k));

const retryable = (err: unknown) => {
  const status = (err as { status?: number })?.status;
  if (status === 429 || (status !== undefined && status >= 500)) return true;
  return /quota|rate.?limit|RESOURCE_EXHAUSTED|overloaded|unavailable/i.test(err instanceof Error ? err.message : "");
};

// Runs `call` with the first key, then the next if that one is exhausted or down.
export async function withGemini<T>(call: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const keys = geminiKeys();
  if (!keys.length) throw new Error("no-gemini-key");
  let last: unknown;
  for (const apiKey of keys) {
    try {
      return await call(new GoogleGenAI({ apiKey }));
    } catch (err) {
      last = err;
      if (!retryable(err)) throw err;
    }
  }
  throw last;
}
