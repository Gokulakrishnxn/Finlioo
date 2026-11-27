import "server-only";

// Sends email through the Gmail API from Finlio's own sender account. This is send-only
// (gmail.send scope): Finlio never reads anyone's inbox. One-time setup: authorise the sender
// account once and keep its refresh token in GMAIL_SENDER_REFRESH_TOKEN (docs/gcp-setup.md).

export class MailNotConfiguredError extends Error {}

const TIMEOUT_MS = 5000;

async function accessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_SENDER_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GMAIL_SENDER_REFRESH_TOKEN) {
    throw new MailNotConfiguredError("Email sending isn't set up yet.");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GMAIL_SENDER_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Sender token refresh failed: ${body.error}`);
  return body.access_token as string;
}

const header = (value: string) => value.replace(/[\r\n]+/g, " ");
const encodeSubject = (s: string) => `=?UTF-8?B?${Buffer.from(header(s)).toString("base64")}?=`;

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const from = process.env.MAIL_FROM ?? "";
  const raw = [
    ...(from ? [`From: ${header(from)}`] : []),
    `To: ${header(to)}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text).toString("base64"),
  ]
    .join("\r\n");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url") }),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${res.status}`);
}
