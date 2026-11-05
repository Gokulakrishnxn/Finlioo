import { compactMoney } from "@/lib/networth";
import { t } from "@/lib/i18n";

// Assets versus liabilities as one split bar.
export function WealthBar({ assets, loans }: { assets: number; loans: number }) {
  const total = assets + loans;
  const assetPct = total ? Math.round((assets / total) * 100) : 100;

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-sand">
        <span className="h-full bg-gain" style={{ width: `${assetPct}%` }} />
        <span className="h-full bg-loss" style={{ width: `${100 - assetPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold tracking-[0.06em] uppercase">
        <span className="text-success">
          {t("{pct}% assets", { pct: assetPct })} · <span className="nums">{compactMoney(assets)}</span>
        </span>
        <span className="text-loss">
          {t("{pct}% liabilities", { pct: 100 - assetPct })} · <span className="nums">{compactMoney(loans)}</span>
        </span>
      </div>
    </div>
  );
}
