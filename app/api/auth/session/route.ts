import { connection } from "next/server";
import { hasGmail, isGoogleConfigured, readSession } from "@/lib/google-session";

export async function GET() {
  // Always per request: the answer depends on this visitor's cookie.
  await connection();
  const session = await readSession();
  return Response.json({
    configured: isGoogleConfigured(),
    gmail: hasGmail(session),
    email: session?.email,
  });
}
