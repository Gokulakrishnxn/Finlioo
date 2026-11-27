"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { firebaseConfig } from "@/lib/auth/firebase-config";
import { loadFirebase, startFinlioSession, type FirebaseClient } from "@/lib/auth/firebase-client";
import { safeNext } from "@/lib/auth/routes";
import styles from "./auth.module.css";

type Mode = "sign-in" | "sign-up";

const MIN_PASSWORD = 8;

// Firebase's error codes, in Finlio's words. Wrong email and wrong password read the same,
// so the form never says which accounts exist.
const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match. Try again, or reset your password.",
  "auth/wrong-password": "That email and password don't match. Try again, or reset your password.",
  "auth/user-not-found": "That email and password don't match. Try again, or reset your password.",
  "auth/email-already-in-use": "There's already an account with this email. Sign in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": `Use at least ${MIN_PASSWORD} characters for your password.`,
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "You seem to be offline. Check your connection and try again.",
  "auth/operation-not-allowed": "Email sign-in isn't switched on yet. Please use Google for now.",
};

// Email and password sign-in and sign-up, through Firebase Auth. Firebase holds and checks the
// password; Finlio only ever sees a signed token, and only once the address is verified.
export function EmailSignIn({ mode, next }: { mode: Mode; next?: string }) {
  const configured = Boolean(firebaseConfig());
  const [firebase, setFirebase] = useState<FirebaseClient | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const settings = firebaseConfig();
    if (!settings) return;
    loadFirebase(settings)
      .then(setFirebase)
      .catch(() => setError("Sign-in couldn't load. Please refresh the page."));
  }, []);

  const fail = (err: unknown) => {
    const code = (err as { code?: string }).code ?? "";
    setError(MESSAGES[code] ?? "Something went wrong. Please try again.");
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    if (!configured) {
      setError("Email sign-in isn't set up yet. Please use Google for now.");
      return;
    }
    if (!firebase) return;
    if (mode === "sign-up" && password.length < MIN_PASSWORD) {
      setError(MESSAGES["auth/weak-password"]);
      return;
    }

    const { auth, sdk } = firebase;
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { user } = await sdk.createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await sdk.updateProfile(user, { displayName: name.trim() });
        await sdk.sendEmailVerification(user);
        await sdk.signOut(auth);
        setPassword("");
        setNotice(`We sent a link to ${user.email}. Open it to verify your email, then sign in.`);
        setBusy(false);
        return;
      }

      const { user } = await sdk.signInWithEmailAndPassword(auth, email.trim(), password);
      if (!user.emailVerified) {
        await sdk.sendEmailVerification(user);
        await sdk.signOut(auth);
        setNotice(`Verify your email first. We sent a new link to ${user.email}.`);
        setBusy(false);
        return;
      }
      await startFinlioSession(firebase, await user.getIdToken());
      window.location.assign(safeNext(next));
    } catch (err) {
      fail(err);
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError(null);
    setNotice(null);
    if (!configured || !firebase) {
      setError("Email sign-in isn't set up yet. Please use Google for now.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email above, then choose Forgot password.");
      return;
    }
    try {
      await firebase.sdk.sendPasswordResetEmail(firebase.auth, email.trim());
      // The same answer whether or not the account exists.
      setNotice(`If there's an account for ${email.trim()}, a reset link is on its way.`);
    } catch (err) {
      fail(err);
    }
  }

  return (
    <form onSubmit={submit} className={styles.emailForm}>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      {notice ? <p role="status" className={styles.notice}>{notice}</p> : null}

      {mode === "sign-up" ? (
        <div>
          <label htmlFor="auth-name">Name</label>
          <input
            id="auth-name"
            className={styles.field}
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          required
          className={styles.field}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <div className={styles.labelRow}>
          <label htmlFor="auth-password">Password</label>
          {mode === "sign-in" ? (
            <button type="button" onClick={resetPassword} className={styles.forgot}>
              Forgot password?
            </button>
          ) : null}
        </div>
        <div className={styles.passwordWrap}>
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={mode === "sign-up" ? MIN_PASSWORD : undefined}
            className={styles.field}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            placeholder={mode === "sign-up" ? `At least ${MIN_PASSWORD} characters` : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={styles.reveal}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={busy} className={`${styles.submit} disabled:opacity-60`}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
