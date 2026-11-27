import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { safeNext } from "@/lib/auth/routes";

// Google sign-in: identity only (openid, email, profile). Finlio never asks to read mail.
const STATE_COOKIE = "finlio_oauth_state";

function credentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google sign-in isn't set up yet.");
  return { clientId, clientSecret };
}

export const redirectUri = (origin: string) => `${origin}/api/auth/callback/google`;

export async function authorizationUrl(origin: string, next: string) {
  const { clientId } = credentials();
  const state = randomBytes(16).toString("base64url");
  (await cookies()).set(STATE_COOKIE, JSON.stringify({ state, next: safeNext(next) }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  }).toString();
  return url;
}

// Checks Google's answer and returns who signed in and where to send them.
export async function completeSignIn(origin: string, code: string, state: string) {
  const { clientId, clientSecret } = credentials();
  const store = await cookies();
  let pending: { state: string; next: string } | null = null;
  try {
    pending = JSON.parse(store.get(STATE_COOKIE)?.value ?? "");
  } catch {
    pending = null;
  }
  store.delete(STATE_COOKIE);
  if (!pending || pending.state !== state) throw new Error("Sign-in state didn't match.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  const tokens = await res.json();
  if (!res.ok) throw new Error(`Google token exchange failed: ${tokens.error}`);
  const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json());
  if (!profile.sub) throw new Error("Google sent no account id.");
  // Tokens are not kept: signing in needs them only once.
  return {
    profile: { sub: String(profile.sub), email: profile.email, name: profile.name, picture: profile.picture },
    next: safeNext(pending.next),
  };
}
