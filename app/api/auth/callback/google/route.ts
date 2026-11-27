import { type NextRequest } from "next/server";
import { completeSignIn } from "@/lib/auth/google";
import { startSession } from "@/lib/auth/session";
import { publicOrigin } from "@/lib/public-origin";
import { sendWelcomeEmail } from "@/lib/welcome-email";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = publicOrigin(request.nextUrl.origin);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const fail = (status: string) => Response.redirect(new URL(`/sign-in?error=${status}`, origin));

  // The person pressed Cancel on Google's consent screen.
  if (searchParams.get("error") || !code || !state) return fail("denied");
  try {
    const { profile, next } = await completeSignIn(origin, code, state);
    const { isNew } = await startSession(profile);
    // Waited for, because serverless hosting can pause work left over after the response. It never blocks sign-in.
    if (isNew && profile.email) await sendWelcomeEmail({ to: profile.email, name: profile.name, appUrl: origin });
    return Response.redirect(new URL(next, origin));
  } catch (err) {
    console.error("[auth] google sign-in failed:", err instanceof Error ? err.message : "unknown");
    return fail("failed");
  }
}
