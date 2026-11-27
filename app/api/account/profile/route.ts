import { z } from "zod";
import { API_LIMITS, guard } from "@/lib/api-guard";
import { currentUserId } from "@/lib/auth/session";
import { db } from "@/lib/gcp/firestore";

const Body = z.object({ name: z.string().trim().max(80) });

// Keeps the name on the account in step with the profile, so new devices show it straight away.
export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.accountProfile);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Please use a shorter name." }, { status: 400 });
  try {
    const userId = await currentUserId();
    if (!userId) return Response.json({ error: "Please sign in to continue." }, { status: 401 });
    await db().collection("users").doc(userId).set({ name: body.data.name || null }, { merge: true });
    return Response.json({ saved: true });
  } catch (err) {
    console.error("[account] profile:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Couldn't update your name." }, { status: 502 });
  }
}
