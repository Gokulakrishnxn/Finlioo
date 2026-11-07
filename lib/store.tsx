"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { todayLocal } from "@/lib/format";
import { lotsOf, withLots } from "@/lib/portfolio";
import { sampleAssets, sampleEntries, sampleGoals, sampleHoldings, sampleSnapshots } from "@/lib/sample";
import type { Asset, Brief, Entry, ExpenseSnapshot, Goal, GoalContribution, Holding, Profile, Snapshot } from "@/lib/types";

const STORAGE_KEY = "finlio:v1";

export type StoreData = {
  holdings: Holding[];
  brief?: Brief;
  expenses?: ExpenseSnapshot;
  assets?: Asset[];
  entries?: Entry[];
  snapshots?: Snapshot[];
  goals?: Goal[];
  profile?: Profile;
};

export type NewHolding = Omit<Holding, "id">;

type Store = StoreData & {
  ready: boolean;
  addHolding: (holding: NewHolding) => void;
  mergeHolding: (id: string, extra: NewHolding) => void;
  updateHolding: (id: string, changes: Partial<NewHolding>) => void;
  removeHolding: (id: string) => void;
  removeLot: (holdingId: string, lotId: string) => void;
  addSample: () => void;
  removeSample: () => void;
  setBrief: (brief: Brief) => void;
  setExpenses: (expenses: ExpenseSnapshot | undefined) => void;
  saveAsset: (asset: Omit<Asset, "id"> & { id?: string }) => void;
  removeAsset: (id: string) => void;
  addEntry: (entry: Omit<Entry, "id">) => void;
  removeEntry: (id: string) => void;
  recordSnapshot: (snapshot: Snapshot) => void;
  saveGoal: (goal: Omit<Goal, "id" | "contributions"> & { id?: string }) => void;
  removeGoal: (id: string) => void;
  addContribution: (goalId: string, contribution: Omit<GoalContribution, "id">) => void;
  removeContribution: (goalId: string, contributionId: string) => void;
  setProfile: (profile: Profile) => void;
  replaceAll: (data: StoreData) => void;
  clearAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

// The old free-text money goal becomes a real goal that only needs a target.
function migrate(data: StoreData): StoreData {
  const text = data.profile?.goal?.trim();
  if (!text) return data;
  const profile = { ...data.profile };
  delete profile.goal;
  const moved: Goal = {
    id: `goal-${Date.now()}`,
    name: text.slice(0, 60),
    category: "other",
    targetAmount: 0,
    savedAmount: 0,
    targetDate: "",
    contributions: [],
  };
  return { ...data, profile, goals: [...(data.goals ?? []), moved] };
}

function load(): StoreData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw) as StoreData);
  } catch {
    // Unreadable storage behaves like a fresh start.
  }
  return { holdings: [] };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData>({ holdings: [] });
  const [ready, setReady] = useState(false);

  // localStorage only exists in the browser, so load after mount.
  useEffect(() => {
    const loaded = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loaded);
    setReady(true);
  }, []);

  const update = useCallback((next: (prev: StoreData) => StoreData) => {
    setData((prev) => {
      const value = next(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Storage full or blocked: keep working in memory.
      }
      return value;
    });
  }, []);

  const addHolding = useCallback(
    (holding: NewHolding) =>
      update((prev) => ({
        ...prev,
        holdings: [
          ...prev.holdings,
          {
            ...holding,
            id: crypto.randomUUID(),
            lots: holding.lots ?? [
              { id: crypto.randomUUID(), date: holding.buyDate, price: holding.buyPrice, quantity: holding.quantity },
            ],
          },
        ],
      })),
    [update],
  );

  // Two buys of the same stock become one position: shares add up and the price
  // becomes the average paid, while each buy stays in the holding's history.
  const mergeHolding = useCallback(
    (id: string, extra: NewHolding) =>
      update((prev) => ({
        ...prev,
        holdings: prev.holdings.map((h) => {
          if (h.id !== id) return h;
          const lot = { id: crypto.randomUUID(), date: extra.buyDate, price: extra.buyPrice, quantity: extra.quantity };
          return { ...withLots(h, [...lotsOf(h), lot]), sample: h.sample && extra.sample };
        }),
      })),
    [update],
  );

  const updateHolding = useCallback(
    (id: string, changes: Partial<NewHolding>) =>
      update((prev) => ({
        ...prev,
        holdings: prev.holdings.map((h) => {
          if (h.id !== id) return h;
          const next = { ...h, ...changes };
          // Editing a single-buy holding edits that buy; the history stays in step.
          const touched = "buyDate" in changes || "buyPrice" in changes || "quantity" in changes;
          return touched && lotsOf(h).length === 1
            ? { ...next, lots: [{ ...lotsOf(h)[0], date: next.buyDate, price: next.buyPrice, quantity: next.quantity }] }
            : next;
        }),
      })),
    [update],
  );

  // Takes one buy out of a holding's history. The last buy removes the holding.
  const removeLot = useCallback(
    (holdingId: string, lotId: string) =>
      update((prev) => ({
        ...prev,
        holdings: prev.holdings.flatMap((h) => {
          if (h.id !== holdingId) return [h];
          const left = lotsOf(h).filter((l) => l.id !== lotId);
          return left.length ? [withLots(h, left)] : [];
        }),
      })),
    [update],
  );

  const removeHolding = useCallback(
    (id: string) =>
      update((prev) => ({ ...prev, holdings: prev.holdings.filter((h) => h.id !== id) })),
    [update],
  );

  // The whole sample household: stocks, assets, loans, three months of income and
  // spending, and net-worth history. Added once; everything is tagged `sample`.
  const addSample = useCallback(
    () =>
      update((prev) => {
        const id = () => crypto.randomUUID();
        const today = todayLocal();
        const owned = new Set(prev.holdings.map((h) => h.instrumentKey));
        const holdings = [
          ...prev.holdings,
          ...sampleHoldings().filter((s) => !owned.has(s.instrumentKey)).map((s) => ({ ...s, id: id() })),
        ];
        const hasSample = (list?: { sample?: boolean }[]) => list?.some((x) => x.sample) ?? false;
        const assets = hasSample(prev.assets)
          ? prev.assets!
          : [...(prev.assets ?? []), ...sampleAssets().map((a) => ({ ...a, id: id() }))];
        const entries = hasSample(prev.entries)
          ? prev.entries!
          : [...(prev.entries ?? []), ...sampleEntries(today).map((e) => ({ ...e, id: id() }))];
        // Scale the history to today's net worth (stocks at cost) so the chart ends where the card starts.
        const current =
          holdings.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0) +
          assets.reduce((sum, a) => sum + (a.side === "asset" ? a.amount : -a.amount), 0);
        const realDays = new Set((prev.snapshots ?? []).filter((s) => !s.sample).map((s) => s.date));
        const snapshots = hasSample(prev.snapshots)
          ? prev.snapshots!
          : [...(prev.snapshots ?? []), ...sampleSnapshots(today, current).filter((s) => !realDays.has(s.date))].sort(
              (a, b) => a.date.localeCompare(b.date),
            );
        const goals = hasSample(prev.goals)
          ? prev.goals!
          : [...(prev.goals ?? []), ...sampleGoals(today).map((g) => ({ ...g, id: id() }))];
        return { ...prev, holdings, assets, entries, snapshots, goals };
      }),
    [update],
  );

  // Removes every sample item and keeps everything the person added themselves.
  const saveGoal = useCallback<Store["saveGoal"]>(
    (goal) =>
      update((prev) => {
        const goals = prev.goals ?? [];
        if (!goal.id) return { ...prev, goals: [...goals, { ...goal, id: crypto.randomUUID(), contributions: [] }] };
        return { ...prev, goals: goals.map((g) => (g.id === goal.id ? { ...g, ...goal, id: g.id } : g)) };
      }),
    [update],
  );

  const removeGoal = useCallback(
    (goalId: string) => update((prev) => ({ ...prev, goals: (prev.goals ?? []).filter((g) => g.id !== goalId) })),
    [update],
  );

  const addContribution = useCallback<Store["addContribution"]>(
    (goalId, contribution) =>
      update((prev) => ({
        ...prev,
        goals: (prev.goals ?? []).map((g) =>
          g.id === goalId
            ? {
                ...g,
                savedAmount: g.savedAmount + contribution.amount,
                contributions: [...g.contributions, { ...contribution, id: crypto.randomUUID() }],
              }
            : g,
        ),
      })),
    [update],
  );

  const removeContribution = useCallback<Store["removeContribution"]>(
    (goalId, contributionId) =>
      update((prev) => ({
        ...prev,
        goals: (prev.goals ?? []).map((g) => {
          if (g.id !== goalId) return g;
          const removed = g.contributions.find((c) => c.id === contributionId);
          return {
            ...g,
            savedAmount: Math.max(g.savedAmount - (removed?.amount ?? 0), 0),
            contributions: g.contributions.filter((c) => c.id !== contributionId),
          };
        }),
      })),
    [update],
  );

  const removeSample = useCallback(
    () =>
      update((prev) => ({
        ...prev,
        holdings: prev.holdings.filter((h) => !h.sample),
        assets: prev.assets?.filter((a) => !a.sample),
        entries: prev.entries?.filter((e) => !e.sample),
        snapshots: prev.snapshots?.filter((s) => !s.sample),
        goals: prev.goals?.filter((g) => !g.sample),
      })),
    [update],
  );

  const setBrief = useCallback(
    (brief: Brief) => update((prev) => ({ ...prev, brief })),
    [update],
  );

  const setExpenses = useCallback(
    (expenses: ExpenseSnapshot | undefined) => update((prev) => ({ ...prev, expenses })),
    [update],
  );

  // Adds a new asset or loan, or replaces the one with the same id.
  const saveAsset = useCallback(
    (asset: Omit<Asset, "id"> & { id?: string }) =>
      update((prev) => {
        const assets = prev.assets ?? [];
        if (asset.id && assets.some((a) => a.id === asset.id)) {
          return { ...prev, assets: assets.map((a) => (a.id === asset.id ? (asset as Asset) : a)) };
        }
        return { ...prev, assets: [...assets, { ...asset, id: crypto.randomUUID() }] };
      }),
    [update],
  );

  const removeAsset = useCallback(
    (id: string) => update((prev) => ({ ...prev, assets: (prev.assets ?? []).filter((a) => a.id !== id) })),
    [update],
  );

  const addEntry = useCallback(
    (entry: Omit<Entry, "id">) =>
      update((prev) => ({
        ...prev,
        entries: [...(prev.entries ?? []), { ...entry, id: crypto.randomUUID() }],
      })),
    [update],
  );

  const removeEntry = useCallback(
    (id: string) =>
      update((prev) => ({ ...prev, entries: (prev.entries ?? []).filter((e) => e.id !== id) })),
    [update],
  );

  // One net-worth point per day; today's is overwritten as values change. Keeps a year.
  const recordSnapshot = useCallback(
    (snapshot: Snapshot) =>
      update((prev) => {
        const rest = (prev.snapshots ?? []).filter((s) => s.date !== snapshot.date);
        const last = prev.snapshots?.find((s) => s.date === snapshot.date);
        if (last && Math.abs(last.netWorth - snapshot.netWorth) < 0.5) return prev;
        return {
          ...prev,
          snapshots: [...rest, snapshot].sort((a, b) => a.date.localeCompare(b.date)).slice(-365),
        };
      }),
    [update],
  );

  // Merges into the saved profile.
  // so formats switch everywhere at once.
  const setProfile = useCallback(
    (profile: Profile) => {
      update((prev) => ({ ...prev, profile: { ...prev.profile, ...profile } }));
    },
    [update],
  );

  // Restores a backup made with Export.
  const replaceAll = useCallback(
    (next: StoreData) => {
      update(() => ({ ...next, holdings: next.holdings ?? [] }));
    },
    [update],
  );

  const clearAll = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setData({ holdings: [] });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ...data,
        ready,
        addHolding,
        mergeHolding,
        updateHolding,
        removeHolding,
        removeLot,
        addSample,
        removeSample,
        setBrief,
        setExpenses,
        saveAsset,
        removeAsset,
        addEntry,
        removeEntry,
        recordSnapshot,
        setProfile,
        replaceAll,
        saveGoal,
        removeGoal,
        addContribution,
        removeContribution,
        clearAll,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
