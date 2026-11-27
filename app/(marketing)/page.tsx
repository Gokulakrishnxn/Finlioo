import type { Metadata } from "next";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Privacy } from "@/components/landing/privacy";
import { Showcase } from "@/components/landing/showcase";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteNav } from "@/components/landing/site-nav";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.finlio.app"),
  title: "Finlio — Know why your money moved",
  description:
    "A private, AI-assisted money dashboard for India. Finlio adds up what you own and owe, tracks spending and goals, and explains your numbers in plain language. It never advises.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Finlio — Know why your money moved",
    description:
      "Your money, encrypted in your account. Finlio explains what changed in plain language, and never advises.",
    type: "website",
    url: "/",
    images: [{ url: "/finlio-mark.png", width: 1024, height: 1024, alt: "Finlio" }],
  },
  twitter: {
    card: "summary",
    title: "Finlio — Know why your money moved",
    description: "A private money dashboard that explains, and never advises.",
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-cream">
      <a
        href="#main"
        className="sr-only rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80]"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Hero />
        <Features />
        <Showcase />
        <Privacy />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
