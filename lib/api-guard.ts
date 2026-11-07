import "server-only";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { takeToken } from "@/lib/rate-limit";

export const API_LIMITS = {
  chat: { name: "chat", limit: 20 },
  analytics: { name: "analytics", limit: 5 },
  expenses: { name: "expenses", limit: 5 },
  quotes: { name: "quotes", limit: 60 },
  // A broker file can look up one stock per row, up to three times each.
  instruments: { name: "instruments", limit: 300 },
  logo: { name: "logo", limit: 300 },
  signIn: { name: "sign-in", limit: 10 },
  signUp: { name: "sign-up", limit: 5 },
  forgot: { name: "forgot", limit: 3 },
  reset: { name: "reset", limit: 5 },
} as const;

type Limit = { name: string; limit: number; windowMs?: number };

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

// The signed-in person's id. getClaims verifies the token's signature.
async function currentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return data?.claims?.sub ?? null;
  } catch {
    return null; // A missing or unreadable session counts as signed out.
  }
}

function rateLimited(key: string, { name, limit, windowMs = 60_000 }: Limit): Response | null {
  const { allowed, retryAfterSeconds } = takeToken(`${name}:${key}`, limit, windowMs);
  if (allowed) return null;
  return Response.json(
    { error: "Too many requests. Please wait a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

// For routes that need an account. Returns the response to send if the request must stop,
// or null to carry on. Production always needs a session. A local copy with no Supabase
// keys has no way to sign in, so it stays open for development.
export async function guard(request: Request, limit: Limit): Promise<Response | null> {
  const userId = await currentUserId();
  const mustSignIn = process.env.NODE_ENV === "production" || Boolean(supabaseConfig());
  if (mustSignIn && !userId) {
    return Response.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  return rateLimited(userId ?? clientIp(request), limit);
}

// For the sign-in forms, which work before there is a session: same-site posts only,
// limited per address.
export function guardAuthForm(request: Request, limit: Limit): Response | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameSite = false;
  try {
    sameSite = !origin || new URL(origin).host === host;
  } catch {
    sameSite = false;
  }
  if (!sameSite) return Response.json({ error: "This request isn't allowed." }, { status: 403 });
  return rateLimited(clientIp(request), limit);
}
