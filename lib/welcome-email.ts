import "server-only";
import { MailNotConfiguredError, sendEmail } from "@/lib/mail";

export function welcomeMessage({ name, appUrl }: { name?: string; appUrl: string }) {
  const first = name?.trim().split(/\s+/)[0];
  return {
    subject: "Welcome to Finlio",
    text: [
      first ? `Hi ${first},` : "Hi,",
      "",
      "Your Finlio account is ready. To get started:",
      "",
      "1. Add your money in one place",
      "2. See what changed this month",
      "3. Understand why it moved",
      "",
      `Open Finlio: ${appUrl}/dashboard`,
      "",
      "Finlio uses your Google account only to sign you in and never reads your email.",
      "Finlio explains your money; it doesn't give financial advice.",
      "",
      "You're getting this because you just created a Finlio account.",
    ].join("\n"),
  };
}

// Never throws: a mail problem must not stop someone signing in.
export async function sendWelcomeEmail({ to, ...details }: { to: string; name?: string; appUrl: string }) {
  try {
    await sendEmail({ to, ...welcomeMessage(details) });
  } catch (err) {
    if (err instanceof MailNotConfiguredError) return;
    console.error("[mail] welcome:", err instanceof Error ? err.message : "unknown");
  }
}
