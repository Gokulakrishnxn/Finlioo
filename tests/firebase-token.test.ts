import { generateKeyPair, SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { verifyFirebaseIdToken } = await import("@/lib/auth/firebase-token");

const { privateKey, publicKey } = await generateKeyPair("RS256");
const other = await generateKeyPair("RS256");
const keys = async () => publicKey;
const now = () => Math.floor(Date.now() / 1000);

function token(claims: Record<string, unknown> = {}, { key = privateKey, audience = "demo" } = {}) {
  return new SignJWT({
    auth_time: now(),
    email: "a@example.com",
    email_verified: true,
    firebase: { sign_in_provider: "google.com", identities: { "google.com": ["google-123"] } },
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(`https://securetoken.google.com/${audience}`)
    .setAudience(audience)
    .setSubject("firebase-uid")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

const verify = async (t: Promise<string>) => verifyFirebaseIdToken(await t, "demo", keys);

describe("verifyFirebaseIdToken", () => {
  it("returns the person, keyed by their Google id", async () => {
    await expect(verify(token())).resolves.toMatchObject({ sub: "google-123", email: "a@example.com" });
  });
  it("rejects another project's token and a forged signature", async () => {
    await expect(verify(token({}, { audience: "someone-else" }))).rejects.toThrow();
    await expect(verify(token({}, { key: other.privateKey }))).rejects.toThrow();
  });
  it("keys email and password accounts by their Firebase id, apart from Google ids", async () => {
    const password = { firebase: { sign_in_provider: "password", identities: { email: ["a@example.com"] } } };
    await expect(verify(token(password))).resolves.toMatchObject({ sub: "firebase:firebase-uid", email: "a@example.com" });
    await expect(verify(token({ ...password, email_verified: false }))).rejects.toThrow(/verified/);
  });
  it("rejects old sign-ins, unverified email and other providers", async () => {
    await expect(verify(token({ auth_time: now() - 3600 }))).rejects.toThrow(/too old/);
    await expect(verify(token({ email_verified: false }))).rejects.toThrow(/verified/);
    await expect(verify(token({ firebase: { sign_in_provider: "anonymous", identities: {} } }))).rejects.toThrow(/Google or email/);
    await expect(verify(token({ firebase: { sign_in_provider: "google.com", identities: {} } }))).rejects.toThrow(/Google id/);
  });
});
