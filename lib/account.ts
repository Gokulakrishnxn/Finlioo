// Keeps the name on the account in step with the profile, so new devices show it straight away.
export function saveAccountName(name: string) {
  void fetch("/api/account/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).catch(() => undefined);
}
