// What leaves the person's device, to whom and why. Shown in the Terms.
export const SHARING: { who: string; why: string; what: string }[] = [
  { who: "Google Cloud", why: "Your account and saved data", what: "Your email, name and picture from Google, plus your money data, encrypted by Finlio before it is saved" },
  { who: "Vercel", why: "Running Finlio", what: "Your requests pass through its servers, where your data is encrypted and decrypted" },
  { who: "Gmail (send only)", why: "Account emails", what: "Your email address and the message; Finlio cannot read any mailbox" },
  { who: "Upstox", why: "Live NSE prices", what: "NSE codes of your stocks" },
  { who: "Gemini", why: "Insights and Finlio chat", what: "Your totals and your question; no transactions or quantities" },
  {
    who: "icon.horse, Google favicons",
    why: "Company logos (can be turned off)",
    what: "Company web addresses like netflix.com, sent by Finlio's helper, not your browser",
  },
];
