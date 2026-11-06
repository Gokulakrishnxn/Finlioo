// The marketing page's copy, in one place. The Keynote copy deck in
// docs/landing.md is written from this file, so the page and the doc agree.

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const PRINCIPLES = [
  "No Finlio database",
  "Your money stays in your browser",
  "Every claim has a source",
  "Explain, never advise",
  "India and the United States",
] as const;

export const FEATURES = [
  {
    id: "picture",
    icon: "wallet",
    title: "Your whole picture",
    body: "Your net worth. Every asset. One clear view.",
  },
  {
    id: "brief",
    icon: "news",
    title: "The morning brief",
    body: "The news behind your holdings, with sources.",
  },
  {
    id: "moved",
    icon: "trend",
    title: "Why it moved",
    body: "The move and the reason, together.",
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

export const BRIEF_LINES = [
  { label: "Deserves your attention", text: "Your bank raises fixed-deposit rates this week.", source: "The Economic Times" },
  { label: "What changed", text: "Reliance closed up 1.8% after its results.", source: "NSE" },
  { label: "Coming up", text: "Infosys reports on Thursday before the open.", source: "BSE" },
] as const;

export const FAQS = [
  {
    q: "Where does my data actually live?",
    a: "Your financial data stays in this browser. Finlio has no database storing it.",
  },
  {
    q: "Does Finlio tell me what to buy?",
    a: "No. Finlio explains changes in your finances. It does not recommend buying, selling or holding.",
  },
  {
    q: "What leaves my device?",
    a: "Three things, and only when you ask for them: stock symbols so prices can be fetched, stock names and symbols so the brief can be written, and totals and percentages so chat can answer you.",
  },
  {
    q: "Why would I connect Gmail?",
    a: "Only if you want spending tracked. It is a separate, optional, read-only grant that turns bank and UPI alerts into categories. You can revoke it without signing out.",
  },
  {
    q: "Which countries work today?",
    a: "India and the United States. Currency, stock market, financial year and account types follow the country you choose, including Indian financial-year quarters.",
  },
  {
    q: "What if I clear my browser?",
    a: "Clearing browser data or signing out erases your financial data on this device. Download a backup first.",
  },
  {
    q: "How do I know the AI isn't inventing reasons?",
    a: "No source, no sentence. Every line of the brief is validated, and a stock with no news says it has no news rather than making a reason up.",
  },
  {
    q: "Do I need an account?",
    a: "Signing in with Google keeps your profile and avatar. If Finlio is running without keys, it offers to open on this device instead, so you can look around first.",
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Privacy", href: "#privacy" },
      { label: "Pricing", href: "#pricing" },
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
