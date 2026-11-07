import { API_LIMITS, guard } from "@/lib/api-guard";
import { extractExpenses } from "@/lib/expense-extract";
import { readAlertEmails } from "@/lib/gmail";
import {
  activeSession,
  GoogleNotConfiguredError,
  NotSignedInError,
} from "@/lib/google-session";

export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.expenses);
  if (blocked) return blocked;
  try {
    const session = await activeSession();
    const emails = await readAlertEmails(session.accessToken);
    // Only these alerts' sender, subject and preview text go to Gemini.
    console.info(`[expenses] read ${emails.length} alert emails`);
    const expenses = await extractExpenses(emails);
    return Response.json({
      account: session.email,
      syncedAt: new Date().toISOString(),
      scanned: emails.length,
      expenses,
    });
  } catch (err) {
    console.error("[expenses]", err);
    if (err instanceof GoogleNotConfiguredError) {
      return Response.json({ error: "Google sign-in isn't set up yet." }, { status: 503 });
    }
    if (err instanceof NotSignedInError) {
      return Response.json({ error: "Please sign in with Google again." }, { status: 401 });
    }
    return Response.json({ error: "Couldn't read your bank alerts." }, { status: 502 });
  }
}
