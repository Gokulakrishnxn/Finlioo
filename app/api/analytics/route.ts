import { API_LIMITS, guard } from "@/lib/api-guard";
import { containsRecommendation } from "@/lib/ai-guard";
import { AI_LANGUAGE_CODES, languageRule, MONEY_STYLE } from "@/lib/ai-locale";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

// Totals only: no transactions, merchants, account names or stock quantities.
const AnalyticsRequestSchema = z.object({
  language: z.enum(AI_LANGUAGE_CODES).default("en"),
  netWorth: z.number(),
  assets: z.number(),
  loans: z.number(),
  period: z.string().max(60),
  totals: z.object({ income: z.number(), spent: z.number(), saved: z.number() }),
  previousPeriodSpent: z.number(),
  spendingByCategory: z.array(z.object({ category: z.string().max(40), amount: z.number() })).max(20),
  allocation: z.array(z.object({ label: z.string().max(40), percent: z.number() })).max(10),
});

const SYSTEM = `You are Finlio, a calm friend who explains someone's money to them in plain English. They live in ${MONEY_STYLE}

Write 4 to 6 short bullet points, each one sentence, starting with "- ".
- Describe what the numbers show: where most money goes, how this period compares with the one before it, how much was saved, how the money is spread, how loans compare with assets.
- Never tell them to buy, sell, invest in or move money into anything, and never recommend products. Explain; don't advise.
- If a number is zero or missing, don't comment on it.`;

export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.analytics);
  if (blocked) return blocked;
  const parsed = AnalyticsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send your money totals." }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Analytics explanations aren't set up yet (no Gemini key)." }, { status: 503 });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: JSON.stringify(parsed.data),
      config: { systemInstruction: `${SYSTEM}${languageRule(parsed.data.language)}` },
    });
    const points = (response.text ?? "")
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter((l) => !containsRecommendation(l))
      .filter(Boolean)
      .slice(0, 6);
    return Response.json({ points, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("[analytics]", err);
    return Response.json({ error: "Couldn't explain your money right now." }, { status: 502 });
  }
}
