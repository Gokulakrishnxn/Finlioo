import { z } from "zod";
import { API_LIMITS, guardAuthForm } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ email: z.email().max(254) });

// Sends a fresh sign-up code. Answers the same whether or not the address has an account.
export async function POST(request: Request) {
  const blocked = guardAuthForm(request, API_LIMITS.resend);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: body.data.email });
    if (error) {
      console.error("[auth] resend:", error.code ?? error.status);
      if (error.status === 429) {
        return Response.json({ error: "Please wait a little before asking for another code." }, { status: 429 });
      }
    }
  } catch (err) {
    console.error("[auth] resend failed:", err instanceof Error ? err.name : "unknown");
  }
  return Response.json({ sent: true });
}
