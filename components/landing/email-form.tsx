"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import styles from "./auth.module.css";

export type AuthMode = "sign-in" | "sign-up" | "forgot" | "reset";

const ENDPOINT: Record<AuthMode, string> = {
  "sign-in": "/api/auth/sign-in",
  "sign-up": "/api/auth/sign-up",
  forgot: "/api/auth/forgot",
  reset: "/api/auth/reset",
};

const SUBMIT: Record<AuthMode, { idle: string; busy: string }> = {
  "sign-in": { idle: "Sign in", busy: "Signing in…" },
  "sign-up": { idle: "Create account", busy: "Creating your account…" },
  forgot: { idle: "Send reset link", busy: "Sending…" },
  reset: { idle: "Save new password", busy: "Saving…" },
};

export function EmailForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  const needsEmail = mode !== "reset";
  const needsPassword = mode !== "forgot";
  const newPassword = mode === "sign-up" || mode === "reset";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const found: typeof errors = {};
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Enter a valid email address.";
    if (needsPassword) {
      if (newPassword && password.length < 8) found.password = "Use at least 8 characters.";
      else if (newPassword && password.length > 72) found.password = "Use 72 characters or fewer.";
      else if (!password) found.password = "Enter your password.";
    }
    setErrors(found);
    setFormError(null);
    if (found.email || found.password) return;

    setBusy(true);
    try {
      const res = await fetch(ENDPOINT[mode], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(needsEmail ? { email: email.trim() } : {}),
          ...(needsPassword ? { password } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(body.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      if (mode === "forgot") {
        setLinkSentTo(email.trim());
        setBusy(false);
        return;
      }
      // A full page load, so the server sees the new session straight away.
      window.location.assign(next ?? "/dashboard");
    } catch {
      setFormError("Couldn't reach Finlio. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (linkSentTo) {
    return (
      <div role="status" className="rounded-xl border border-line bg-sand px-4 py-5 text-center">
        <MailCheck className="mx-auto size-5 text-success" aria-hidden />
        <p className="mt-2 text-[14px] font-medium text-ink">Check {linkSentTo}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          If that address has a Finlio account, a link to reset your password is on its way. Check your spam folder too.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={styles.emailForm}>
      {needsEmail && (
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${id}-email-err` : undefined}
            className={styles.field}
          />
          {errors.email ? <p id={`${id}-email-err`} className="mt-1.5 text-[13px] text-destructive">{errors.email}</p> : null}
        </div>
      )}
      {needsPassword && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={`${id}-pw`} className="text-[13px] font-medium text-ink">
              {mode === "reset" ? "New password" : "Password"}
            </label>
            {mode === "sign-in" ? (
              <Link href="/forgot-password" className="text-[12px] font-medium text-success hover:underline">
                Forgot password?
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <input
              id={`${id}-pw`}
              type={show ? "text" : "password"}
              autoComplete={newPassword ? "new-password" : "current-password"}
              placeholder={newPassword ? "At least 8 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${id}-pw-err` : undefined}
              className={`${styles.field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
            >
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
          {newPassword && !errors.password ? <p className={styles.passwordHint}>Use at least 8 characters for your password.</p> : null}
          {errors.password ? <p id={`${id}-pw-err`} className="mt-1.5 text-[13px] text-destructive">{errors.password}</p> : null}
        </div>
      )}
      {formError ? <p role="alert" className={styles.error} style={{ marginBottom: 0 }}>{formError}</p> : null}
      <button type="submit" disabled={busy} aria-busy={busy} className={`${styles.submit} gap-2 disabled:cursor-wait disabled:opacity-70`}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {busy ? SUBMIT[mode].busy : SUBMIT[mode].idle}
      </button>
    </form>
  );
}
