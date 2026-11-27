// The marketing page's copy, in one place. The Keynote copy deck in
// docs/landing.md is written from this file, so the page and the doc agree.

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
] as const;

export const FEATURES = [
  {
    id: "picture",
    icon: "wallet",
    title: "Your whole picture",
    body: "Your net worth. Every asset. One clear view.",
  },
  {
    id: "goals",
    icon: "target",
    title: "Goals with a clear pace",
    body: "The monthly amount needed, and when you should get there.",
  },
  {
    id: "analytics",
    icon: "trend",
    title: "Analytics over time",
    body: "Compare any period with the one before it.",
  },
  {
    id: "spending",
    icon: "mail",
    title: "Spending, sorted",
    body: "Turn bank and UPI emails into clear spending categories.",
  },
  {
    id: "ledger",
    icon: "landmark",
    title: "Assets meet liabilities",
    body: "Savings, investments, property and loans. All accounted for.",
  },
  {
    id: "chat",
    icon: "command",
    title: "Ask Finlio",
    body: "Clear answers from your totals and percentages.",
  },
] as const;

export const FAQS = [
  {
    q: "Where does my data actually live?",
    a: "Your data is stored on Google Cloud, encrypted in transit and at rest, and every request is checked against your account. You sign in with Google, or with an email and password that Firebase Auth holds and checks, so Finlio's servers never see or store your password. Finlio's servers can decrypt your data to show it to you. You can export it as CSV or JSON any time, or delete your account and financial data from Settings.",
  },
  {
    q: "Does Finlio tell me what to buy?",
    a: "No. Finlio explains changes in your finances. It does not recommend buying, selling or holding. It is not a SEBI-registered adviser, and nothing in it is investment advice.",
  },
  {
    q: "What leaves my device?",
    a: "Only what each feature needs: NSE codes for prices, totals and percentages for Insights and chat, and company web addresses for logos, which you can turn off. The Terms list all of it.",
  },
  {
    q: "Does Finlio read my Gmail?",
    a: "No. Google is used only to sign you in, and Finlio sends account emails from its own address. It never reads your inbox or your bank messages.",
  },
  {
    q: "Who is Finlio for?",
    a: "People in India. Finlio uses rupees, NSE stocks, the April to March financial year and Indian accounts like EPF, PPF and NPS.",
  },
  {
    q: "What if I clear my browser?",
    a: "Clearing browser data erases your financial data on this device. Download a backup first.",
  },
  {
    q: "Can I trust the AI's answers?",
    a: "It answers from your own totals and is told not to invent numbers, but AI can still make mistakes. Check anything important against the figures in your pages.",
  },
  {
    q: "Do I need an account?",
    a: "Yes. A free account keeps your data safe and lets you use Finlio on any device. Sign up with your email and a password.",
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Privacy", href: "#privacy" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Your data", href: "/terms#your-data" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
] as const;

// The numbers in the hero's dashboard replica. They are the sample household
// from the product's own demo data, so the page shows what the app shows.
export const NET_WORTH = 1_052_690;
export const NET_WORTH_CHANGE = 315_807;
export const NET_WORTH_CHANGE_PCT = 42.86;
export const ASSETS_TOTAL = 1_331_000;
export const LIABILITIES_TOTAL = 278_000;
export const THIS_MONTH = { in: 95_000, out: 28_300, saved: 66_700 };
export const QUARTERS = [
  { label: "Q2", fy: "FY26", value: 737_000 },
  { label: "Q3", fy: "FY26", value: 790_000 },
  { label: "Q4", fy: "FY26", value: 842_000 },
  { label: "Q1", fy: "FY27", value: 895_000 },
  { label: "Q2", fy: "FY27", value: 947_000 },
  { label: "Q3", fy: "FY27", value: 1_053_000 },
] as const;
export const RECENT_ACTIVITY = [
  { name: "Big Basket", kind: "Groceries · 6 Nov 2026", amount: "−₹4.6K", positive: false },
  { name: "Airtel", kind: "Bills & utilities · 4 Nov 2026", amount: "−₹599", positive: false },
  { name: "Salary", kind: "Salary · 1 Nov 2026", amount: "+₹95.0K", positive: true },
] as const;

const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inrShort = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const lakh = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatRupees = (value: number) => `₹${inr.format(value)}`;
export const formatRupeesShort = (value: number) => `₹${inrShort.format(value)}`;
export const formatLakh = (value: number) => `₹${lakh.format(value / 100_000)}L`;
export const formatThousands = (value: number) => `₹${(value / 1000).toFixed(1)}K`;
