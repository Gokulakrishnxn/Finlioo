import { API_LIMITS, guard } from "@/lib/api-guard";
import { SentenceGuard } from "@/lib/ai-guard";
import { AI_LANGUAGE_CODES } from "@/lib/ai-locale";
import { chatSystemInstruction } from "@/lib/chat-prompt";
import { ThinkingLevel } from "@google/genai";
import { GEMINI_MODEL, geminiKeys, withGemini } from "@/lib/gemini";
import { z } from "zod";

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

export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.chat);
  if (blocked) return blocked;
  const parsed = ChatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Send a question." }, { status: 400 });
  if (!geminiKeys().length) return Response.json({ error: "Chat isn't set up yet (no Gemini key)." }, { status: 503 });

  const { messages, context, language } = parsed.data;

  try {
    const stream = await withGemini((ai) => ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: chatSystemInstruction(context, language),
        // Short, factual answers: little sampling freedom, minimal thinking, and a hard cap on
        // length so one reply can never cost much (Indian-language replies use more tokens).
        temperature: 0.3,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    }));

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
