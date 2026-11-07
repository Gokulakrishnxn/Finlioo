import { disconnectGmail } from "@/lib/google-session";
import { createClient } from "@/lib/supabase/server";

// POST signs out everywhere this browser is signed in and stops any Gmail access.
// Data saved in this browser (holdings, goals, etc.) is left untouched.
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
