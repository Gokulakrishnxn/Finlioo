import { NextResponse, type NextRequest } from "next/server";
import { gateDecision } from "@/lib/auth/routes";
import { SESSION_COOKIE, verifyCookie } from "@/lib/auth/cookie";
import { publicOrigin } from "@/lib/public-origin";

// Sends people to the right page. It only checks the cookie's signature, which is fast and needs
// no database; every API route still checks the session in Firestore before touching data.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secret = process.env.AUTH_SECRET;

  // A local copy with no AUTH_SECRET stays open. Production fails closed.
  if (!secret && process.env.NODE_ENV !== "production") return NextResponse.next();

  const signedIn = Boolean(verifyCookie(request.cookies.get(SESSION_COOKIE)?.value, secret));
  const decision = gateDecision(pathname, search, signedIn);
  if (!decision) return NextResponse.next();
  const url = new URL(decision.redirect, publicOrigin(request.nextUrl.origin));
  if (!secret) url.searchParams.set("error", "not-configured");
  return NextResponse.redirect(url);
}

// Pages only: API routes check the session themselves (lib/api-guard.ts) and answer with 401.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/holdings/:path*",
    "/assets/:path*",
    "/liabilities/:path*",
    "/goals/:path*",
    "/analytics/:path*",
    "/insights/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
