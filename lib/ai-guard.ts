// A safety net for Finlio AI. The AI's instructions already forbid recommendations, and this
// catches replies that break them anyway, so "explains, never advises" isn't left to the model
// alone. It looks for common phrasing, so it reduces the risk rather than removing it.

export const ADVICE_STOPPED_MESSAGE =
  "(Finlio stopped this answer because it started to sound like a recommendation. Finlio explains your numbers; it doesn't give investment advice.)";

const ACTIONS = "buy|buying|sell|selling|hold|holding|invest|investing|exit|exiting|book(?:ing)? profits?|switch|switching|trim|trimming|accumulate|accumulating|average down|reduce|reducing|increase|increasing|add to|adding to|move (?:your|money)|moving (?:your|money)";

const RECOMMENDATION_PATTERNS = [
  new RegExp(`\\byou\\s+(?:should|could|must|ought to|need to|might want to|may want to|might consider|may consider)\\s+(?:(?:also|really|probably|definitely)\\s+)?(?:consider\\s+)?(?:${ACTIONS})\\b`, "i"),
  new RegExp(`\\b(?:i|we)(?:'d| would| will)?\\s+(?:strongly\\s+)?(?:recommend|suggest|advise)\\b`, "i"),
  new RegExp(`\\b(?:i|we)\\s+think\\s+you\\s+should\\b`, "i"),
  new RegExp(`\\b(?:consider|try|start)\\s+(?:${ACTIONS})\\b`, "i"),
  new RegExp(`\\b(?:good|great|right|best|ideal|smart)\\s+(?:time|moment|idea|stocks?|funds?|shares?)\\s+to\\s+(?:${ACTIONS})\\b`, "i"),
  new RegExp(`\\b(?:best|top)\\s+(?:stocks?|funds?|shares?|investments?)\\s+(?:for you|to own)\\b`, "i"),
  new RegExp(`(?:^|[.!?]\\s*)(?:[Bb]uy|[Ss]ell|[Hh]old|[Ii]nvest in|[Ee]xit)\\s+(?:now|today|more|this|these|it|them|your|[A-Z]{2,})\\b`),
  new RegExp(`\\b(?:buy|sell)\\s+(?:now|today|immediately|right away)\\b`, "i"),
  // Hindi and Marathi
  /(?:खरीद|बेच|निवेश कर)(?:ना चाहिए|ें|िए|ो)|(?:खरेदी|गुंतवणूक) करा|विक(?:ा|ून टाका)/,
  // Tamil
  /(?:வாங்குங்கள்|விற்றுவிடுங்கள்|விற்பனை செய்யுங்கள்|முதலீடு செய்யுங்கள்)/,
  // Telugu
  /(?:కొనండి|అమ్మండి|పెట్టుబడి పెట్టండి)/,
  // Kannada
  /(?:ಖರೀದಿಸಿ|ಮಾರಾಟ ಮಾಡಿ|ಹೂಡಿಕೆ ಮಾಡಿ)/,
];

// Saying what Finlio won't do, or describing what someone already did, isn't advice.
const NOT_ADVICE = /\b(?:can't|cannot|can not|won't|will not|don't|do not|doesn't|does not|never|not able|rather than|instead of|whether|if you)\b/i;
// The same refusals in Hindi and Marathi ("नहीं", "नाही"), Tamil, Telugu and Kannada ("can't", "not").
const NOT_ADVICE_INDIC = /नहीं|नाही|முடியாது|இல்லை|లేను|కాదు|ಸಾಧ್ಯವಿಲ್ಲ|ಹೇಳಲಾರೆ|ಇಲ್ಲ/;

export function containsRecommendation(text: string) {
  const sentence = text.trim();
  if (!sentence || NOT_ADVICE.test(sentence) || NOT_ADVICE_INDIC.test(sentence)) return false;
  return RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(sentence));
}

// Checks a streamed reply one sentence at a time, so a recommendation is caught before it's shown.
export class SentenceGuard {
  private buffer = "";
  blocked = false;

  // Returns the text that is safe to show so far.
  push(chunk: string) {
    if (this.blocked) return "";
    this.buffer += chunk;
    let safe = "";
    for (;;) {
      const end = this.buffer.search(/[.!?।](?:\s+|$)(?=\S|$)|\n/);
      if (end < 0) break;
      const after = this.buffer.slice(end + 1);
      // A full stop at the very end may be mid-number, like "₹3." then "2 lakh": wait for more.
      if (after === "" && this.buffer[end] !== "\n") break;
      const stop = end + 1 + (after.match(/^\s*/)?.[0].length ?? 0);
      const sentence = this.buffer.slice(0, stop);
      if (containsRecommendation(sentence)) {
        this.blocked = true;
        this.buffer = "";
        return `${safe}${ADVICE_STOPPED_MESSAGE}`;
      }
      safe += sentence;
      this.buffer = this.buffer.slice(stop);
    }
    return safe;
  }

  // Returns whatever is left when the reply ends.
  finish() {
    if (this.blocked) return "";
    const rest = this.buffer;
    this.buffer = "";
    if (containsRecommendation(rest)) {
      this.blocked = true;
      return ADVICE_STOPPED_MESSAGE;
    }
    return rest;
  }
}
