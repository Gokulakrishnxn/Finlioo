"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./auth.module.css";

type Mode = "sign-in" | "sign-up";

const field = styles.field;

// UI only: there is no account store yet, so a valid submit explains that
// instead of pretending to sign anyone in.
export function EmailForm({ mode }: { mode: Mode }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [notice, setNotice] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (mode === "sign-up" ? password.length < 8 : password.length === 0)
      next.password = mode === "sign-up" ? "Use at least 8 characters." : "Enter your password.";
    setErrors(next);
    setNotice(Object.keys(next).length === 0);
  }

  return (
    <form onSubmit={submit} noValidate className={styles.emailForm}>
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
          className={field}
        />
        {errors.email ? <p id={`${id}-email-err`} className="mt-1.5 text-[13px] text-destructive">{errors.email}</p> : null}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={`${id}-pw`} className="text-[13px] font-medium text-ink">Password</label>
          
        </div>
        <div className="relative">
          <input
            id={`${id}-pw`}
            type={show ? "text" : "password"}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            placeholder={mode === "sign-up" ? "At least 8 characters" : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? `${id}-pw-err` : undefined}
            className={`${field} pr-12`}
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
        {mode === "sign-up" && !errors.password ? <p className={styles.passwordHint}>Use at least 8 characters for your password.</p> : null}
        {errors.password ? <p id={`${id}-pw-err`} className="mt-1.5 text-[13px] text-destructive">{errors.password}</p> : null}
      </div>

      {notice ? (
        <p role="status" className="rounded-xl border border-line bg-sand px-4 py-3 text-[14px] text-muted-foreground">
          Email accounts aren&apos;t available yet. Please continue with Google for now.
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.submit}
      >
        {mode === "sign-in" ? "Sign in" : "Continue"}
      </button>
    </form>
  );
}
