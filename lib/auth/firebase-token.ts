import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Checks a Firebase ID token against Google's public keys. This needs no service account.
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

// Only a sign-in made moments ago may start a session, so an old leaked token is useless.
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60;

type FirebaseClaim = { sign_in_provider?: string; identities?: Record<string, string[]> };

export async function verifyFirebaseIdToken(token: string, projectId: string, keys: JWTVerifyGetKey = googleKeys) {
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    requiredClaims: ["sub", "exp", "iat", "auth_time"],
  });
  const age = Date.now() / 1000 - Number(payload.auth_time);
  if (!(age <= MAX_SIGN_IN_AGE_SECONDS)) throw new Error("Sign-in is too old.");

  const firebase = (payload.firebase ?? {}) as FirebaseClaim;
  const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);
  const provider = firebase.sign_in_provider;
  let sub: string;
  if (provider === "google.com") {
    // Google accounts are keyed by Google's own id, so people keep their data from before Firebase.
    const googleId = text(firebase.identities?.["google.com"]?.[0]);
    if (!googleId) throw new Error("Google sign-in has no Google id.");
    sub = googleId;
  } else if (provider === "password") {
    // Email and password accounts are keyed by their Firebase id, in a namespace of their own.
    sub = `firebase:${payload.sub}`;
  } else {
    throw new Error("Only Google or email sign-in is allowed.");
  }
  // Firebase checks the password; Finlio also needs the address to be proven before a session.
  if (payload.email_verified !== true) throw new Error("Email isn't verified.");

  return { sub, email: text(payload.email), name: text(payload.name), picture: text(payload.picture) };
}
