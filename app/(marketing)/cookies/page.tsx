import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Cookie, HardDrive, ShieldCheck } from "lucide-react";
import { CookiePreferencesButton } from "@/components/landing/cookie-notice";

export const metadata: Metadata = {
  title: "Cookies & local storage · Finlio",
  description: "What Finlio saves in your browser, how its cookies keep you signed in, and how to manage your data.",
};

const COOKIES = [
  {
    name: "finlio_session",
    purpose: "Keeps you signed in. It holds only a random, signed session id; the session itself is stored on Google Cloud. It is hidden from page scripts.",
    duration: "Up to 30 days, or until you log out",
  },
  {
    name: "finlio_oauth_state",
    purpose: "Checks that a Google response belongs to the sign-in you started.",
    duration: "10 minutes; removed when sign-in completes",
  },
];

const LOCAL_STORAGE = [
  { name: "finlio:vault:…", detail: "A working copy of your holdings, assets, loans, income, expenses, history and profile, plus any changes not yet saved. Removed when you log out." },
  { name: "finlio:v1", detail: "Data from before you had an account, until you move it to your account or delete it." },
  { name: "Interface preferences", detail: "Your theme, sidebar and company-logo choices." },
  { name: "finlio:cookie-notice", detail: "The version of this notice you acknowledged and when you saw it." },
];

const linkClass = "rounded-sm font-medium text-[#285e9e] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#3775cc] focus-visible:ring-offset-2";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white text-[#343433] [color-scheme:light]">
      <header className="border-b border-[#ecebe7]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 rounded-sm text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#3775cc]">
            <ArrowLeft className="size-4" strokeWidth={1.75} /> Back to Finlio
          </Link>
          <Link href="/terms" className="rounded-sm text-[14px] text-[#68655f] hover:text-[#343433] focus-visible:outline-2 focus-visible:outline-[#3775cc]">Terms</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#fff4df] text-[#9a6818]">
          <Cookie className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-6 text-[12px] font-semibold tracking-[0.14em] text-[#9a6818] uppercase">Your browser, your data</p>
        <h1 className="mt-3 text-[clamp(2rem,6vw,3rem)] leading-[1.1] font-medium tracking-[-0.04em]">Cookies & local storage</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#68655f]">
          Finlio saves your money data to your account, encrypted, and uses this browser to keep you signed in and work quickly. It uses no advertising or analytics trackers. Here is what is saved and how you can manage it.
        </p>

        <section aria-labelledby="cookies-heading" className="mt-12 border-t border-[#ecebe7] pt-8">
          <h2 id="cookies-heading" className="flex items-center gap-2.5 text-[22px] font-medium tracking-tight">
            <ShieldCheck className="size-5 text-[#716f6b]" strokeWidth={1.75} aria-hidden /> Sign-in cookies
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#68655f]">
            These are set when you sign in with Google. Both use SameSite=Lax, are hidden from page scripts (httpOnly), and are sent over HTTPS in production.
          </p>
          <dl className="mt-5 divide-y divide-[#e8e5df] overflow-hidden rounded-2xl border border-[#e8e5df] bg-[#fbfaf9]">
            {COOKIES.map((item) => (
              <div key={item.name} className="p-5">
                <dt className="break-words font-mono text-[14px] font-medium text-[#343433]">{item.name}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-[#68655f]">{item.purpose}</dd>
                <dd className="mt-2 text-[13px] font-medium text-[#343433]">{item.duration}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[14px] leading-relaxed text-[#68655f]">Logging out removes the session cookie and ends the session on Google Cloud.</p>
        </section>

        <section aria-labelledby="storage-heading" className="mt-10 border-t border-[#ecebe7] pt-8">
          <h2 id="storage-heading" className="flex items-center gap-2.5 text-[22px] font-medium tracking-tight">
            <HardDrive className="size-5 text-[#716f6b]" strokeWidth={1.75} aria-hidden /> Saved on this device
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#68655f]">
            Local storage is separate from cookies. It is not automatically attached to web requests. While you are signed in, Finlio keeps a working copy of your data here, and removes it when you log out. Your saved copy is encrypted in your account.
          </p>
          <dl className="mt-5 space-y-4 rounded-2xl bg-[#f6f4ef] p-5">
            {LOCAL_STORAGE.map((item) => (
              <div key={item.name}>
                <dt className="text-[14px] font-semibold">{item.name}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-[#68655f]">{item.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[14px] leading-relaxed text-[#68655f]">
            Some features send the information they need to outside services. For example, prices use stock identifiers, chat uses totals and your question. The Terms list the services and data involved.
          </p>
        </section>

        <section aria-labelledby="signin-heading" className="mt-10 border-t border-[#ecebe7] pt-8">
          <h2 id="signin-heading" className="text-[22px] font-medium tracking-tight">About signing in with Google</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#68655f]">
            Google is used only to sign you in. Finlio receives your name, email address and picture, and never reads your Gmail.
          </p>
        </section>

        <section aria-labelledby="manage-heading" className="mt-10 border-t border-[#ecebe7] pt-8">
          <h2 id="manage-heading" className="text-[22px] font-medium tracking-tight">Manage what is saved</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#68655f]">
            Export a backup from Settings any time. Erase all data removes your money data, and Delete my account removes your account too. Browser site settings can remove cookies and saved preferences, which signs you out on this device.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#68655f]">
            If your browser blocks storage, Finlio can keep some choices for the current page session, but they may not survive a reload. Signing in needs its cookies to work.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
            <CookiePreferencesButton className={linkClass} />
            <Link href="/dashboard" className={`${linkClass} inline-flex items-center gap-1`}>Open Finlio <ArrowUpRight className="size-3.5" aria-hidden /></Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#ecebe7] bg-[#fbfaf9] px-5 py-7 text-center text-[13px] text-[#716f6b]">
        Finlio explains. It does not advise. <Link href="/" className="ml-2 underline underline-offset-3">Back to home</Link>
      </footer>
    </div>
  );
}
