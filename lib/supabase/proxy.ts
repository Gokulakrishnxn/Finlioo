import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { gateDecision } from "@/lib/auth/routes";
import { sessionCookieOptions, supabaseConfig } from "@/lib/supabase/config";

// Refreshes the session cookie on each page request and sends people to the right page.
export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const config = supabaseConfig();

  if (!config) {
    // A local copy with no Supabase keys stays open. Production fails closed.
    if (process.env.NODE_ENV !== "production") return NextResponse.next({ request });
    const decision = gateDecision(pathname, search, false);
    if (!decision) return NextResponse.next({ request });
    const url = new URL(decision.redirect, request.url);
    url.searchParams.set("error", "not-configured");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getClaims verifies the token's signature; never trust getSession on the server.
  const { data } = await supabase.auth.getClaims();
  const decision = gateDecision(pathname, search, Boolean(data?.claims?.sub));
  if (!decision) return response;

  const redirect = NextResponse.redirect(new URL(decision.redirect, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === "cache-control" || name.toLowerCase() === "expires" || name.toLowerCase() === "pragma") {
      redirect.headers.set(name, value);
    }
  });
  return redirect;
}
