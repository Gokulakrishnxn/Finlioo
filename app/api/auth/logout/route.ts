import { disconnectGmail } from "@/lib/google-session";

// POST signs out: revokes Google's access and forgets the session cookie.
// Data saved in this browser (holdings, goals, etc.) is left untouched.
export async function POST() {
  await disconnectGmail();
  return Response.json({ signedOut: true });
}
