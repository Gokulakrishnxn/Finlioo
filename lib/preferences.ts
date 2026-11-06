"use client";

import { useSyncExternalStore } from "react";
import type { PresetId } from "@/lib/date-range";

// How this browser likes Finlio to look and behave. Saved separately from money data,
// so erasing data keeps these choices.
export type NumberFormat = "indian" | "international";
export type Density = "comfortable" | "compact";
export type Language = "en" | "hi" | "ta" | "te" | "kn" | "mr";

export type Preferences = {
  language: Language;
  numberFormat: NumberFormat;
  hideAmounts: boolean;
  density: Density;
  defaultRange: PresetId;
};

export const LANGUAGES: { value: Language; label: string; tag: string }[] = [
  { value: "en", label: "English", tag: "en-IN" },
  { value: "hi", label: "हिन्दी (Hindi)", tag: "hi-IN" },
  { value: "ta", label: "தமிழ் (Tamil)", tag: "ta-IN" },
  { value: "te", label: "తెలుగు (Telugu)", tag: "te-IN" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)", tag: "kn-IN" },
  { value: "mr", label: "मराठी (Marathi)", tag: "mr-IN" },
];

export const DEFAULT_PREFERENCES: Preferences = {
  language: "en",
  numberFormat: "indian",
  hideAmounts: false,
  density: "comfortable",
  defaultRange: "last-6",
};

const KEY = "finlio:preferences";
const listeners = new Set<() => void>();
let current: Preferences = DEFAULT_PREFERENCES;
let loaded = false;
// English until the page has loaded, so the first render matches the server's.
let languageApplied = false;

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
  if (languageApplied) document.documentElement.lang = current.language;
}

export function applySavedLanguage() {
  load();
  languageApplied = true;
  current = { ...current };
  applyToDocument();
  listeners.forEach((listener) => listener());
}

export const languageReady = () => languageApplied;
export const currentLanguage = (): Language => (languageApplied ? getPreferences().language : "en");

// The Intl locale for dates and month names, always with Western digits so numbers read the same everywhere.
export function uiLocale() {
  const tag = LANGUAGES.find((l) => l.value === currentLanguage())?.tag ?? "en-IN";
  return `${tag}-u-nu-latn`;
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
