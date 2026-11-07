"use client";

// The sections of the Settings window (opened from the profile menu).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarRange, Download, EyeOff, ImageIcon, IndianRupee, Languages, LogOut, Mail, Monitor, Moon, PanelLeftClose, Rows3, ShieldCheck, Sun, Trash2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/form";
import { useSettings } from "@/components/settings/settings-dialog";
import { useTour } from "@/components/tour/tour";
import { useTheme } from "@/components/theme-root";
import { todayLocal } from "@/lib/format";
import { saveAccountName } from "@/lib/account";
import { useStore, type Account, type StoreData } from "@/lib/store";
import { PRESETS, type PresetId } from "@/lib/date-range";
import { LANGUAGES, setPreferences, usePreferences, type Language } from "@/lib/preferences";
import { COLLAPSE_KEY, logosOn, setLogosOn, SIDEBAR_EVENT } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type Session = { configured: boolean; gmail?: boolean; email?: string };

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h3 className="mb-4 border-b border-line pb-3 text-[15px] font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

export function ProfileCard({
  initial,
  account,
  onSave,
}: {
  initial?: StoreData["profile"];
  account: Account | null;
  onSave: (p: NonNullable<StoreData["profile"]>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [saved, setSaved] = useState(false);
  const email = account?.email;
  const initialLetter = ((name.trim() || email || "F")[0] ?? "F").toUpperCase();
  const signInMethod = account?.provider === "google" ? t("Signed in with Google") : t("Signed in with email and password");

  function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    onSave({ name: trimmed || undefined, city: city.trim() || undefined });
    if (account) saveAccountName(trimmed);
    setSaved(true);
  }

  return (
    <section>
      <div className="flex items-center gap-4 pr-8">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#7ee29a,#34c759_55%,#1f7a3a)] text-[26px] font-semibold text-[#102b18]"
        >
          {initialLetter}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[20px] font-semibold tracking-tight text-ink">{name.trim() || t("Add your name")}</h3>
          {email ? <p className="truncate text-[14px] text-muted-foreground">{email}</p> : null}
        </div>
      </div>

      {account ? (
        <div className="mt-6">
          <p className="eyebrow mb-2">{t("Account")}</p>
          <div className="rounded-xl border border-line bg-sand/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-line">
                <Mail className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-muted-foreground">{t("Email")}</p>
                <p className="text-[14px] font-medium [overflow-wrap:anywhere] text-ink">{email ?? t("Not available offline")}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 shrink-0 text-success" strokeWidth={1.75} aria-hidden />
                  {signInMethod}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={save} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <p className="eyebrow mb-3">{t("Personal details")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="profile-name" label={t("Name")}>
              <Input
                id="profile-name"
                value={name}
                maxLength={80}
                autoComplete="name"
                placeholder={t("Your name")}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field id="profile-city" label={t("City (optional)")}>
              <Input
                id="profile-city"
                value={city}
                placeholder={t("e.g. Chennai")}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSaved(false);
                }}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">{t("Your name personalises the greeting.")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" className="h-10 rounded-xl px-5">
            {t("Save profile")}
          </Button>
          {saved && <span role="status" className="text-[13px] text-success">{t("Saved")}</span>}
        </div>
      </form>
    </section>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-gain" : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0 size-5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function Preferences() {
  const { startTour } = useTour();
  const { closeSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [logos, setLogos] = useState(true);
  const prefs = usePreferences();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogos(logosOn());
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Storage blocked: show defaults.
    }
  }, []);

  return (
    <Card title={t("Preferences")}>
      <fieldset>
        <legend className="text-[14px] font-medium text-ink">{t("Appearance")}</legend>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("Choose a theme, or match your device.")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([
            { value: "light", label: t("Light"), icon: Sun },
            { value: "dark", label: t("Dark"), icon: Moon },
            { value: "system", label: t("System"), icon: Monitor },
          ] as const).map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-input bg-card px-2 py-3 text-[13px] font-medium text-body transition-colors hover:bg-muted has-checked:border-success has-checked:bg-success-soft has-checked:text-success has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="appearance"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
                className="sr-only"
              />
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <ul className="mt-5 divide-y divide-line border-t border-line pt-5">
        <Row
          icon={<Languages className="size-4" />}
          title={t("Language")}
          body={t("Choose the language for Finlio. Terms stay in English.")}
          control={
            <Select
              aria-label={t("Language")}
              value={prefs.language}
              onChange={(e) => setPreferences({ language: e.target.value as Language })}
              className="h-9 w-[9.5rem] rounded-lg text-[13px]"
            >
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </Select>
          }
        />
        <Row
          icon={<IndianRupee className="size-4" />}
          title={t("Number format")}
          body={prefs.numberFormat === "indian" ? t("Lakh and crore, like ₹12,50,000 and ₹12.50L.") : t("Thousand and million, like ₹1,250,000 and ₹1.25M.")}
          control={
            <Segmented
              label={t("Number format")}
              value={prefs.numberFormat}
              options={[
                { value: "indian", label: t("Lakh") },
                { value: "international", label: t("Million") },
              ]}
              onChange={(numberFormat) => setPreferences({ numberFormat })}
            />
          }
        />
        <Row
          icon={<EyeOff className="size-4" />}
          title={t("Hide amounts")}
          body={t("Replace every balance with dots, for when people can see your screen.")}
          control={
            <Toggle
              label={t("Hide amounts")}
              on={prefs.hideAmounts}
              onChange={(hideAmounts) => setPreferences({ hideAmounts })}
            />
          }
        />
        <Row
          icon={<Rows3 className="size-4" />}
          title={t("Compact tables")}
          body={t("Fit more rows on screen in lists and tables.")}
          control={
            <Toggle
              label={t("Compact tables")}
              on={prefs.density === "compact"}
              onChange={(on) => setPreferences({ density: on ? "compact" : "comfortable" })}
            />
          }
        />
        <Row
          icon={<CalendarRange className="size-4" />}
          title={t("Default date range")}
          body={t("The period Analytics, Transactions and Insights start on.")}
          control={
            <Select
              aria-label={t("Default date range")}
              value={prefs.defaultRange}
              onChange={(e) => setPreferences({ defaultRange: e.target.value as PresetId })}
              className="h-9 w-[9.5rem] rounded-lg text-[13px]"
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {t(preset.label)}
                </option>
              ))}
            </Select>
          }
        />
        <Row
          icon={<ImageIcon className="size-4" />}
          title={t("Show company logos")}
          body={t("Logos for your stocks, banks and merchants. Turn off before recording a public demo: logos are other companies' trademarks.")}
          control={
            <Toggle
              label={t("Show company logos")}
              on={logos}
              onChange={(on) => {
                setLogosOn(on);
                setLogos(on);
              }}
            />
          }
        />
        <Row
          icon={<PanelLeftClose className="size-4" />}
          title={t("Compact sidebar")}
          body={t("Show only icons in the sidebar. You can also use the button next to the logo.")}
          control={
            <Toggle
              label={t("Compact sidebar")}
              on={collapsed}
              onChange={(on) => {
                try {
                  window.localStorage.setItem(COLLAPSE_KEY, on ? "1" : "0");
                } catch {
                  // Storage blocked: the sidebar keeps its current state.
                }
                window.dispatchEvent(new Event(SIDEBAR_EVENT));
                setCollapsed(on);
              }}
            />
          }
        />
        <Row
          title={t("Keyboard")}
          body={t("Open or close Finlio chat from anywhere.")}
          control={<kbd className="rounded-md bg-sand px-2 py-1 text-[12px] text-body ring-1 ring-line">⌘ L</kbd>}
        />
        <Row
          title={t("Tour")}
          body={t("A quick five-step walk through the dashboard.")}
          control={
            <Button
              variant="outline"
              onClick={() => {
                closeSettings();
                startTour();
              }}
              className="h-8 rounded-lg px-3 text-[13px]"
            >
              {t("Replay tour")}
            </Button>
          }
        />
        <Row
          title={t("Terms & Conditions")}
          body={t("Finlio explains your money; it doesn't give financial advice.")}
          control={
            <Link href="/terms" target="_blank" className="text-[13px] font-medium whitespace-nowrap text-ink underline">
              {t("Read terms")}
            </Link>
          }
        />
      </ul>
    </Card>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-0.5 rounded-lg bg-sand p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] text-body transition-colors",
            value === option.value && "bg-card font-medium text-ink shadow-sm",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Row({
  icon,
  title,
  body,
  control,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  control: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
      {icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand text-ink">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        <p className="text-[13px] text-muted-foreground">{body}</p>
      </div>
      {control}
    </li>
  );
}

export function Accounts() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ configured: false }));
  }, []);

  // Stops Gmail reading.
  async function disconnectGmail() {
    await fetch("/api/auth/gmail", { method: "DELETE" });
    setSession((s) => (s ? { ...s, gmail: false } : s));
  }

  return (
    <Card title={t("Connected accounts")}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-sand">
          <Mail className="size-4 text-ink" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-ink">{t("Gmail, read-only")}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {!session ? t("Checking…") : session.gmail ? (session.email ?? t("Connected")) : session.configured ? t("Not connected") : t("Not available yet")}
          </p>
        </div>
        {session?.gmail ? (
          <Button variant="outline" onClick={disconnectGmail} className="h-9 rounded-xl">
            <LogOut className="size-4" />
            {t("Disconnect")}
          </Button>
        ) : (
          session?.configured && (
            <a
              href="/api/auth/google?gmail=1"
              className="inline-flex h-9 items-center rounded-xl px-3 text-[14px] font-medium text-ink ring-1 ring-line hover:bg-sand"
            >
              {t("Connect")}
            </a>
          )
        )}
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
        {t("Gmail is used only to read bank and UPI alerts for Transactions. Disconnecting removes Finlio's access in your Google account.")}
      </p>
    </Card>
  );
}

