import { z } from "zod";
import { API_LIMITS, guardAuthForm } from "@/lib/api-guard";
import { createClient, SupabaseNotConfiguredError } from "@/lib/supabase/server";

const Body = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

const MESSAGES: Record<string, { error: string; status: number }> = {
  invalid_credentials: { error: "That email or password isn't right.", status: 401 },
  email_not_confirmed: { error: "Please confirm your email first. Check your inbox for the link.", status: 403 },
  over_request_rate_limit: { error: "Too many attempts. Please wait a few minutes.", status: 429 },
};

export async function POST(request: Request) {
  const blocked = guardAuthForm(request, API_LIMITS.signIn);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Enter your email and password." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(body.data);
    if (!error) return Response.json({ signedIn: true });
    console.error("[auth] sign-in:", error.code ?? error.status);
    const known = error.code ? MESSAGES[error.code] : undefined;
    return Response.json({ error: known?.error ?? "Couldn't sign you in. Please try again." }, { status: known?.status ?? 502 });
  } catch (err) {
    const missing = err instanceof SupabaseNotConfiguredError;
    return Response.json(
      { error: missing ? "Accounts aren't set up yet." : "Couldn't sign you in. Please try again." },
      { status: missing ? 503 : 502 },
    );
  }
}
