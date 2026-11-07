import { z } from "zod";
import { API_LIMITS, guardAuthForm } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ email: z.email().max(254), code: z.string().regex(/^\d{6,10}$/) });

// Checks the code emailed at sign-up. Success confirms the email and starts a session.
export async function POST(request: Request) {
  const blocked = guardAuthForm(request, API_LIMITS.verify);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Enter the code from your email." }, { status: 400 });
  const { email, code } = body.data;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
    if (!error) return Response.json({ verified: true });
    console.error("[auth] verify:", error.code ?? error.status);
    if (error.code === "otp_expired") {
      return Response.json({ error: "That code is wrong or has expired. Check it, or send a new one." }, { status: 400 });
    }
    if (error.code === "over_request_rate_limit") {
      return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }
    return Response.json({ error: "Couldn't check that code. Please try again." }, { status: 502 });
  } catch {
    return Response.json({ error: "Couldn't check that code. Please try again." }, { status: 502 });
  }
}
