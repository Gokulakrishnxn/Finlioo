"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPreferences } from "@/lib/preferences";

// The home address opens the page chosen in Settings.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getPreferences().landing);
  }, [router]);

  return null;
}
