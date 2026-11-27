import { z } from "zod";
import { API_LIMITS, guardSignIn } from "@/lib/api-guard";
import { firebaseConfig } from "@/lib/auth/firebase-config";
import { verifyFirebaseIdToken } from "@/lib/auth/firebase-token";
import { authConfigured, startSession } from "@/lib/auth/session";
import { publicOrigin } from "@/lib/public-origin";
import { sendWelcomeEmail } from "@/lib/welcome-email";

const Body = z.object({ idToken: z.string().min(1).max(8000) });
const noStore = { "Cache-Control": "no-store" };

// Swaps a fresh Firebase sign-in for Finlio's own server-side session.
export async function POST(request: Request) {
  const blocked = guardSignIn(request, API_LIMITS.signIn);
  if (blocked) return blocked;
  const config = firebaseConfig();
  if (!config || !authConfigured()) {
    return Response.json({ error: "Sign-in isn't set up yet." }, { status: 503, headers: noStore });
  }
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Sign-in couldn't be read." }, { status: 400, headers: noStore });

  let profile;
  try {
    profile = await verifyFirebaseIdToken(body.data.idToken, config.projectId);
  } catch (err) {
    console.error("[auth] firebase token:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Couldn't verify your sign-in." }, { status: 401, headers: noStore });
  }
  try {
    const { isNew } = await startSession(profile);
    const appUrl = publicOrigin(new URL(request.url).origin);
    if (isNew && profile.email) await sendWelcomeEmail({ to: profile.email, name: profile.name, appUrl });
    return Response.json({ signedIn: true }, { headers: noStore });
  } catch (err) {
    console.error("[auth] firebase session:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Couldn't sign you in. Please try again." }, { status: 502, headers: noStore });
  }
}
