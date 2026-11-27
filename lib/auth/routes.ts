// Which pages need an account, and where people go after signing in.

const PROTECTED = ["/dashboard", "/transactions", "/holdings", "/assets", "/liabilities", "/goals", "/analytics", "/insights"];
const SIGNED_OUT_ONLY = ["/sign-in", "/sign-up"];

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

// Only paths on this site, so a link can't bounce someone to another website after signing in.
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\s\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

export type GateDecision = { redirect: string } | null;

export function gateDecision(pathname: string, search: string, signedIn: boolean): GateDecision {
  if (!signedIn && PROTECTED.some((base) => matches(pathname, base))) {
    return { redirect: `/sign-in?next=${encodeURIComponent(`${pathname}${search}`)}` };
  }
  if (signedIn && SIGNED_OUT_ONLY.some((base) => matches(pathname, base))) {
    return { redirect: safeNext(new URLSearchParams(search).get("next")) };
  }
  return null;
}
