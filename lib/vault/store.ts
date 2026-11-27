import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/gcp/firestore";

// Encrypted records live at users/{uid}/vault/{hash(kind,id)}. `rev` is a per-person counter that
// goes up on every change, so devices can ask for "everything after rev N".

export const PAGE = 500;
export const MAX_RECORDS_PER_PERSON = 20_000;

export type Stored = { kind: string; id: string; ciphertext: string | null; deleted: boolean; rev: number };
export type Incoming = { kind: string; id: string; ciphertext: string | null; keyVersion: number; clientUpdatedAt: Date };

const records = (userId: string) => db().collection("users").doc(userId).collection("vault");
const docId = (kind: string, id: string) => createHash("sha256").update(`${kind}\0${id}`).digest("hex");

export async function pull(userId: string, since: number): Promise<Stored[]> {
  const snap = await records(userId).where("rev", ">", since).orderBy("rev").limit(PAGE).get();
  return snap.docs.map((d) => d.data() as Stored);
}

export async function count(userId: string) {
  return (await records(userId).count().get()).data().count;
}

// The newest edit by client time wins, so an old offline edit can't overwrite a newer one.
export async function push(userId: string, changes: Incoming[]) {
  const user = db().collection("users").doc(userId);
  await db().runTransaction(async (tx) => {
    const refs = changes.map((c) => records(userId).doc(docId(c.kind, c.id)));
    const [account, ...existing] = await tx.getAll(user, ...refs);
    let rev = (account.data()?.rev as number | undefined) ?? 0;
    changes.forEach((change, i) => {
      const current = existing[i].data();
      if (current && current.clientUpdatedAt.toMillis() > change.clientUpdatedAt.getTime()) return;
      rev += 1;
      tx.set(refs[i], {
        kind: change.kind,
        id: change.id,
        ciphertext: change.ciphertext,
        keyVersion: change.keyVersion,
        clientUpdatedAt: change.clientUpdatedAt,
        deleted: change.ciphertext === null,
        rev,
      });
    });
    tx.set(user, { rev }, { merge: true });
  });
}

// Removes the person and everything saved for them.
export async function deleteAccount(userId: string) {
  await db().recursiveDelete(db().collection("users").doc(userId));
}
