"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Briefcase,
  CreditCard,
  Landmark,
  FileUp,
  Ellipsis,
  LogOut,
  Lightbulb,
  LayoutDashboard,
  PanelLeftClose,
  MessageCircle,
  Settings2,
  UserRound,
  ChartNoAxesCombined,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useQuickAdd } from "@/components/dashboard/quick-add";
import { useChatUI } from "@/components/chat/chat-context";
import { useSettings } from "@/components/settings/settings-dialog";
import { usePreferences } from "@/lib/preferences";
import { useStore } from "@/lib/store";
import { COLLAPSE_KEY, SIDEBAR_EVENT } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type NavItem = { href: string; label: string; icon: LucideIcon };

// One flat list, in the order people reach for them.
const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/holdings", label: "Holdings", icon: Briefcase },
      { href: "/assets", label: "Assets", icon: Landmark },
      { href: "/liabilities", label: "Liabilities", icon: CreditCard },
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
      { href: "/insights", label: "Insights", icon: Lightbulb },
    ],
  },
];

const ALL = SECTIONS.flatMap((s) => s.items);

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href);
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-1.5">
      <Image
        src="/finlio-mark.png"
        alt=""
        width={1024}
        height={1024}
        className="size-8 mix-blend-multiply dark:mix-blend-screen dark:invert"
        priority
      />
      <span className="text-xl font-semibold tracking-tight text-ink">Finlio</span>
    </Link>
  );
}



export function Sidebar() {
  usePreferences();
  const pathname = usePathname();
  const { profile } = useStore();
  const { openAdd, dialogs } = useQuickAdd();
  const { open: chatOpen } = useChatUI();
  const [preferCollapsed, setPreferCollapsed] = useState(false); // the saved choice
  const [expandedForChat, setExpandedForChat] = useState(false);

  // Finlio chat takes the right side, so the sidebar folds to icons while it's
  // open and returns when it closes. Opening the sidebar by hand overrides that
  // until the chat closes; the saved choice is never changed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!chatOpen) setExpandedForChat(false);
  }, [chatOpen]);
  const autoCollapsed = chatOpen && !expandedForChat;
  const collapsed = preferCollapsed || autoCollapsed;

  // Remember the choice per browser; Settings can change it too.
  useEffect(() => {
    const read = () => {
      try {
        setPreferCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
      } catch {
        // Storage blocked: start expanded.
      }
    };
    read();
    window.addEventListener(SIDEBAR_EVENT, read);
    return () => window.removeEventListener(SIDEBAR_EVENT, read);
  }, []);

  function toggle() {
    if (collapsed && !preferCollapsed) {
      // Folded only because the chat is open: open it for now without saving.
      setExpandedForChat(true);
      return;
    }
    if (!collapsed && chatOpen) {
      // Folding again while the chat is open just undoes the override.
      setExpandedForChat(false);
      return;
    }
    const next = !preferCollapsed;
    setPreferCollapsed(next);
    if (!next && chatOpen) setExpandedForChat(true);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // Storage blocked: the choice lasts until reload.
    }
  }

  return (
    <aside
      className={cn(
        "sticky top-2 hidden h-[calc(100vh-1rem)] shrink-0 flex-col rounded-3xl border border-line bg-card transition-[width] duration-300 md:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div className={cn("flex items-center pt-6 pb-5", collapsed ? "flex-col gap-3 px-2" : "justify-between px-5")}>
        {collapsed ? (
          <button
            onClick={toggle}
            aria-label={t("Open sidebar")}
            title={t("Open sidebar")}
            className="rounded-xl p-1.5 transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Image src="/finlio-mark.png" alt="" width={1024} height={1024} className="size-8 mix-blend-multiply dark:mix-blend-screen dark:invert" />
          </button>
        ) : (
          <Brand />
        )}
        {!collapsed && (
          <button
            onClick={toggle}
            aria-label={t("Close sidebar")}
            title={t("Close sidebar")}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sand hover:text-ink"
          >
            <PanelLeftClose className="size-[18px]" />
          </button>
        )}
      </div>

      <nav data-tour="nav" className={cn("flex flex-1 flex-col overflow-y-auto", collapsed ? "gap-3 px-3" : "gap-6 px-3")}>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            {section.title ? (
              collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-line" />
              ) : (
                <p className="eyebrow px-3 pb-2">{t(section.title)}</p>
              )
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? t(label) : undefined}
                      aria-label={collapsed ? t(label) : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl py-2 text-[14px] text-body transition-colors hover:bg-sand",
                        collapsed ? "justify-center px-0" : "px-3",
                        active && "bg-success-soft font-medium text-success hover:bg-success-soft dark:bg-muted dark:text-ink dark:hover:bg-muted",
                      )}
                    >
                      {active && !collapsed && (
                        <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-gain" />
                      )}
                      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                      {!collapsed && t(label)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-3">
        <ImportDataButton onClick={() => openAdd("import")} collapsed={collapsed} />
      </div>
      {dialogs}
      <ProfileChip name={profile?.name} city={profile?.city} collapsed={collapsed} />
    </aside>
  );
}

function ImportDataButton({ onClick, collapsed, className }: { onClick: () => void; collapsed?: boolean; className?: string }) {
  const label = t("Import data");
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl py-2 text-[14px] font-medium text-ink transition-colors hover:bg-sand",
        collapsed ? "justify-center px-0" : "bg-sand/70 px-3",
        className,
      )}
    >
      <FileUp className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && label}
    </button>
  );
}

