import { type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/routes";
import { authConfigured } from "@/lib/auth/session";
import { authorizationUrl } from "@/lib/auth/google";
import { publicOrigin } from "@/lib/public-origin";

// Starts "Continue with Google".
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = publicOrigin(request.nextUrl.origin);
  const fail = (reason: string) => Response.redirect(new URL(`/sign-in?error=${reason}`, origin));
  if (!authConfigured()) return fail("not-configured");
  try {
    return Response.redirect(await authorizationUrl(origin, safeNext(searchParams.get("next"))));
  } catch {
    return fail("failed");
  }
}
