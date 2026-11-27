import { createHmac, timingSafeEqual } from "node:crypto";

// The browser holds only a random session id signed with AUTH_SECRET. Everything else about the
// session (who, until when) lives in Firestore, so signing out or deleting an account ends it
// immediately. Pure functions, so the proxy can use them to gate pages without a database call.

// "__session" is the only cookie Firebase Hosting passes through to Cloud Run, so the name is fixed.
export const SESSION_COOKIE = "__session";
export const SESSION_DAYS = 30;

const sign = (id: string, secret: string) => createHmac("sha256", secret).update(id).digest("base64url");

export const cookieValue = (id: string, secret: string) => `${id}.${sign(id, secret)}`;

// The session id if the cookie is untampered, else null.
export function verifyCookie(value: string | undefined, secret: string | undefined): string | null {
  if (!value || !secret) return null;
  const [id, mac, extra] = value.split(".");
  if (!id || !mac || extra !== undefined) return null;
  const expected = Buffer.from(sign(id, secret));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}
