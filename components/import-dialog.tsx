"use client";

import { useState } from "react";
import { Ellipsis, FileUp, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { InitialBadge } from "@/components/initial-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { todayLocal, formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Instrument } from "@/lib/types";
import { BROKER_DOMAINS } from "@/lib/brands";
import { BROKERS, parseHoldingsCsv, type CsvHolding } from "@/lib/broker-csv";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type Result = { added: string[]; merged: string[]; unmatched: string[] };

async function search(q: string): Promise<Instrument[]> {
  const res = await fetch(`/api/instruments?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return ((await res.json()) as { results: Instrument[] }).results;
}

// ISIN first (exact), then the NSE symbol, then the company name when it is a clear match.
async function findStock(row: CsvHolding): Promise<Instrument | undefined> {
  if (row.isin) {
    const hit = (await search(row.isin))[0];
    if (hit) return hit;
  }
  if (row.symbol) {
    const hit = (await search(row.symbol)).find((r) => r.symbol === row.symbol);
    if (hit) return hit;
  }
  if (row.name) {
    const results = await search(row.name);
    const wanted = row.name.toUpperCase();
    return results.find((r) => r.name.toUpperCase() === wanted || r.symbol === wanted) ?? (results.length === 1 ? results[0] : undefined);
  }
  return undefined;
}

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { holdings, addHolding, mergeHolding } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [brokerId, setBrokerId] = useState("zerodha");
  const broker = BROKERS.find((b) => b.id === brokerId) ?? BROKERS[0];

  async function importFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    const { rows, error } = parseHoldingsCsv(await file.text());
    if (error) {
      setError(error);
      setBusy(false);
      return;
    }
    const done: Result = { added: [], merged: [], unmatched: [] };
    for (const row of rows) {
      const match = await findStock(row);
      if (!match) {
        done.unmatched.push(row.symbol ?? row.name ?? row.isin ?? "?");
        continue;
      }
      const values = {
        instrumentKey: match.instrumentKey,
        symbol: match.symbol,
        name: match.name,
        buyDate: todayLocal(),
        buyPrice: row.avgCost,
        quantity: row.quantity,
        imported: true,
      };
      const existing = holdings.find((h) => h.instrumentKey === match.instrumentKey);
      if (existing) {
        mergeHolding(existing.id, values);
        done.merged.push(match.symbol);
      } else {
        addHolding(values);
        done.added.push(`${match.symbol} · ${row.quantity} @ ${formatMoney(row.avgCost)}`);
      }
    }
    setResult(done);
    setBusy(false);
  }

  function close(next: boolean) {
    if (!next) {
      setResult(null);
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto rounded-2xl p-6 sm:max-w-lg sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">{t("Import your holdings")}</DialogTitle>
          <DialogDescription>
            {t("Pick your broker, then choose its holdings file. The file is read here in your browser; only the stock symbols are looked up.")}
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div>
            <p className="eyebrow mb-2">{t("Your broker")}</p>
            <div role="radiogroup" aria-label={t("Your broker")} className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2">
              {BROKERS.map((b) => {
                const label = b.id === "other" ? t("Other broker") : b.name;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={b.id === brokerId}
                    aria-label={label}
                    title={label}
                    onClick={() => setBrokerId(b.id)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      b.id === brokerId ? "border-success bg-success-soft ring-1 ring-success" : "border-line hover:bg-sand",
                    )}
                  >
                    {b.id === "other" ? (
                      <Ellipsis className="size-5 text-muted-foreground" aria-hidden />
                    ) : (
                      <BrandLogo
                        domain={BROKER_DOMAINS[b.id]}
                        className="size-9 rounded-lg ring-0"
                        fallback={<InitialBadge symbol={b.name} className="size-9 rounded-lg text-[14px]" />}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 rounded-xl bg-sand/70 px-3.5 py-3 text-[13px] leading-relaxed text-body">
              {t(broker.steps, { broker: broker.name })}
            </p>
          </div>
        )}

        {!result && (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-sand/60 px-6 py-10 text-center transition-colors hover:bg-sand">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <FileUp className="size-5 text-muted-foreground" />
            )}
            <span className="text-[14px] font-medium text-ink">
              {busy ? t("Matching your stocks…") : t("Choose holdings CSV")}
            </span>
            <span className="text-[12px] text-muted-foreground">{t("Quantity and average cost are imported")}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={busy}
              onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
            />
          </label>
        )}

        {error && <p className="text-[13px] text-loss">{error}</p>}

        {result && (
          <div className="flex flex-col gap-3 text-[14px] text-body">
            <p className="font-medium text-ink">
              {t("Imported {count} of {total} holdings.", { count: result.added.length + result.merged.length, total: result.added.length + result.merged.length + result.unmatched.length })}
            </p>
            {result.added.length > 0 && <List title={t("Added")} items={result.added} />}
            {result.merged.length > 0 && <List title={t("Added to existing")} items={result.merged} />}
            {result.unmatched.length > 0 && (
              <List title={t("Not found on NSE (skipped)")} items={result.unmatched} />
            )}
            <Button onClick={() => close(false)} className="mt-2 h-11 rounded-xl">
              {t("Done")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed">{items.join(", ")}</p>
    </div>
  );
}
