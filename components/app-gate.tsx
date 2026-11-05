"use client";

import { useEffect, useState } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { applySavedLanguage } from "@/lib/preferences";

// The server can't know this browser's language or data, so it sends a loading frame
// with no text. The app then renders once, already in the right language.
export function AppGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applySavedLanguage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (mounted) return children;

  return (
    <div className="flex min-h-screen flex-col md:flex-row md:gap-2 md:p-2" aria-busy="true">
      <div className="hidden w-[248px] shrink-0 rounded-3xl border border-line bg-card md:block" />
      <main className="min-w-0 flex-1 bg-cream md:rounded-3xl md:border md:border-line">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8 md:py-10 xl:px-12">
          <PageSkeleton />
        </div>
      </main>
    </div>
  );
}
