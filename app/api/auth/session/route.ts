import { connection } from "next/server";
import { hasGmail, isGoogleConfigured, readSession } from "@/lib/google-session";
import { createClient } from "@/lib/supabase/server";

type Metadata = { full_name?: unknown; name?: unknown };

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

// The signed-in person's id, email and name. Google accounts supply name instead of full_name.
async function currentAccount() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims?.sub) return null;
    const metadata = (claims.user_metadata ?? {}) as Metadata;
    const provider = (claims.app_metadata as { provider?: unknown } | undefined)?.provider;
    return {
      userId: claims.sub,
      email: text(claims.email),
      name: text(metadata.full_name) ?? text(metadata.name),
      provider: text(provider),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  // Always per request: the answer depends on this visitor's cookie.
  await connection();
  const [session, account] = await Promise.all([readSession(), currentAccount()]);
  return Response.json(
    {
      userId: account?.userId ?? null,
      account,
      configured: isGoogleConfigured(),
      gmail: hasGmail(session),
      email: session?.email,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