export function DataCard({
  data,
  onRestore,
  onErase,
}: {
  data: StoreData;
  onRestore: (data: StoreData) => void;
  onErase: () => void;
}) {
  const { closeSettings } = useSettings();
  const { signedIn, syncState, forgetAccountData } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteWord, setDeleteWord] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Deletes the account and everything saved in it, then leaves the app.
  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      forgetAccountData();
      // A full page load, so nothing from the deleted account stays in memory.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch {
      setDeleteError(t("Couldn't delete your account. Please try again."));
      setDeleting(false);
    }
  }

  // Erases this person's Finlio data and stops any Gmail access, so nothing
  // syncs back in. This can't be undone.
  function erase() {
    onErase();
    setConfirmingErase(false);
    closeSettings();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s: { gmail?: boolean }) => {
        if (s.gmail) return fetch("/api/auth/gmail", { method: "DELETE" });
      })
      .catch(() => undefined);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: "finlio", version: 1, data }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finlio-backup-${todayLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t("Backup downloaded."));
  }

  async function restore(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.app !== "finlio" || !Array.isArray(parsed?.data?.holdings)) {
        throw new Error("not a Finlio backup");
      }
      onRestore(parsed.data as StoreData);
      setMessage(t("Backup restored."));
    } catch {
      setMessage(t("That file isn't a Finlio backup."));
    }
  }

  return (
    <Card title={t("Your data")}>
      <p className="text-[14px] leading-relaxed text-body">
        {signedIn
          ? t("Your money data is encrypted and saved to your account, so it follows you to any device you sign in on. Download a copy any time.")
          : t("Everything lives in this browser. Download a backup to move Finlio to another browser or keep a copy.")}
      </p>
      {signedIn && syncState === "error" ? (
        <p role="alert" className="mt-2 text-[13px] text-loss">
          {t("Some recent changes haven't reached your account yet. Finlio will keep trying.")}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportData} className="h-10 rounded-xl">
          <Download className="size-4" />
          {t("Export backup")}
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="h-10 rounded-xl">
          <Upload className="size-4" />
          {t("Restore backup")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
        />
      </div>
      {message && <p className="mt-3 text-[13px] text-body">{message}</p>}
      <p className="mt-4 border-t border-line pt-4 text-[13px] text-muted-foreground">
        {t("Restoring replaces what's here now.")}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
        <div>
          <p className="text-[14px] font-medium text-ink">{t("Erase all data")}</p>
          <p className="text-[13px] text-muted-foreground">
            {signedIn ? t("Permanently removes your money data. Your account stays open.") : t("Permanently removes Finlio's data from this browser.")}
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setConfirmingErase(true)}
          className="h-9 rounded-xl"
        >
          <Trash2 className="size-4" />
          {t("Erase all data")}
        </Button>
      </div>

      <AlertDialog open={confirmingErase} onOpenChange={setConfirmingErase}>
        <AlertDialogContent className="gap-5 p-6 [--dialog-width:440px]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogMedia className="size-11 rounded-full bg-danger-soft text-loss">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-[18px] font-semibold tracking-tight">{t("Erase all data?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] leading-relaxed">
              {signedIn
                ? t("This erases your stocks, assets, loans, income, spending, history and profile from your account and this browser, and disconnects Gmail if it's connected. This can't be undone.")
                : t("This erases your stocks, assets, loans, income, spending, history and profile from this browser, and disconnects Gmail if it's connected. Finlio keeps no other copy, so this can't be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 rounded-xl bg-sand p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-ink">{t("Keep a copy first")}</p>
              <p className="text-[13px] text-muted-foreground">{t("Bring it back later with Restore backup.")}</p>
            </div>
            <Button variant="outline" onClick={exportData} className="h-9 shrink-0 rounded-xl bg-card">
              <Download className="size-4" />
              {t("Export backup")}
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-xl px-4">{t("Keep my data")}</AlertDialogCancel>
            <Button variant="destructive" onClick={erase} className="h-10 rounded-xl px-4">
              <Trash2 className="size-4" />
              {t("Erase everything")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {signedIn ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div>
            <p className="text-[14px] font-medium text-ink">{t("Delete my account")}</p>
            <p className="text-[13px] text-muted-foreground">{t("Permanently removes your account and everything saved in it.")}</p>
          </div>
          <Button variant="destructive" onClick={() => setConfirmingDelete(true)} className="h-9 rounded-xl">
            <Trash2 className="size-4" />
            {t("Delete my account")}
          </Button>
        </div>
      ) : null}

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={(open) => {
          setConfirmingDelete(open);
          if (!open) {
            setDeleteWord("");
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent className="gap-5 p-6 [--dialog-width:440px]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogMedia className="size-11 rounded-full bg-danger-soft text-loss">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-[18px] font-semibold tracking-tight">{t("Delete your account?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] leading-relaxed">
              {t("This permanently deletes your account and all your saved money data. Copies in Finlio's backups are removed as those backups expire. This can't be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button variant="outline" onClick={exportData} className="h-9 self-start rounded-xl">
            <Download className="size-4" />
            {t("Export backup")}
          </Button>
          <div>
            <label htmlFor="delete-account-word" className="mb-1.5 block text-[13px] font-medium text-ink">
              {t("Type DELETE to confirm")}
            </label>
            <input
              id="delete-account-word"
              value={deleteWord}
              onChange={(e) => setDeleteWord(e.target.value)}
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-line bg-card px-3 text-[14px] text-ink outline-none focus-visible:border-ring"
            />
          </div>
          {deleteError ? <p role="alert" className="text-[13px] text-loss">{deleteError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-xl px-4">{t("Keep my account")}</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteWord !== "DELETE" || deleting} onClick={deleteAccount} className="h-10 rounded-xl px-4">
              <Trash2 className="size-4" />
              {deleting ? t("Deleting…") : t("Delete my account")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
