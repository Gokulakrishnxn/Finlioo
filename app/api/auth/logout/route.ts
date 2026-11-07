import { disconnectGmail } from "@/lib/google-session";
import { createClient } from "@/lib/supabase/server";

// POST ends this browser's session and stops any Gmail access. The app removes its copy of
// the account's data from the device before calling this.
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Not configured or already signed out: nothing more to end.
  }
  await disconnectGmail();
  return Response.json({ signedOut: true });
}
