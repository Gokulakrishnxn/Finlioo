import { beforeEach, describe, expect, it, vi } from "vitest";

class MailNotConfiguredError extends Error {}
const sendEmail = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/mail", () => ({ sendEmail: (m: unknown) => sendEmail(m), MailNotConfiguredError }));

const { sendWelcomeEmail, welcomeMessage } = await import("@/lib/welcome-email");
const details = { to: "a@example.com", name: "Asha Rao", appUrl: "https://finlio.test" };

describe("welcome email", () => {
  beforeEach(() => {
    sendEmail.mockReset();
  });

  it("greets by first name and links to the dashboard", () => {
    const { text } = welcomeMessage(details);
    expect(text).toContain("Hi Asha,");
    expect(text).toContain("https://finlio.test/dashboard");
    expect(welcomeMessage({ appUrl: "x" }).text.startsWith("Hi,")).toBe(true);
  });

  it("sends to the new person", async () => {
    await sendWelcomeEmail(details);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com", subject: "Welcome to Finlio" }));
  });

  it("never throws, so sign-in carries on", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    for (const error of [new MailNotConfiguredError(), new Error("Gmail send failed: 500")]) {
      sendEmail.mockRejectedValueOnce(error);
      await expect(sendWelcomeEmail(details)).resolves.toBeUndefined();
    }
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
