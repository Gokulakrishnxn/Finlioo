import { z } from "zod";
import { API_LIMITS, guardAuthForm } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ password: z.string().min(8).max(72) });

// Sets a new password. The session comes from the emailed recovery link.
export async function POST(request: Request) {
  const blocked = guardAuthForm(request, API_LIMITS.reset);
  if (blocked) return blocked;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Use at least 8 characters." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) {
      return Response.json({ error: "This reset link has expired. Please request a new one." }, { status: 401 });
    }
    const { error } = await supabase.auth.updateUser({ password: body.data.password });
    if (!error) return Response.json({ updated: true });
    console.error("[auth] reset:", error.code ?? error.status);
    const message =
      error.code === "same_password"
        ? "Please choose a different password from your current one."
        : error.code === "weak_password"
          ? "Please choose a stronger password."
          : "Couldn't update your password. Please try again.";
    return Response.json({ error: message }, { status: 400 });
  } catch {
    return Response.json({ error: "Couldn't update your password. Please try again." }, { status: 502 });
  }
}
