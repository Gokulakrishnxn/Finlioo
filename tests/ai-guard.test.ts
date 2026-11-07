import { describe, expect, it } from "vitest";
import { ADVICE_STOPPED_MESSAGE, containsRecommendation, SentenceGuard } from "@/lib/ai-guard";

describe("containsRecommendation", () => {
  it.each([
    "You should sell TCS now.",
    "You might want to consider buying more Reliance.",
    "I recommend moving your savings into gold.",
    "I'd suggest an index fund.",
    "We advise reducing your exposure.",
    "Consider selling your IT stocks.",
    "This is a good time to buy.",
    "These are the best stocks for you.",
    "Buy INFY today.",
    "Sell now.",
    "You could invest in a mutual fund.",
    "आपको TCS बेचना चाहिए।",
    "முதலீடு செய்யுங்கள்.",
    "కొనండి.",
    "ಹೂಡಿಕೆ ಮಾಡಿ.",
    "गुंतवणूक करा.",
  ])("catches: %s", (text) => expect(containsRecommendation(text)).toBe(true));

  it.each([
    "Finlio explains rather than advises, so I can't tell you whether to sell.",
    "I can't recommend a stock.",
    "You bought TCS at ₹3,500 and it is up 12%.",
    "Most of your money went to rent this month.",
    "Your best performer so far is Infosys.",
    "TCS fell 2% today after its results.",
    "You sold nothing this month.",
    "You saved ₹3.2 lakh this year.",
    "Holding period is shown on the Holdings page.",
    "",
  ])("allows: %s", (text) => expect(containsRecommendation(text)).toBe(false));
});

describe("SentenceGuard", () => {
  it("passes a normal reply through unchanged, across any chunking", () => {
    const reply = "You saved ₹3.2 lakh this year. Most went to rent!\n- TCS is up 2%.";
    const guard = new SentenceGuard();
    let out = "";
    for (const ch of reply) out += guard.push(ch);
    out += guard.finish();
    expect(out).toBe(reply);
    expect(guard.blocked).toBe(false);
  });

  it("doesn't split decimals", () => {
    const guard = new SentenceGuard();
    expect(guard.push("You have ₹3.")).toBe("");
    expect(guard.push("2 lakh. Next")).toBe("You have ₹3.2 lakh. ");
    expect(guard.finish()).toBe("Next");
  });

  it("stops at a recommendation and shows nothing after it", () => {
    const guard = new SentenceGuard();
    const first = guard.push("TCS fell today. You should sell it. It may fall further. ");
    expect(first).toBe(`TCS fell today. ${ADVICE_STOPPED_MESSAGE}`);
    expect(guard.blocked).toBe(true);
    expect(guard.push("More advice. ")).toBe("");
    expect(guard.finish()).toBe("");
  });

  it("catches a recommendation in a last sentence with no full stop", () => {
    const guard = new SentenceGuard();
    expect(guard.push("You should buy INFY")).toBe("");
    expect(guard.finish()).toBe(ADVICE_STOPPED_MESSAGE);
  });
});
