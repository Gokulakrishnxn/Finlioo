import { API_LIMITS, guard } from "@/lib/api-guard";
import { currentUserId, endAllSessions } from "@/lib/auth/session";
import { deleteAccount } from "@/lib/vault/store";

// Permanently deletes the signed-in person's account and all their saved records.
export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.accountDelete);
  if (blocked) return blocked;
  try {
    const userId = await currentUserId();
    if (!userId) return Response.json({ error: "Please sign in to continue." }, { status: 401 });
    await endAllSessions(userId);
    await deleteAccount(userId);
    return Response.json({ deleted: true });
  } catch (err) {
    console.error("[account] delete:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Couldn't delete your account. Please try again." }, { status: 502 });
  }
}
