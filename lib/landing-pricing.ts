// Placeholder plans for the marketing page. Finlio has not published pricing,
// so these numbers are examples and live here alone: change them in one place.
// Copy next to the plans says they are examples while Finlio is in early access.

export type Billing = "monthly" | "yearly";

export type Plan = {
  id: "free" | "pro" | "max";
  name: string;
  tagline: string;
  monthly: number | null;
  yearly: number | null;
  cta: string;
  featured?: boolean;
  bullets: readonly string[];
};

export const CURRENCY = "₹";

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to see the whole picture.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    bullets: [
      "Net worth and quarterly bars",
      "Holdings, expenses, assets and loans",
      "Analytics and goals",
      "India and the United States",
      "Local-only storage, JSON backups",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "The brief, the chat, and the reason behind the move.",
    monthly: 199,
    yearly: 1999,
    cta: "Start 14 days free",
    featured: true,
    bullets: [
      "Everything in Free",
      "The morning brief, with a source on every line",
      "Finlio chat (⌘L) in plain English",
      "Why it moved, on every holding",
      "Read-only Gmail spending sync",
    ],
  },
  {
    id: "max",
    name: "Max",
    tagline: "Connect your finances to your preferred AI.",
    monthly: null,
    yearly: null,
    cta: "Coming soon",
    bullets: [
      "Everything in Pro",
      "Connect with Claude",
      "Connect with ChatGPT",
      "Connect with Gemini",
    ],
  },
] as const;

export const PRICING_NOTE =
  "Cancel any time. Your data is yours either way. Prices are examples while Finlio is in early access.";

export const price = (plan: Plan, billing: Billing) => (billing === "yearly" ? plan.yearly : plan.monthly);
