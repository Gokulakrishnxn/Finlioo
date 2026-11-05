// How Finlio's AI should talk about money.
export const MONEY_STYLE =
  "India. Use rupee amounts written like ₹12,400 or ₹3.2 lakh, and Indian number words (lakh, crore).";

export const AI_LANGUAGES = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", kn: "Kannada", mr: "Marathi" } as const;

export type AiLanguage = keyof typeof AI_LANGUAGES;

export const AI_LANGUAGE_CODES = Object.keys(AI_LANGUAGES) as [AiLanguage, ...AiLanguage[]];

// Added to the AI's instructions: reply in the person's language, keeping ₹ and stock names as they are.
export const languageRule = (language: AiLanguage) =>
  language === "en" ? "" : `\n\nReply in ${AI_LANGUAGES[language]}. Keep rupee amounts and company names as they are.`;
