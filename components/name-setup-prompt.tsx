"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { saveAccountName } from "@/lib/account";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

// Asks a new account for a name the first time the app opens. Accounts that already have
// one, such as those from Google, never see this.
export function NameSetupPrompt() {
  const { ready, signedIn, account, profile, setProfile, localItemsToMove } = useStore();
  const id = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // The offer to move older data comes first, so two dialogs never stack.
  if (!ready || !signedIn || profile?.name?.trim() || profile?.namePromptSeen || localItemsToMove > 0) return null;

  function save(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("Enter your name."));
      return;
    }
    setProfile({ name: trimmed, namePromptSeen: true });
    saveAccountName(trimmed);
  }

  return (
    <AlertDialog open>
      <AlertDialogContent className="gap-5 p-6 [--dialog-width:420px]">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-[20px] font-semibold tracking-tight">
            {t("Welcome to Finlio. What should we call you?")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] leading-relaxed">
            {account?.email
              ? t("You're signed in as {email}. Your name appears in your greeting and profile.", { email: account.email })
              : t("Your name appears in your greeting and profile.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={save} noValidate className="flex flex-col gap-5">
          <div>
            <label htmlFor={`${id}-name`} className="mb-1.5 block text-[13px] font-medium text-ink">
              {t("Your name")}
            </label>
            <Input
              id={`${id}-name`}
              autoFocus
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              placeholder={t("Your name")}
              className="h-11 rounded-xl"
            />
            {error ? <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-loss">{error}</p> : null}
          </div>
          <AlertDialogFooter>
            <Button type="button" variant="ghost" onClick={() => setProfile({ namePromptSeen: true })} className="h-10 rounded-xl px-4">
              {t("Skip for now")}
            </Button>
            <Button type="submit" className="h-10 rounded-xl px-5">
              {t("Continue")}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
