import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
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
    "/forgot-password",
    "/reset-password",
  ],
};
