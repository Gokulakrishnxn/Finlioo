import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db, gcpConfigured } from "@/lib/gcp/firestore";
import { firebaseConfig } from "@/lib/auth/firebase-config";
import { cookieValue, SESSION_COOKIE, SESSION_DAYS, verifyCookie } from "@/lib/auth/cookie";

// Sessions are stored in Firestore (`sessions/{sha256(id)}`), never in the browser.
// Add a Firestore TTL policy on `sessions.expiresAt` so expired ones are cleaned up for free.

export type Account = { userId: string; email?: string; name?: string; picture?: string; provider: "google" };

export const authSecret = () => process.env.AUTH_SECRET;
const hashId = (id: string) => createHash("sha256").update(id).digest("hex");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function authConfigured() {
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return Boolean((google || firebaseConfig()) && authSecret() && gcpConfigured());
}

type Profile = { sub: string; email?: string; name?: string; picture?: string };

// Creates or refreshes the account, then signs this browser in. `isNew` is true on first sign-up.
export async function startSession(profile: Profile) {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const now = Date.now();
  const user = db().collection("users").doc(profile.sub);
  const existing = await user.get();
  await user.set(
    {
      email: profile.email,
      picture: profile.picture,
      // A name the person chose in Finlio isn't overwritten by Google's.
      ...(existing.data()?.name ? {} : { name: profile.name }),
      ...(existing.exists ? {} : { createdAt: new Date(now) }),
      lastSignInAt: new Date(now),
    },
    { merge: true },
  );
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now + SESSION_DAYS * 86_400_000);
  await db().collection("sessions").doc(hashId(id)).set({ userId: profile.sub, createdAt: new Date(now), expiresAt });
  (await cookies()).set(SESSION_COOKIE, cookieValue(id, secret), { ...cookieOptions, expires: expiresAt });
  return { isNew: !existing.exists };
}

// The signed-in person, checked against Firestore. Null when signed out, expired or unreadable.
export async function currentAccount(): Promise<Account | null> {
  try {
    const id = verifyCookie((await cookies()).get(SESSION_COOKIE)?.value, authSecret());
    if (!id) return null;
    const session = await db().collection("sessions").doc(hashId(id)).get();
    const data = session.data();
    if (!data || data.expiresAt.toMillis() < Date.now()) return null;
    const user = (await db().collection("users").doc(data.userId).get()).data();
    if (!user) return null;
    return { userId: data.userId, email: user.email, name: user.name, picture: user.picture, provider: "google" };
  } catch {
    return null;
  }
}

export const currentUserId = async () => (await currentAccount())?.userId ?? null;

// Ends this browser's session.
export async function endSession() {
  const store = await cookies();
  const id = verifyCookie(store.get(SESSION_COOKIE)?.value, authSecret());
  store.delete(SESSION_COOKIE);
  if (id) await db().collection("sessions").doc(hashId(id)).delete().catch(() => undefined);
}

// Ends every session of one person (used when deleting an account).
export async function endAllSessions(userId: string) {
  const snap = await db().collection("sessions").where("userId", "==", userId).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
  (await cookies()).delete(SESSION_COOKIE);
}
