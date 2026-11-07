import "server-only";
import { isGoogleConfigured, readSession, type GoogleSession } from "@/lib/google-session";
import { takeToken } from "@/lib/rate-limit";

export const API_LIMITS = {
  chat: { name: "chat", limit: 20 },
  analytics: { name: "analytics", limit: 5 },
  expenses: { name: "expenses", limit: 5 },
  quotes: { name: "quotes", limit: 60 },
  // A broker file can look up one stock per row, up to three times each.
  instruments: { name: "instruments", limit: 300 },
  logo: { name: "logo", limit: 300 },
} as const;

type Limit = { name: string; limit: number; windowMs?: number };

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

async function currentSession(): Promise<GoogleSession | null> {
  try {
    return await readSession();
  } catch {
    return null; // A cookie that can't be read counts as signed out.
  }
}

// Returns the response to send if this request must stop, or null to carry on.
// Production always needs a session. A local copy with no Google keys has no way to sign
// in, so it stays open for development.
export async function guard(request: Request, { name, limit, windowMs = 60_000 }: Limit): Promise<Response | null> {
  const session = await currentSession();
  const mustSignIn = process.env.NODE_ENV === "production" || isGoogleConfigured();
  if (mustSignIn && !session) {
    return Response.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  const who = session?.email ?? clientIp(request);
  const { allowed, retryAfterSeconds } = takeToken(`${name}:${who}`, limit, windowMs);
  if (allowed) return null;
  return Response.json(
    { error: "Too many requests. Please wait a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
