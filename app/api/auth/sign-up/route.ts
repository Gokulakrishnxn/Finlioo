import { z } from "zod";
import { API_LIMITS, guardAuthForm } from "@/lib/api-guard";
import { createClient, SupabaseNotConfiguredError } from "@/lib/supabase/server";

const Body = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(72),
});

const MESSAGES: Record<string, { error: string; status: number }> = {
  weak_password: { error: "Please choose a stronger password.", status: 400 },
  email_address_invalid: { error: "Please enter a valid email address.", status: 400 },
  email_address_not_authorized: { error: "We can't send email to that address yet. Please use Google for now.", status: 403 },
  over_email_send_rate_limit: { error: "Too many sign-ups right now. Please try again in a while.", status: 429 },
  over_request_rate_limit: { error: "Too many attempts. Please wait a few minutes.", status: 429 },
  signup_disabled: { error: "New sign-ups are paused right now.", status: 403 },
};

export async function POST(request: Request) {
  const blocked = guardAuthForm(request, API_LIMITS.signUp);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Enter an email and a password of at least 8 characters." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp(body.data);
    if (error) {
      console.error("[auth] sign-up:", error.code ?? error.status);
      const known = error.code ? MESSAGES[error.code] : undefined;
      return Response.json({ error: known?.error ?? "Couldn't create your account. Please try again." }, { status: known?.status ?? 502 });
    }
    // With email confirmation on, an address already in use gets this same answer,
    // so the form can't be used to find out who has an account.
    return Response.json({ needsConfirmation: !data.session });
  } catch (err) {
    const missing = err instanceof SupabaseNotConfiguredError;
    return Response.json(
      { error: missing ? "Accounts aren't set up yet." : "Couldn't create your account. Please try again." },
      { status: missing ? 503 : 502 },
    );
  }
}
