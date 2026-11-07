import { API_LIMITS, guard } from "@/lib/api-guard";
import { SentenceGuard } from "@/lib/ai-guard";
import { AI_LANGUAGE_CODES, languageRule, MONEY_STYLE } from "@/lib/ai-locale";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

// The browser sends a summary of the person's money: totals, percentages and
// today's brief, never transactions, merchants or share quantities.
const ChatRequestSchema = z.object({
  language: z.enum(AI_LANGUAGE_CODES).default("en"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
  context: z.object({
    today: z.string().max(40),
    netWorth: z.number(),
    assets: z.number(),
    loans: z.number(),
    month: z.object({ income: z.number(), spent: z.number(), saved: z.number() }),
    spendingByCategory: z.array(z.object({ category: z.string().max(60), amount: z.number() })).max(20),
    allocation: z.array(z.object({ label: z.string().max(60), percent: z.number() })).max(10),
    stocks: z
      .array(
        z.object({
          symbol: z.string().max(40),
          name: z.string().max(200),
          dayChangePct: z.number().optional(),
          gainPct: z.number().optional(),
        }),
      )
      .max(50),
    brief: z.array(z.string().max(600)).max(30),
    profile: z
      .object({ name: z.string().max(80).optional(), goal: z.string().max(200).optional() })
      .optional(),
  }),
});

const SYSTEM = `You are Finlio, a calm, friendly assistant inside a personal-finance app for people in India.
You explain the person's own money in plain English, in short paragraphs or a few "- " bullets. This person lives in ${MONEY_STYLE}

Use their first name occasionally if given. If they shared a money goal, you may relate numbers to it, but never tell them what to do to reach it.

You have a JSON summary of their money (net worth, this month, spending by category, allocation, their stocks with today's and overall % change, and today's news brief). Answer from it. If the answer isn't in the summary, say so plainly and suggest which Finlio screen would help (Dashboard, Holdings, Expenses, Assets & loans, Analytics).

Rules:
- Explain; never advise. Never say buy, sell, hold, or which product, stock or fund to choose. Don't suggest investing, moving money, or changing a portfolio, even indirectly or as "something to consider". If asked, say Finlio explains rather than advises and offer to explain the factors instead.
- You are not a SEBI-registered adviser or research analyst. Don't predict prices or say whether something is a good investment.
- Don't invent news or numbers. Only use the brief for reasons a stock moved.
- Keep answers under 150 words unless asked for more.`;

export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.chat);
  if (blocked) return blocked;
  const parsed = ChatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send a question." }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Chat isn't set up yet (no Gemini key)." }, { status: 503 });

  const { messages, context, language } = parsed.data;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: `${SYSTEM}\n\nTheir money right now:\n${JSON.stringify(context)}${languageRule(language)}`,
      },
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Each sentence is checked before it's shown; see lib/ai-guard.ts.
          const guard = new SentenceGuard();
          const send = (text: string) => text && controller.enqueue(encoder.encode(text));
          try {
            for await (const chunk of stream) {
              if (chunk.text) send(guard.push(chunk.text));
              if (guard.blocked) {
                console.warn("[chat] stopped a reply that sounded like a recommendation");
                break;
              }
            }
            send(guard.finish());
            if (guard.blocked) console.warn("[chat] stopped a reply that sounded like a recommendation");
          } catch (err) {
            console.error("[chat] stream failed:", err);
            controller.enqueue(encoder.encode("\n\n(Sorry, the answer was cut short. Please ask again.)"));
          } finally {
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[chat]", err);
    const quota = (err as { status?: number }).status === 429;
    return Response.json(
      { error: quota ? "Gemini is out of quota for this key right now." : "Finlio couldn't answer right now." },
      { status: quota ? 429 : 502 },
    );
  }
}
