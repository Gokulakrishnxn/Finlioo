"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { todayLocal } from "@/lib/format";
import { lotsOf, withLots } from "@/lib/portfolio";
import { sampleAssets, sampleEntries, sampleGoals, sampleHoldings, sampleSnapshots } from "@/lib/sample";
import type { Asset, Brief, Entry, ExpenseSnapshot, Goal, GoalContribution, Holding, Profile, Snapshot } from "@/lib/types";
import {
  cacheKey,
  dropCacheIfClean,
  LAST_USER_KEY,
  LOCAL_DATA_KEY,
  readStored,
  removeStored,
  VaultSync,
  writeStored,
  type SyncState,
} from "@/lib/vault/client";
import { countLocalItems, mergeLocalData } from "@/lib/vault/records";

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
  // Whether this device is working with a signed-in account, and how its saving is going.
  signedIn: boolean;
  syncState: SyncState;
  // Real items this browser holds from before accounts, waiting for the person's decision.
  localItemsToMove: number;
  moveLocalData: () => Promise<boolean>;
  discardLocalData: () => void;
  // Sends unsent changes now. True once nothing is left unsent.
  flushChanges: () => Promise<boolean>;
  // Removes this account's data from the device, for logout and account deletion.
  forgetAccountData: () => void;
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

function load(key: string): StoreData {
  const saved = readStored<StoreData>(key);
  return saved ? migrate({ ...saved, holdings: saved.holdings ?? [] }) : { holdings: [] };
}

// The signed-in person, or the last known one when offline.
async function findUserId(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const { userId } = (await res.json()) as { userId?: string | null };
    const last = readStored<string>(LAST_USER_KEY);
    if (userId) writeStored(LAST_USER_KEY, userId);
    else if (last) {
      // The session ended without a logout, so don't leave money data on this device.
      dropCacheIfClean(last);
      removeStored(LAST_USER_KEY);
    }
    return userId ?? null;
  } catch {
    return readStored<string>(LAST_USER_KEY);
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData>({ holdings: [] });
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [localItemsToMove, setLocalItemsToMove] = useState(0);
  const dataRef = useRef<StoreData>(data);
  const syncRef = useRef<VaultSync | null>(null);

  // Makes a state current here and in this device's copy.
  const commit = useCallback((value: StoreData) => {
    dataRef.current = value;
    setData(value);
    writeStored(syncRef.current ? cacheKey(syncRef.current.userId) : LOCAL_DATA_KEY, value);
  }, []);

  // localStorage and the session only exist in the browser, so load after mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const userId = await findUserId();
      if (cancelled) return;
      if (!userId) {
        const local = load(LOCAL_DATA_KEY);
        dataRef.current = local;
        setData(local);
        setReady(true);
        return;
      }
      const sync = new VaultSync(userId, {
        getData: () => dataRef.current,
        apply: (value) => commit(value as StoreData),
        onState: setSyncState,
      });
      syncRef.current = sync;
      setSignedIn(true);
      const cached = readStored<StoreData>(cacheKey(userId));
      if (cached) {
        const value = load(cacheKey(userId));
        dataRef.current = value;
        setData(value);
        setReady(true);
      }
      await sync.pull();
      if (cancelled) return;
      if (sync.pending > 0) void sync.flush();
      setLocalItemsToMove(countLocalItems(load(LOCAL_DATA_KEY)));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [commit]);

  // Picks up changes from other devices when this one comes back into view.
  useEffect(() => {
    if (!signedIn) return;
    const refresh = () => {
      if (document.visibilityState !== "visible" || !syncRef.current) return;
      void syncRef.current.flush().then(() => syncRef.current?.pull());
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [signedIn]);

  const update = useCallback(
    (next: (prev: StoreData) => StoreData) => {
      const prev = dataRef.current;
      const value = next(prev);
      if (value === prev) return;
      commit(value);
      syncRef.current?.queue(prev, value);
    },
    [commit],
  );

  const flushChanges = useCallback(() => syncRef.current?.flush() ?? Promise.resolve(true), []);

  const forgetAccountData = useCallback(() => {
    syncRef.current?.forget();
    syncRef.current = null;
    dataRef.current = { holdings: [] };
    setData({ holdings: [] });
    setSignedIn(false);
  }, []);

  // Moves a browser's data from before accounts into the account, then clears the old copy.
  const moveLocalData = useCallback(async () => {
    const local = load(LOCAL_DATA_KEY);
    update((account) => mergeLocalData(account, local) as StoreData);
    const sent = await flushChanges();
    if (sent) {
      removeStored(LOCAL_DATA_KEY);
      setLocalItemsToMove(0);
    }
    return sent;
  }, [update, flushChanges]);

  const discardLocalData = useCallback(() => {
    removeStored(LOCAL_DATA_KEY);
    setLocalItemsToMove(0);
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
        if (last && Math.abs(last.netWorth - snapshot.netWorth) < 0.5 && Boolean(last.sample) === Boolean(snapshot.sample)) return prev;
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

  // Erases everything, on this device and, when signed in, in the account.
  const clearAll = useCallback(() => {
    if (syncRef.current) {
      update(() => ({ holdings: [] }));
      void syncRef.current.flush();
      return;
    }
    removeStored(LOCAL_DATA_KEY);
    dataRef.current = { holdings: [] };
    setData({ holdings: [] });
  }, [update]);

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
        signedIn,
        syncState,
        localItemsToMove,
        moveLocalData,
        discardLocalData,
        flushChanges,
        forgetAccountData,
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
