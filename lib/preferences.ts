"use client";

import { useSyncExternalStore } from "react";
import type { PresetId } from "@/lib/date-range";

// How this browser likes Finlio to look and behave. Saved separately from money data,
// so erasing data keeps these choices.
export type NumberFormat = "indian" | "international";
export type Density = "comfortable" | "compact";
export type LandingPage = "/dashboard" | "/analytics" | "/transactions" | "/holdings";

export type Preferences = {
  numberFormat: NumberFormat;
  hideAmounts: boolean;
  density: Density;
  landing: LandingPage;
  defaultRange: PresetId;
};

export const LANDING_PAGES: { value: LandingPage; label: string }[] = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/analytics", label: "Analytics" },
  { value: "/transactions", label: "Transactions" },
  { value: "/holdings", label: "Holdings" },
];

export const DEFAULT_PREFERENCES: Preferences = {
  numberFormat: "indian",
  hideAmounts: false,
  density: "comfortable",
  landing: "/dashboard",
  defaultRange: "last-6",
};

const KEY = "finlio:preferences";
const listeners = new Set<() => void>();
let current: Preferences = DEFAULT_PREFERENCES;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    // Blocked or unreadable storage: use the defaults.
  }
  applyToDocument();
}

function applyToDocument() {
  document.documentElement.dataset.density = current.density;
}

// For code outside React, such as the money formatters.
export function getPreferences() {
  load();
  return current;
}

export function setPreferences(changes: Partial<Preferences>) {
  load();
  current = { ...current, ...changes };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Blocked storage: the choice lasts until reload.
  }
  applyToDocument();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePreferences() {
  return useSyncExternalStore(subscribe, getPreferences, () => DEFAULT_PREFERENCES);
}
