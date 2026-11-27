"use client";

import { firebaseConfig } from "@/lib/auth/firebase-config";

export type FirebaseClient = Awaited<ReturnType<typeof loadFirebase>>;

// Firebase Auth in the browser, loaded on demand. Nothing is kept in the browser:
// Finlio's own cookie is the session, so persistence is in memory only.
export async function loadFirebase(config: NonNullable<ReturnType<typeof firebaseConfig>>) {
  const [{ getApps, initializeApp }, sdk] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const existing = getApps()[0];
  const auth = existing
    ? sdk.getAuth(existing)
    : sdk.initializeAuth(initializeApp(config), {
        persistence: sdk.inMemoryPersistence,
        popupRedirectResolver: sdk.browserPopupRedirectResolver,
      });
  return { auth, sdk };
}

/** Swaps a fresh Firebase sign-in for Finlio's session cookie, then signs out of Firebase. */
export async function startFinlioSession({ auth, sdk }: FirebaseClient, idToken: string) {
  const res = await fetch("/api/auth/firebase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  await sdk.signOut(auth);
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error);
}
