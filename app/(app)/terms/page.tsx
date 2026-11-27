import Link from "next/link";
import { SHARING } from "@/lib/privacy";
import { TERMS_UPDATED } from "@/lib/terms";

export const metadata = { title: "Terms & Conditions · Finlio" };

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. What Finlio is",
    body: (
      <>
        <p>
          Finlio (&ldquo;Finlio&rdquo;, &ldquo;we&rdquo;) is a personal-finance app for people in India.
          It shows the stocks, accounts, income and spending you add, and uses AI to explain
          in plain words what changed and why.
        </p>
        <p>
          Finlio is in early access. Features may change or stop working, and it is currently free of charge.
        </p>
      </>
    ),
  },
  {
    title: "2. Finlio explains; it does not advise",
    body: (
      <>
        <p className="rounded-xl bg-sand p-4 font-medium text-ink">
          Finlio is not a licensed or registered financial adviser. Nothing in Finlio is investment, financial, tax
          or legal advice.
        </p>
        <p>
          Finlio is not registered as an investment adviser or research analyst with the Securities and Exchange
          Board of India (SEBI) or the U.S. Securities and Exchange Commission (SEC), and is not a broker,
          distributor or portfolio manager.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Finlio shows and explains your own numbers. It does not tell you to buy, sell or hold anything, or which product to choose.</li>
          <li>Goal figures are arithmetic based on what you enter. They are not a financial plan.</li>
          <li>Finlio AI is told not to give recommendations, and its replies are checked for them, but AI can make mistakes and a check can miss one. If a reply sounds like a recommendation, do not treat it as advice.</li>
        </ul>
        <p>
          Your financial decisions are your own. Before you act, check the numbers and, where needed, talk to a
          SEBI-registered adviser or another qualified professional.
        </p>
      </>
    ),
  },
  {
    title: "3. Information can be wrong or late",
    body: (
      <p>
        Prices, bank-alert readings and AI explanations come from third parties and from AI
        models. They can be delayed, incomplete or wrong. Always check important numbers with your broker, bank
        or the original source before relying on them. Stock prices may be delayed and market holidays are not
        shown.
      </p>
    ),
  },
  {
    title: "4. Your data",
    body: (
      <>
        <p>
          Your data is stored on Google Cloud (Firestore), encrypted in transit and at rest. Finlio
          also encrypts your money data before it is stored. Every request is checked against your account before any
          data is read or changed.
        </p>
        <p>
          Passwords are securely hashed, never stored in plain text. Your email address and name are stored with your
          account in readable form, so we can sign you in and show them to you.
        </p>
        <p>
          You can export all your data as CSV or JSON at any time, and delete your account and all your financial data,
          from <em>Settings → Data controls</em>. <em>Erase all data</em> removes your money data and keeps your account.{" "}
          <em>Delete my account</em> removes both. Deleted data stays in encrypted backups until those backups expire,
          up to 30 days later.
        </p>
        <p>
          Finlio&apos;s servers can decrypt your data in order to show it to you and run the features you use. A copy
          of the database alone cannot be read. While you are signed in, your browser keeps a working copy, which is
          removed when you log out.
        </p>
        <p id="your-data">
          To work, Finlio sends limited information to other services. Exactly what is sent:
        </p>
        <ul className="space-y-1.5">
          {SHARING.map((s) => (
            <li key={`${s.who}-${s.why}`}>
              <strong className="font-medium text-ink">{s.who}</strong> ({s.why}): {s.what}.
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: "5. Third-party services",
    body: (
      <>
        <p>Finlio relies on services run by other companies, each under its own terms:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Google Cloud, for sign-in and your stored data; Vercel, for running Finlio; and Gmail, for account emails.</li>
          <li>Google Gemini and Google Search, for insights and chat.</li>
          <li>Upstox, for NSE stock prices, and NSE, for the list of stocks.</li>
          <li>icon.horse and Google&apos;s favicon service, for company logos (can be turned off).</li>
        </ul>
        <p>
          Company names and logos shown in Finlio belong to their owners and are used only to identify your own
          holdings and spending. Finlio is not affiliated with or endorsed by them.
        </p>
      </>
    ),
  },
  {
    title: "6. Signing in",
    body: (
      <>
        <p>
          You can sign in with Google, or with an email address and password. Finlio uses your Google account only to
          sign you in and to send you account emails from Finlio&apos;s own address. It never reads your Gmail, your
          bank messages or any other mail, and it asks Google only for your name, email address and profile picture.
        </p>
        <p className="mt-3">
          If you use an email and password, Google&apos;s Firebase Authentication stores and checks your password;
          Finlio&apos;s servers never receive or store it. You must verify your email address before you can sign in,
          and password reset links come from Firebase.
        </p>
      </>
    ),
  },
  {
    title: "7. Using Finlio fairly",
    body: (
      <p>
        Use Finlio for your own personal finances and within the law. Do not try to break, overload or misuse
        the service or the services it connects to, or use it to process other people&apos;s data without
        their permission.
      </p>
    ),
  },
  {
    title: "8. No warranty and limits on liability",
    body: (
      <p>
        Finlio is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind, to
        the extent the law allows. We are not liable for losses or decisions made from information shown in
        Finlio, or for data lost through events outside our reasonable control. Nothing in these Terms limits rights you have that cannot be
        limited under the law, including consumer protection laws in India.
      </p>
    ),
  },
  {
    title: "9. Changes and contact",
    body: (
      <p>
        We may update these Terms. The date at the top of this page shows when they last changed. Contact details
        for questions and complaints will be added here before Finlio opens to the public.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 text-[30px] leading-tight font-semibold tracking-tight text-ink md:text-[36px]">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">Last updated {TERMS_UPDATED}</p>
        <p className="mt-4 rounded-2xl bg-warning-soft px-4 py-3 text-[13px] leading-relaxed text-warning">
          Draft, written in plain English. It has not been reviewed by a lawyer and should be before Finlio is
          offered to the public.
        </p>
      </header>

      <div className="card-surface divide-y divide-line">
        {SECTIONS.map((s) => (
          <section key={s.title} className="space-y-3 p-6 text-[15px] leading-relaxed text-body md:p-8">
            <h2 className="text-[16px] font-semibold text-ink">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        <Link href="/dashboard" className="underline">
          Back to Finlio
        </Link>
      </p>
    </article>
  );
}

export const instant = false;
