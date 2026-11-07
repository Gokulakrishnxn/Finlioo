import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// Seals money data before it reaches the database. Each person gets their own key, derived
// from a master key kept in the server's settings and never stored in the database, so a
// copy of the database alone reveals no amounts, names or notes.

export const KEY_VERSION = 1;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class VaultNotConfiguredError extends Error {}

function masterKey() {
  const key = Buffer.from(process.env.VAULT_MASTER_KEY ?? "", "base64");
  if (key.length !== 32) throw new VaultNotConfiguredError("VAULT_MASTER_KEY must be 32 bytes, base64 encoded.");
  return key;
}

function userKey(userId: string) {
  return Buffer.from(hkdfSync("sha256", masterKey(), userId, "finlio-vault-v1", 32));
}

// Binds a sealed record to its owner and place, so it can't be copied to another row.
const context = (userId: string, kind: string, id: string) => Buffer.from(JSON.stringify([userId, kind, id]));

export function seal(userId: string, kind: string, id: string, plaintext: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", userKey(userId), iv);
  cipher.setAAD(context(userId, kind, id));
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

export function open(userId: string, kind: string, id: string, sealed: string) {
  const raw = Buffer.from(sealed, "base64");
  const decipher = createDecipheriv("aes-256-gcm", userKey(userId), raw.subarray(0, IV_BYTES));
  decipher.setAAD(context(userId, kind, id));
  decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
}
