import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Wordmark } from "./site-nav";
import { EmailSignIn } from "./email-sign-in";
import { GoogleSignIn } from "./google-sign-in";

export type AuthMode = "sign-in" | "sign-up";
import styles from "./auth.module.css";

const COPY: Record<AuthMode, { title: string; lead: string; cta: string; altText?: string; altLabel?: string; altHref?: string }> = {
  "sign-in": {
    title: "Welcome back",
    lead: "Sign in to see where your money moved.",
    cta: "Sign in with Google",
    altText: "New to Finlio?",
    altLabel: "Create an account",
    altHref: "/sign-up",
  },
  "sign-up": {
    title: "Join Finlio",
    lead: "A little clarity. A lot more confidence. Start here.",
    cta: "Sign up with Google",
    altText: "Already have an account?",
    altLabel: "Sign in",
    altHref: "/sign-in",
  },
};

const ERRORS: Record<string, string> = {
  denied: "Google sign-in was cancelled. You can try again whenever you're ready.",
  failed: "Something went wrong while signing you in. Please try again.",
  "not-configured": "This sign-in option isn't set up yet. Please try again later.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const STEPS = ["Add your money in one place", "See what changed this month", "Understand why it moved"];

export function AuthCard({ mode, error, next }: { mode: AuthMode; error?: string; next?: string }) {
  const c = COPY[mode];
  const message = error ? (ERRORS[error] ?? ERRORS.failed) : null;

  return (
    <div className={`marketing-theme ${styles.canvas}`}>
      <div className={styles.page}>
        <aside className={styles.story}>
          <Link href="/" aria-label="Finlio home" className={styles.brand}>
            <Wordmark className="flex items-center gap-2" />
          </Link>
          <div className={styles.storyContent}>
            <span className={styles.eyebrow}>Know why your money moved</span>
            <h2>Your money, in one view.</h2>
            <p>Understand what changed and why, without handing over your bank logins.</p>
            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <li key={step} className={index === 0 ? styles.activeStep : undefined}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <p className={styles.storyFooter}><ShieldCheck className="size-3.5" aria-hidden /> Your money data is encrypted in your account.</p>
          </div>
        </aside>

        <div className={styles.formSide}>
          <div className={styles.header}>
            <Link href="/" className={styles.back}><ArrowLeft className="size-3.5" aria-hidden /> Back to home</Link>
          </div>
          <main className={styles.main}>
            <div className={styles.form}>
              <h1>{c.title}</h1>
              <p className={styles.lead}>{c.lead}</p>
              {message ? <p role="alert" className={styles.error}>{message}</p> : null}

              <EmailSignIn mode={mode} next={next} />

              <div className={styles.divider} aria-hidden><span />or<span /></div>

              <GoogleSignIn label={c.cta} next={next}><GoogleMark /></GoogleSignIn>

              {c.altHref ? (
                <p className={styles.switch}>
                  {c.altText} <Link href={c.altHref}>{c.altLabel}</Link>
                </p>
              ) : null}
              <p className={styles.legal}>
                By continuing you agree to the <Link href="/terms">Terms</Link> and <Link href="/cookies">Cookie notice</Link>. Your password is held by Firebase Auth, never by Finlio, and Finlio never reads your email.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
