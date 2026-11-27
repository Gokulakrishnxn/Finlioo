import "server-only";
import { GoogleGenAI } from "@google/genai";

// Free Google AI Studio keys have small quotas. List up to two keys; when one is out of quota
// or briefly failing, the next one answers instead.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

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
