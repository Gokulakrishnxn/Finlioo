import "server-only";
import { authConfigured, currentUserId } from "@/lib/auth/session";
import { takeToken } from "@/lib/rate-limit";

export const API_LIMITS = {
  chat: { name: "chat", limit: 20 },
  analytics: { name: "analytics", limit: 5 },
  quotes: { name: "quotes", limit: 60 },
  // A broker file can look up one stock per row, up to three times each.
  instruments: { name: "instruments", limit: 300 },
  logo: { name: "logo", limit: 300 },
  vaultPull: { name: "vault-pull", limit: 120 },
  vaultPush: { name: "vault-push", limit: 120 },
  signIn: { name: "sign-in", limit: 10 },
  accountDelete: { name: "account-delete", limit: 3 },
  accountProfile: { name: "account-profile", limit: 20 },
} as const;

type Limit = { name: string; limit: number; windowMs?: number };

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

function rateLimited(key: string, { name, limit, windowMs = 60_000 }: Limit): Response | null {
  const { allowed, retryAfterSeconds } = takeToken(`${name}:${key}`, limit, windowMs);
  if (allowed) return null;
  return Response.json(
    { error: "Too many requests. Please wait a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

// For routes that need an account. Returns the response to send if the request must stop,
// or null to carry on. Production always needs a session. A local copy with no Google/GCP
// settings has no way to sign in, so it stays open for development.
export async function guard(request: Request, limit: Limit): Promise<Response | null> {
  const userId = await currentUserId();
  const mustSignIn = process.env.NODE_ENV === "production" || authConfigured();
  if (mustSignIn && !userId) {
    return Response.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  return rateLimited(userId ?? clientIp(request), limit);
}

// For signing in, which happens before there is a session: posts from this site only,
// limited per address.
export function guardSignIn(request: Request, limit: Limit): Response | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameSite = false;
  try {
    sameSite = Boolean(origin) && new URL(origin!).host === host;
  } catch {
    sameSite = false;
  }
  if (!sameSite) return Response.json({ error: "This request isn't allowed." }, { status: 403 });
  return rateLimited(clientIp(request), limit);
}
