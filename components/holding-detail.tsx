"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Change } from "@/components/change";
import { BrandLogo } from "@/components/brand-logo";
import { InitialBadge } from "@/components/initial-badge";
import { stockDomain } from "@/lib/brands";
import { formatDate, formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Position } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// One holding in a centred card: today's price and what you own.
export function HoldingDetail({
  position,
  onClose,
  onEdit,
}: {
  position?: Position;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const { removeHolding } = useStore();
  const [confirming, setConfirming] = useState(false);
  const h = position?.holding;

  return (
    <>
      <Dialog open={Boolean(h)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 rounded-2xl bg-card p-0 [--dialog-overflow:hidden] [--dialog-width:480px]"
        >
          {h && position && (
            <>
              <header className="flex items-center gap-3 px-6 pt-6 pb-5">
                <BrandLogo
                  domain={stockDomain(h.symbol)}
                  className="size-12"
                  fallback={<InitialBadge symbol={h.symbol} className="size-12 text-lg" />}
                />
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-[19px] font-semibold tracking-tight text-ink">{h.symbol}</DialogTitle>
                  <DialogDescription className="truncate text-[13px]">{h.name}</DialogDescription>
                </div>
                <button
                  onClick={onClose}
                  aria-label={t("Close")}
                  className="self-start rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sand hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                <div data-demo-hide={position.quote ? undefined : ""} className="rounded-xl bg-sand p-4">
                  <p className="eyebrow">{t("Price today")}</p>
                  {position.quote ? (
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="nums text-[28px] leading-none font-semibold tracking-tight text-ink">
                        {formatMoney(position.quote.price)}
                      </p>
                      <Change
                        amount={position.quote.price - position.quote.prevClose}
                        pct={position.dayChangePct}
                        className="text-[14px]"
                      />
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[14px] text-body">{t("Live price isn't available right now.")}</p>
                  )}
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label={t("Your shares")} value={String(h.quantity)} />
                  <Stat label={t("Average buy price")} value={formatMoney(h.buyPrice)} />
                  <Stat label={t("You put in")} value={formatMoney(position.invested)} />
                  <Stat label={t("Worth now")} value={position.value !== undefined ? formatMoney(position.value) : "—"} />
                  <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                    <dt className="text-[13px] text-muted-foreground">{t("Since {date}", { date: formatDate(h.buyDate) })}</dt>
                    <dd>
                      <Change amount={position.gain} pct={position.gainPct} className="text-[14px]" />
                    </dd>
                  </div>
                </dl>
              </div>

              <footer className="flex gap-2 border-t border-line bg-sand/50 px-6 py-4">
                <Button variant="outline" className="h-10 flex-1 rounded-xl bg-card" onClick={() => onEdit(h.id)}>
                  <Pencil className="size-4" />
                  {t("Edit")}
                </Button>
                <Button
                  variant="destructive"
                  className="h-10 flex-1 rounded-xl"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 className="size-4" />
                  {t("Delete")}
                </Button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete {name}?", { name: h?.symbol ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("Finlio will forget this holding. You can add it again any time.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Keep it")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (h) removeHolding(h.id);
                setConfirming(false);
                onClose();
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line px-4 py-3", className)}>
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="nums mt-1 text-[16px] text-ink">{value}</dd>
    </div>
  );
}
