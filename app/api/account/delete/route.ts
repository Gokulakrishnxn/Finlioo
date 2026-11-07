import { API_LIMITS, guard } from "@/lib/api-guard";
import { disconnectGmail } from "@/lib/google-session";
import { createClient } from "@/lib/supabase/server";

// Permanently deletes the signed-in person's account and all their saved records.
export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.accountDelete);
  if (blocked) return blocked;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return Response.json({ error: "Please sign in to continue." }, { status: 401 });
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw new Error(error.code);
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    await disconnectGmail();
    return Response.json({ deleted: true });
  } catch (err) {
    console.error("[account] delete:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Couldn't delete your account. Please try again." }, { status: 502 });
  }
}
