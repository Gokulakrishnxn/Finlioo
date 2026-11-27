// One-time setup: authorise the account Finlio sends mail from (send-only), save its refresh
// token to .env.local and send that account a test email. The token is never printed.
//   node --env-file=.env.local scripts/gmail-sender-token.mjs
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = process.env;
if (!clientId || !clientSecret) throw new Error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.");

const PORT = 8765;
const redirectUri = `http://localhost:${PORT}/oauth2callback`;
const state = randomBytes(16).toString("base64url");
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "openid email https://www.googleapis.com/auth/gmail.send",
  access_type: "offline",
  prompt: "consent select_account",
  state,
}).toString();

async function finish(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${tokens.error}`);
  if (!tokens.scope?.includes("gmail.send")) throw new Error('"Send email" wasn\'t ticked. Run again and allow it.');
  if (!tokens.refresh_token) throw new Error("Google sent no refresh token. Run again.");

  const file = ".env.local";
  const line = `GMAIL_SENDER_REFRESH_TOKEN=${tokens.refresh_token}`;
  const env = readFileSync(file, "utf8");
  const pattern = /^GMAIL_SENDER_REFRESH_TOKEN=.*$/m;
  writeFileSync(file, pattern.test(env) ? env.replace(pattern, () => line) : `${env}\n${line}\n`);
  console.log("Saved GMAIL_SENDER_REFRESH_TOKEN to .env.local");

  const { email } = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json());
  const raw = `To: ${email}\r\nSubject: Finlio email test\r\n\r\nFinlio can send email from this account.`;
  const sent = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokens.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url") }),
  });
  if (!sent.ok) throw new Error(`Test email failed (${sent.status}). Is the Gmail API enabled?`);
  console.log(`Test email sent to ${email}`);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== "/oauth2callback" || url.searchParams.get("state") !== state) {
    res.writeHead(404).end();
    return;
  }
  let message = "Done. You can close this tab and go back to the terminal.";
  try {
    const code = url.searchParams.get("code");
    if (!code) throw new Error("Access wasn't granted.");
    await finish(code);
  } catch (err) {
    message = err.message;
    console.error(message);
    process.exitCode = 1;
  }
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", Connection: "close" }).end(message);
  server.close();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Sign in with the account Finlio should send from:\n\n${authUrl}\n`);
  if (process.platform === "darwin") execFile("open", [authUrl.toString()]);
});
