"use client";

import { useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

// Asks once per visit what to do with data this browser holds from before accounts.
// Nothing leaves the browser until the person chooses to move it.
export function MoveDataPrompt() {
  const { ready, signedIn, localItemsToMove, moveLocalData, discardLocalData } = useStore();
  const [later, setLater] = useState(false);
  const [moving, setMoving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !signedIn || later || localItemsToMove === 0) return null;

  async function move() {
    setMoving(true);
    setError(null);
    const sent = await moveLocalData();
    if (!sent) setError(t("Your data is safe in this browser, but it couldn't be saved to your account yet. Please try again."));
    setMoving(false);
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && setLater(true)}>
      <AlertDialogContent className="gap-5 p-6 [--dialog-width:460px]">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogMedia className="size-11 rounded-full bg-success-soft text-success">
            <CloudUpload className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-[18px] font-semibold tracking-tight">
            {t("Move your data to your account?")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] leading-relaxed">
            {t("This browser has {count} items saved from before you had an account. Moving them encrypts them, saves them to your account and removes them from this browser, so they follow you to any device you sign in on.", { count: localItemsToMove })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {confirmDiscard ? (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-[13px] leading-relaxed text-loss">
            {t("This permanently deletes those items from this browser. Finlio has no other copy, and this can't be undone.")}
          </p>
        ) : null}
        {error ? <p role="alert" className="text-[13px] text-loss">{error}</p> : null}
        <AlertDialogFooter className="flex-wrap">
          {confirmDiscard ? (
            <>
              <Button variant="outline" onClick={() => setConfirmDiscard(false)} className="h-10 rounded-xl px-4">
                {t("Go back")}
              </Button>
              <Button variant="destructive" onClick={discardLocalData} className="h-10 rounded-xl px-4">
                {t("Delete them")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setConfirmDiscard(true)} disabled={moving} className="h-10 rounded-xl px-4 text-loss">
                {t("Delete from this browser")}
              </Button>
              <Button variant="outline" onClick={() => setLater(true)} disabled={moving} className="h-10 rounded-xl px-4">
                {t("Not now")}
              </Button>
              <Button onClick={move} disabled={moving} className="h-10 rounded-xl px-4">
                {moving ? <Loader2 className="size-4 animate-spin" /> : null}
                {moving ? t("Moving…") : t("Move to my account")}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
