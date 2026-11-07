import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

// Where Google sign-in and emailed links (confirmation, password reset) come back to.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/sign-in?error=${reason}`, origin));
  if (searchParams.get("error")) return fail(searchParams.get("error") === "access_denied" ? "denied" : "failed");

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  try {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("No code in the link.") };
    if (error) {
      console.error("[auth] callback:", (error as { code?: string }).code ?? error.name);
      return fail("link");
    }
  } catch {
    return fail("failed");
  }
  return NextResponse.redirect(new URL(safeNext(searchParams.get("next")), origin));
}