function Avatar({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#7ee29a,#34c759_55%,#1f7a3a)] text-[13px] font-semibold text-[#102b18]",
        className,
      )}
    >
      {(name?.trim()[0] ?? "F").toUpperCase()}
    </span>
  );
}

// Saves anything unsent, ends the session and removes this account's data from the device.
function useLogout() {
  const { flushChanges, forgetAccountData } = useStore();
  return async () => {
    const saved = await flushChanges();
    if (!saved && !window.confirm(t("Some recent changes haven't been saved to your account and will be lost. Log out anyway?"))) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Offline: still leave the app.
    }
    forgetAccountData();
    // A full page load, so nothing from the signed-in session stays in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/sign-in");
  };
}

// Who's using Finlio. Opens a small menu card above it, like ChatGPT's account menu.
function ProfileChip({ name, city, collapsed }: { name?: string; city?: string; collapsed: boolean }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { openSettings } = useSettings();
  const { setOpen: setChatOpen } = useChatUI();
  const logout = useLogout();

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const item = "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[14px] text-body hover:bg-sand hover:text-ink";
  const pick = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <div ref={ref} className={cn("relative m-3", collapsed && "flex justify-center")}>
      {menu && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-[248px] rounded-2xl border border-line bg-card p-1.5 shadow-[0_12px_40px_-12px_rgba(18,18,18,0.25)] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar name={name} className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{name?.trim() || t("Finlio user")}</p>
              <p className="truncate text-[12px] text-muted-foreground">{city?.trim() || t("Profile and settings")}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" className={item} onClick={pick(() => openSettings("profile"))}>
            <UserRound className="size-4" strokeWidth={1.75} />
            {t("Profile")}
          </button>
          <button role="menuitem" className={item} onClick={pick(() => openSettings("general"))}>
            <Settings2 className="size-4" strokeWidth={1.75} />
            {t("Settings")}
          </button>
          <button role="menuitem" className={item} onClick={pick(() => setChatOpen(true))}>
            <MessageCircle className="size-4" strokeWidth={1.75} />
            <span className="flex-1">{t("Finlio chat")}</span>
            <kbd className="text-[11px] text-muted-foreground">⌘L</kbd>
          </button>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" className={item} onClick={pick(logout)}>
            <LogOut className="size-4" strokeWidth={1.75} />
            {t("Log out")}
          </button>
        </div>
      )}
      <button
        onClick={() => setMenu((m) => !m)}
        aria-haspopup="menu"
        data-tour="profile"
        aria-expanded={menu}
        title={collapsed ? t("Profile and settings") : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl text-left transition-colors hover:bg-sand",
          collapsed ? "w-auto p-1" : "px-2 py-2",
          menu && "bg-sand",
        )}
      >
        <Avatar name={name} />
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">{name?.trim() || t("Add your name")}</span>
            <span className="block text-[11px] text-muted-foreground">{t("Profile & settings")}</span>
          </span>
        )}
      </button>
    </div>
  );
}

