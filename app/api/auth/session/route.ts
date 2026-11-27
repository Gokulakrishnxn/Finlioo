import { connection } from "next/server";
import { authConfigured, currentAccount } from "@/lib/auth/session";

export async function GET() {
  // Always per request: the answer depends on this visitor's cookie.
  await connection();
  const account = await currentAccount();
  return Response.json(
    { userId: account?.userId ?? null, account, configured: authConfigured(), gmail: false, email: account?.email },
    { headers: { "Cache-Control": "no-store" } },
  );
}
