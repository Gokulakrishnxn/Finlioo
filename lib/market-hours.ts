import { activeLocale } from "@/lib/locale";

// Is the NSE open right now? 09:15–15:30 IST, weekdays. Exchange holidays aren't modelled.
export function isMarketOpen(now = new Date()) {
  const { marketTimeZone, marketOpen, marketClose } = activeLocale();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: marketTimeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  if (get("weekday") === "Sat" || get("weekday") === "Sun") return false;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return minutes >= marketOpen[0] * 60 + marketOpen[1] && minutes <= marketClose[0] * 60 + marketClose[1];
}