// Phones: a slim top bar and a fixed bottom tab bar, like a native app. Home, Money,
// Ask, Holdings and More; everything else lives in the More sheet.
const TABS_LEFT: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Money", icon: ArrowLeftRight },
];
const TABS_RIGHT: NavItem[] = [{ href: "/holdings", label: "Holdings", icon: Briefcase }];
const MORE_ITEMS = ALL.filter((i) => ![...TABS_LEFT, ...TABS_RIGHT].some((tab) => tab.href === i.href));

export function MobileNav() {
  usePreferences();
  const pathname = usePathname();
  const { profile } = useStore();
  const { openSettings } = useSettings();
  const { setOpen: openChat } = useChatUI();
  const { openAdd, dialogs } = useQuickAdd();
  const logout = useLogout();
  const [more, setMore] = useState(false);
  const moreActive = MORE_ITEMS.some((i) => isActive(pathname, i.href));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMore(false);
  }, [pathname]);

  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [more]);

  const tab = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive(pathname, item.href) ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors active:bg-muted",
        isActive(pathname, item.href) && "text-success dark:text-ink",
      )}
    >
      <item.icon className="size-[22px]" strokeWidth={isActive(pathname, item.href) ? 2.1 : 1.6} />
      <span className="max-w-full truncate">{t(item.label)}</span>
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur md:hidden">
        <Brand />
        <button
          onClick={() => openSettings("general")}
          aria-label={t("Profile and settings")}
          data-tour="profile"
          className="rounded-full"
        >
          <Avatar name={profile?.name} className="size-8" />
        </button>
      </header>

      {more && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label={t("More")}>
          <button aria-label={t("Close")} onClick={() => setMore(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-card px-4 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" aria-hidden />
            <ul className="grid grid-cols-3 gap-2">
              {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border border-line px-2 py-3.5 text-[12px] font-medium text-ink transition-colors active:bg-muted",
                      isActive(pathname, href) && "border-success/40 bg-success-soft text-success dark:bg-muted dark:text-ink",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.7} />
                    {t(label)}
                  </Link>
                </li>
              ))}
            </ul>
            <ImportDataButton
              onClick={() => {
                setMore(false);
                openAdd("import");
              }}
              className="mt-3 w-full justify-center border border-line py-3"
            />
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-line py-3 text-[13px] font-medium text-body transition-colors active:bg-muted"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              {t("Log out")}
            </button>
          </div>
        </div>
      )}

      {dialogs}
      <nav
        data-tour="nav"
        aria-label={t("Main navigation")}
        className="fixed inset-x-0 bottom-0 z-50 flex items-end border-t border-line bg-card/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {TABS_LEFT.map(tab)}
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => {
              setMore(false);
              openChat(true);
            }}
            aria-label={t("Ask Finlio")}
            className="-mt-5 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-card transition-transform active:scale-95"
          >
            <MessageCircle className="size-5" />
          </button>
        </div>
        {TABS_RIGHT.map(tab)}
        <button
          onClick={() => setMore((v) => !v)}
          aria-expanded={more}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors active:bg-muted",
            (more || moreActive) && "text-success dark:text-ink",
          )}
        >
          <Ellipsis className="size-[22px]" strokeWidth={1.6} />
          {t("More")}
        </button>
      </nav>
    </>
  );
}
