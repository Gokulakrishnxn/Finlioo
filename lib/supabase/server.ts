import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/supabase/config";

export class SupabaseNotConfiguredError extends Error {}

// One client per request, because it carries that person's session cookies.
export async function createClient() {
  const config = supabaseConfig();
  if (!config) throw new SupabaseNotConfiguredError("Accounts aren't set up yet.");
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components can't write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

// True when Google sign-in is switched on in this Supabase project.
export async function isGoogleEnabled() {
  const config = supabaseConfig();
  if (!config) return false;
  try {
    const res = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.key },
      signal: AbortSignal.timeout(5000),
    });
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}
