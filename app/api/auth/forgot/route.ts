import { z } from "zod";
import { API_LIMITS, guardAuthForm } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ email: z.email().max(254) });

// Answers the same whether or not the address has an account.
export async function POST(request: Request) {
  const blocked = guardAuthForm(request, API_LIMITS.forgot);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const callback = new URL("/api/auth/callback", new URL(request.url).origin);
  callback.searchParams.set("next", "/reset-password");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(body.data.email, { redirectTo: callback.toString() });
    if (error) console.error("[auth] forgot:", error.code ?? error.status);
  } catch (err) {
    console.error("[auth] forgot failed:", err instanceof Error ? err.name : "unknown");
  }
  return Response.json({ sent: true });
}
