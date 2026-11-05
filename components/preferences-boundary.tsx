"use client";

import { languageReady, usePreferences } from "@/lib/preferences";

// Money is formatted as pages render, so a change to the language, number format or
// hidden amounts redraws the page content, leaving the sidebar and open windows in place.
export function PreferencesBoundary({ children }: { children: React.ReactNode }) {
  const { numberFormat, hideAmounts, language } = usePreferences();
  return <div key={`${numberFormat}-${hideAmounts}-${language}-${languageReady()}`}>{children}</div>;
}
