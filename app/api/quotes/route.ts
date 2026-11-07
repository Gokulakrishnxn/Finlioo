import { API_LIMITS, guard } from "@/lib/api-guard";
import { z } from "zod";
import { getQuotes, MissingTokenError } from "@/lib/upstox";

// Live NSE prices ("NSE_EQ|ISIN") from Upstox.
const QuotesRequestSchema = z.object({
  keys: z
    .array(z.string().regex(/^NSE_EQ\|[A-Z0-9]+$/))
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.quotes);
  if (blocked) return blocked;
  const parsed = QuotesRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Send a list of stock keys." }, { status: 400 });
  }
  try {
    const quotes = await getQuotes(parsed.data.keys);
    return Response.json({ quotes, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[quotes]", err);
    const missing = err instanceof MissingTokenError;
    return Response.json(
      { error: missing ? "Prices aren't set up yet." : "Couldn't update prices." },
      { status: missing ? 503 : 502 },
    );
  }
}
