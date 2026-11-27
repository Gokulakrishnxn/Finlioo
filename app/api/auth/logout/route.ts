import { endSession } from "@/lib/auth/session";

// POST ends this browser's session. The app removes its copy of the account's data from the
// device before calling this.
export async function POST() {
  await endSession();
  return Response.json({ signedOut: true });
}
