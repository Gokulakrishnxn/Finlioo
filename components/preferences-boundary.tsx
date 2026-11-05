"use client";

import { usePreferences } from "@/lib/preferences";

// Money is formatted as pages render, so a change to the number format or to hidden
// amounts redraws the page content, leaving the sidebar and open windows in place.
export function PreferencesBoundary({ children }: { children: React.ReactNode }) {
  const { numberFormat, hideAmounts } = usePreferences();
  return <div key={`${numberFormat}-${hideAmounts}`}>{children}</div>;
}
