"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { firebaseConfig } from "@/lib/auth/firebase-config";
import { loadFirebase, startFinlioSession, type FirebaseClient } from "@/lib/auth/firebase-client";
import { safeNext } from "@/lib/auth/routes";
import styles from "./auth.module.css";

const CANCELLED = ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"];

// "Sign in with Google": through Firebase Auth when it's set up, else straight to Google.
export function GoogleSignIn({ label, next, children }: { label: string; next?: string; children: React.ReactNode }) {
  const config = firebaseConfig();
  const configured = Boolean(config);
  const [firebase, setFirebase] = useState<FirebaseClient | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded ahead of the click, because browsers block pop-ups opened after a delay.
  useEffect(() => {
    const settings = firebaseConfig();
    if (!settings) return;
    loadFirebase(settings)
      .then(setFirebase)
      .catch(() => setError("Sign-in couldn't load. Please refresh the page."));
  }, []);

  if (!configured) {
    const href = `/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    return (
      <a href={href} className={styles.google}>
        {children} {label}
      </a>
    );
  }

  async function signIn() {
    if (!firebase || busy) return;
    const { auth, sdk } = firebase;
    setBusy(true);
    setError(null);
    try {
      const provider = new sdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const { user } = await sdk.signInWithPopup(auth, provider);
      await startFinlioSession(firebase, await user.getIdToken());
      window.location.assign(safeNext(next));
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (!code || !CANCELLED.includes(code)) {
        setError(
          code === "auth/popup-blocked"
            ? "Your browser blocked the Google window. Allow pop-ups and try again."
            : "Something went wrong while signing you in. Please try again.",
        );
      }
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <button type="button" onClick={signIn} disabled={!firebase || busy} className={`${styles.google} w-full cursor-pointer disabled:opacity-60`}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : children} {label}
      </button>
    </>
  );
}
