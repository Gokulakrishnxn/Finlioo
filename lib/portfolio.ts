import type { Holding, Lot } from "@/lib/types";

// Every buy of a holding, oldest first. Holdings saved before buy history existed
// count as a single buy on their saved date and price.
export function lotsOf(holding: Holding): Lot[] {
  const lots = holding.lots?.length
    ? holding.lots
    : [{ id: holding.id, date: holding.buyDate, price: holding.buyPrice, quantity: holding.quantity }];
  return [...lots].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
}

// A holding rebuilt from its buys: total shares, average price paid, first buy date.
export function withLots(holding: Holding, lots: Lot[]): Holding {
  const quantity = lots.reduce((s, l) => s + l.quantity, 0);
  const cost = lots.reduce((s, l) => s + l.quantity * l.price, 0);
  const first = lots.reduce((d, l) => (l.date < d ? l.date : d), lots[0]?.date ?? holding.buyDate);
  return {
    ...holding,
    lots,
    quantity,
    buyPrice: quantity ? Math.round((cost / quantity) * 100) / 100 : holding.buyPrice,
    buyDate: first,
  };
}

export type Quote = { price: number; prevClose: number; timestamp?: string };

export type Position = {
  holding: Holding;
  quote?: Quote;
  invested: number;
  value?: number;
  gain?: number;
  gainPct?: number;
  dayChange?: number;
  dayChangePct?: number;
};

export function position(holding: Holding, quote?: Quote): Position {
  // Sum the real buys: quantity × the rounded average price would drift by a few rupees.
  const invested = lotsOf(holding).reduce((s, l) => s + l.quantity * l.price, 0);
  if (!quote) return { holding, invested };
  const value = holding.quantity * quote.price;
  const dayChange = holding.quantity * (quote.price - quote.prevClose);
  return {
    holding,
    quote,
    invested,
    value,
    gain: value - invested,
    gainPct: invested ? ((value - invested) / invested) * 100 : 0,
    dayChange,
    dayChangePct: quote.prevClose ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0,
  };
}

export function totals(positions: Position[]) {
  const priced = positions.filter((p) => p.value !== undefined);
  const invested = positions.reduce((s, p) => s + p.invested, 0);
  if (priced.length !== positions.length || positions.length === 0) {
    return { invested, complete: false as const };
  }
  const value = priced.reduce((s, p) => s + p.value!, 0);
  const dayChange = priced.reduce((s, p) => s + p.dayChange!, 0);
  const prevValue = value - dayChange;
  return {
    invested,
    complete: true as const,
    value,
    gain: value - invested,
    gainPct: invested ? ((value - invested) / invested) * 100 : 0,
    dayChange,
    dayChangePct: prevValue ? (dayChange / prevValue) * 100 : 0,
  };
}
