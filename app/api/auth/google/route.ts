import { type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/routes";
import { authorizationUrl, GoogleNotConfiguredError } from "@/lib/google-session";
import { createClient, isGoogleEnabled } from "@/lib/supabase/server";

// /api/auth/google signs in through Supabase; /api/auth/google?gmail=1 connects read-only Gmail.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const next = searchParams.get("next");

  if (searchParams.get("gmail") === "1") {
    try {
      const target = safeNext(next, "/transactions?google=connected");
      return Response.redirect(await authorizationUrl(origin, { gmail: true, next: target }));
    } catch (err) {
      const reason = err instanceof GoogleNotConfiguredError ? "not-configured" : "failed";
      return Response.redirect(new URL(`/transactions?google=${reason}`, origin));
    }
  }

  const fail = (reason: string) => Response.redirect(new URL(`/sign-in?error=${reason}`, origin));
  if (!(await isGoogleEnabled())) return fail("not-configured");
  try {
    const callback = new URL("/api/auth/callback", origin);
    callback.searchParams.set("next", safeNext(next));
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
    });
    if (error || !data.url) return fail("failed");
    return Response.redirect(data.url);
  } catch {
    return fail("failed");
  }
}
