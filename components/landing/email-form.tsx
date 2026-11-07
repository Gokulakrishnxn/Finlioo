"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import styles from "./auth.module.css";

export type AuthMode = "sign-in" | "sign-up" | "forgot" | "reset";

const RESEND_SECONDS = 60;

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

async function post(url: string, payload: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string; needsConfirmation?: boolean };
  return { ok: res.ok, ...body };
}

export function EmailForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const id = useId();
  const [step, setStep] = useState<"details" | "code" | "link-sent">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  const needsEmail = mode !== "reset";
  const needsPassword = mode !== "forgot";
  const newPassword = mode === "sign-up" || mode === "reset";
  const enter = () => window.location.assign(next ?? "/dashboard");

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  // Runs one request with the shared busy state and network error message.
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setFormError(null);
    setNotice(null);
    setBusy(true);
    try {
      await task();
    } catch {
      setFormError("Couldn't reach Finlio. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function showCodeStep(address: string) {
    setEmail(address);
    setCode("");
    setErrors({});
    setWait(RESEND_SECONDS);
    setStep("code");
  }

  function submitDetails(event: React.FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Enter a valid email address.";
    if (needsPassword) {
      if (newPassword && password.length < 8) found.password = "Use at least 8 characters.";
      else if (newPassword && password.length > 72) found.password = "Use 72 characters or fewer.";
      else if (!password) found.password = "Enter your password.";
    }
    setErrors(found);
    if (found.email || found.password) return;
    void run(async () => {
      const address = email.trim();
      const result = await post(ENDPOINT[mode], {
        ...(needsEmail ? { email: address } : {}),
        ...(needsPassword ? { password } : {}),
      });
      // Signed up earlier but never entered the code: send a fresh one and ask for it.
      if (!result.ok && result.reason === "email_not_confirmed") {
        await post("/api/auth/resend", { email: address });
        showCodeStep(address);
        return;
      }
      if (!result.ok) {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (mode === "forgot") {
        setEmail(address);
        setStep("link-sent");
        return;
      }
      if (mode === "sign-up" && result.needsConfirmation) {
        showCodeStep(address);
        return;
      }
      enter();
    });
  }

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6,10}$/.test(code)) {
      setErrors({ code: "Enter the full code from your email." });
      return;
    }
    setErrors({});
    void run(async () => {
      const result = await post("/api/auth/verify", { email, code });
      if (!result.ok) {
        setFormError(result.error ?? "Couldn't check that code. Please try again.");
        return;
      }
      enter();
    });
  }

  function resend() {
    void run(async () => {
      const result = await post("/api/auth/resend", { email });
      if (!result.ok) {
        setFormError(result.error ?? "Couldn't send a new code. Please try again.");
        return;
      }
      setCode("");
      setWait(RESEND_SECONDS);
      setNotice("A new code is on its way.");
    });
  }

  const submitButton = (idle: string, working: string) => (
    <button type="submit" disabled={busy} aria-busy={busy} className={`${styles.submit} gap-2 disabled:cursor-wait disabled:opacity-70`}>
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {busy ? working : idle}
    </button>
  );

  const errorLine = formError ? (
    <p role="alert" className={styles.error} style={{ marginBottom: 0 }}>{formError}</p>
  ) : null;

  if (step === "link-sent") {
    return (
      <div role="status" className="rounded-xl border border-line bg-sand px-4 py-5 text-center">
        <MailCheck className="mx-auto size-5 text-success" aria-hidden />
        <p className="mt-2 text-[14px] font-medium text-ink">Check {email}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          If that address has a Finlio account, a link to reset your password is on its way. Check your spam folder too.
        </p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} noValidate className={styles.emailForm} data-auth-step="code">
        <div>
          <h1>Check your email</h1>
          <p className={styles.lead} style={{ marginBottom: 0 }}>
            We sent a code to <strong className="font-medium text-ink">{email}</strong>. It may take a minute, so check your spam folder too.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-code`} className="mb-1.5 block text-[13px] font-medium text-ink">Code</label>
          <input
            id={`${id}-code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={10}
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? `${id}-code-err` : undefined}
            className={`${styles.field} nums text-center tracking-[0.3em] placeholder:tracking-normal`}
          />
          {errors.code ? <p id={`${id}-code-err`} className="mt-1.5 text-[13px] text-destructive">{errors.code}</p> : null}
        </div>
        {notice ? <p role="status" className="text-center text-[13px] text-success">{notice}</p> : null}
        {errorLine}
        {submitButton("Verify", "Checking…")}
        <div className="flex items-center justify-between gap-3 text-[12px]">
          <button type="button" onClick={() => { setStep("details"); setFormError(null); setNotice(null); }} className="text-muted-foreground hover:text-ink">
            Use a different email
          </button>
          <button type="button" onClick={resend} disabled={wait > 0 || busy} className="font-medium text-success hover:underline disabled:font-normal disabled:text-muted-foreground disabled:no-underline">
            {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitDetails} noValidate className={styles.emailForm}>
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
      {errorLine}
      {submitButton(SUBMIT[mode].idle, SUBMIT[mode].busy)}
    </form>
  );
}
