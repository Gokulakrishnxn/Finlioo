import { currentLanguage, type Language } from "@/lib/preferences";
import hi from "@/lib/i18n/hi";
import kn from "@/lib/i18n/kn";
import mr from "@/lib/i18n/mr";
import ta from "@/lib/i18n/ta";
import te from "@/lib/i18n/te";

// Translations are keyed by the English text, so English needs no dictionary and any
// missing phrase falls back to readable English instead of a blank or a code.
const DICTIONARIES: Partial<Record<Language, Record<string, string>>> = { hi, ta, te, kn, mr };

const warned = new Set<string>();

export function t(english: string, vars?: Record<string, string | number>) {
  const language = currentLanguage();
  const dictionary = DICTIONARIES[language];
  let text = dictionary?.[english];
  if (!text) {
    text = english;
    if (dictionary && process.env.NODE_ENV !== "production" && !warned.has(`${language}:${english}`)) {
      warned.add(`${language}:${english}`);
      console.warn(`[i18n] Missing ${language} translation: ${english}`);
    }
  }
  if (vars) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}
