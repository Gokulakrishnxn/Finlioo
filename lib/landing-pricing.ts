// The plans shown on the marketing page. Finlio has no published prices: every
// plan is open during early access, so the page lists what each one includes
// and sends people straight into the app.

export type Plan = {
  id: "free" | "pro" | "max";
  name: string;
  tagline: string;
  cta: string;
  featured?: boolean;
  bullets: readonly string[];
};

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to see the whole picture.",
    cta: "Get started",
    bullets: [
      "Net worth and quarterly bars",
      "Holdings, expenses, assets and loans",
      "Analytics and goals",
      "Built for India: NSE, EPF, PPF and NPS",
      "Encrypted cloud storage, CSV and JSON export",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Plain-language AI summaries and chat.",
    cta: "Get Pro",
    featured: true,
    bullets: [
      "Everything in Free",
      "Plain-language AI summaries in Insights",
      "Finlio chat (⌘L), answered from your totals",
    ],
  },
  {
    id: "max",
    name: "Max",
    tagline: "Connect your finances to your preferred AI.",
    cta: "Get Max",
    bullets: [
      "Everything in Pro",
      "Connect with Claude",
      "Connect with ChatGPT",
      "Connect with Gemini",
    ],
  },
] as const;

export const PRICING_NOTE = "Every plan is open while Finlio is in early access. Your data is yours either way.";
