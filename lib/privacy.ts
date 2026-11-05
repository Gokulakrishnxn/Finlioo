// What leaves the person's device, to whom and why. Shown in the Terms.
export const SHARING: { who: string; why: string; what: string }[] = [
  { who: "Upstox", why: "Live NSE prices", what: "NSE codes of your stocks" },
  { who: "Gmail (read-only)", why: "Transactions, if you connect it", what: "Google shares your name and email, and Finlio reads bank, card and payment alerts only" },
  { who: "Gemini", why: "Reading those alerts", what: "Each alert's sender, subject and preview" },
  { who: "Gemini", why: "Insights and Finlio chat", what: "Your totals and your question; no transactions or quantities" },
  {
    who: "icon.horse, Google favicons",
    why: "Company logos (can be turned off)",
    what: "Company web addresses like netflix.com, sent by Finlio's helper, not your browser",
  },
];
