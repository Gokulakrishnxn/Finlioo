// Reads a holdings export from any Indian broker. Brokers name their columns differently
// (Instrument, Symbol, Stock Name, ISIN; Qty, Quantity; Avg. cost, Average Price …) so the
// columns are found by name, not position. Only symbol/ISIN, quantity and average cost are used.

export type CsvHolding = { symbol?: string; isin?: string; name?: string; quantity: number; avgCost: number };

export type Broker = { id: string; name: string; steps: string };

const GENERIC = "Download your holdings report from the {broker} app or website (usually under Portfolio or Reports → Holdings). If it's an Excel file, open it and save it as CSV.";

export const BROKERS: Broker[] = [
  { id: "zerodha", name: "Zerodha", steps: "In Kite, open Holdings and choose Download (CSV)." },
  { id: "groww", name: "Groww", steps: GENERIC },
  { id: "upstox", name: "Upstox", steps: GENERIC },
  { id: "angelone", name: "Angel One", steps: GENERIC },
  { id: "icici", name: "ICICI Direct", steps: GENERIC },
  { id: "hdfc", name: "HDFC Securities", steps: GENERIC },
  { id: "kotak", name: "Kotak Securities", steps: GENERIC },
  { id: "5paisa", name: "5paisa", steps: GENERIC },
  { id: "dhan", name: "Dhan", steps: GENERIC },
  { id: "paytm", name: "Paytm Money", steps: GENERIC },
  { id: "motilal", name: "Motilal Oswal", steps: GENERIC },
  { id: "sharekhan", name: "Sharekhan", steps: GENERIC },
  { id: "iifl", name: "IIFL Securities", steps: GENERIC },
  { id: "axis", name: "Axis Direct", steps: GENERIC },
  { id: "sbi", name: "SBI Securities", steps: GENERIC },
  { id: "fyers", name: "Fyers", steps: GENERIC },
  { id: "other", name: "Other broker", steps: "Download your holdings report as a CSV file. It needs a stock symbol or ISIN, a quantity and an average buy price." },
];

function splitRow(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === delimiter && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

const toNumber = (s: string) => Number(s.replace(/[₹,\s]/g, ""));
const ISIN = /^IN[A-Z0-9]{10}$/;

function delimiterOf(line: string) {
  const counts: [string, number][] = [",", ";", "\t"].map((d) => [d, line.split(d).length]);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

export function parseHoldingsCsv(text: string): { rows: CsvHolding[]; error?: string } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  // Some exports start with a few title lines; find the real header.
  const headerAt = lines.findIndex(
    (l) => /instrument|symbol|scrip|stock|company|security|isin|name/i.test(l) && /qty|quantity|shares|units/i.test(l),
  );
  if (headerAt === -1) {
    return { rows: [], error: "This doesn't look like a holdings file. It needs a stock symbol (or ISIN) and a quantity column." };
  }
  const delimiter = delimiterOf(lines[headerAt]);
  const header = splitRow(lines[headerAt], delimiter).map((h) => h.toLowerCase());
  const find = (patterns: RegExp[], not?: RegExp) => {
    for (const re of patterns) {
      const i = header.findIndex((h) => re.test(h) && !(not && not.test(h)));
      if (i >= 0) return i;
    }
    return -1;
  };

  const symbolCol = find([/^(instrument|symbol|tradingsymbol|trading symbol|scrip symbol|ticker)$/]);
  const nameCol = find([/^(scrip|stock|company|security|instrument|symbol)?\s*name$/, /^(scrip|stock|company|security)$/]);
  const isinCol = find([/isin/]);
  const qtyCol = find([/quantity available/, /^(qty|quantity)\.?$/, /(net|total|free|holding)\s*(qty|quantity)/, /quantity|qty|shares|units/], /pledge|blocked|t1|collateral|sold|unsettled|discrepancy|value/);
  const avgCol = find(
    [/^avg\.?\s*(cost|price|buy|rate)?/, /average\s*(buy|cost|purchase|price|rate)/, /(buy|purchase|cost)\s*(avg|average|price|rate)/, /avg|average/],
    /value|amount|total|p&l|pnl|ltp|current/,
  );

  if ((symbolCol < 0 && isinCol < 0 && nameCol < 0) || qtyCol < 0 || avgCol < 0) {
    return { rows: [], error: "Couldn't find the stock, quantity and average buy price columns." };
  }

  const rows: CsvHolding[] = [];
  for (const line of lines.slice(headerAt + 1)) {
    const cells = splitRow(line, delimiter);
    const quantity = toNumber(cells[qtyCol] ?? "");
    const avgCost = toNumber(cells[avgCol] ?? "");
    if (!(quantity > 0 && avgCost > 0)) continue;
    const rawSymbol = (symbolCol >= 0 ? cells[symbolCol] : "")?.replace(/^(NSE|BSE)[:\-\s]+/i, "").replace(/-(BE|EQ|BZ|SM|ST)$/i, "").trim();
    const isin = [cells[isinCol], rawSymbol].map((c) => c?.toUpperCase()).find((c) => c && ISIN.test(c));
    const symbol = rawSymbol && !/\s/.test(rawSymbol) && !ISIN.test(rawSymbol.toUpperCase()) ? rawSymbol.toUpperCase() : undefined;
    const name = (nameCol >= 0 ? cells[nameCol] : undefined) || (rawSymbol && /\s/.test(rawSymbol) ? rawSymbol : undefined);
    if (symbol || isin || name) rows.push({ symbol, isin, name, quantity, avgCost });
  }
  return rows.length ? { rows } : { rows, error: "No holdings with a quantity and average cost were found." };
}
