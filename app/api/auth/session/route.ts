import { connection } from "next/server";
import { hasGmail, isGoogleConfigured, readSession } from "@/lib/google-session";
import { createClient } from "@/lib/supabase/server";

async function currentUserId() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return data?.claims?.sub ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  // Always per request: the answer depends on this visitor's cookie.
  await connection();
  const [session, userId] = await Promise.all([readSession(), currentUserId()]);
  return Response.json(
    {
      userId,
      configured: isGoogleConfigured(),
      gmail: hasGmail(session),
      email: session?.email,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
