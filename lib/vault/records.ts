import { lotsOf, withLots } from "@/lib/portfolio";
import type { Asset, Brief, Entry, ExpenseSnapshot, Goal, Holding, Profile, Snapshot } from "@/lib/types";

// How the app's data maps to stored records. One holding, entry, goal or day's snapshot is
// one record. Sample data is never turned into records, so it stays on the device.

export const VAULT_KINDS = ["holding", "asset", "entry", "goal", "snapshot", "profile", "brief", "expenses"] as const;
export type VaultKind = (typeof VAULT_KINDS)[number];

export type VaultData = {
  holdings: Holding[];
  brief?: Brief;
  expenses?: ExpenseSnapshot;
  assets?: Asset[];
  entries?: Entry[];
  snapshots?: Snapshot[];
  goals?: Goal[];
  profile?: Profile;
};

export type RecordChange = { kind: VaultKind; id: string; json: string | null };

const SINGLE_ID = "current";

export function toRecords(data: VaultData) {
  const records = new Map<string, RecordChange>();
  const add = (kind: VaultKind, id: string, value: unknown) =>
    records.set(`${kind}:${id}`, { kind, id, json: JSON.stringify(value) });
  for (const h of data.holdings) if (!h.sample) add("holding", h.id, h);
  for (const a of data.assets ?? []) if (!a.sample) add("asset", a.id, a);
  for (const e of data.entries ?? []) if (!e.sample) add("entry", e.id, e);
  for (const g of data.goals ?? []) if (!g.sample) add("goal", g.id, g);
  for (const s of data.snapshots ?? []) if (!s.sample) add("snapshot", s.date, s);
  if (data.profile) add("profile", SINGLE_ID, data.profile);
  if (data.brief) add("brief", SINGLE_ID, data.brief);
  if (data.expenses) add("expenses", SINGLE_ID, data.expenses);
  return records;
}

// What has to be saved to go from one state to the next.
export function diffRecords(prev: VaultData, next: VaultData): RecordChange[] {
  const before = toRecords(prev);
  const after = toRecords(next);
  const changes: RecordChange[] = [];
  for (const [key, record] of after) if (before.get(key)?.json !== record.json) changes.push(record);
  for (const [key, record] of before) if (!after.has(key)) changes.push({ kind: record.kind, id: record.id, json: null });
  return changes;
}

function upsert<T>(list: T[] | undefined, value: T, sameId: (item: T) => boolean) {
  const items = list ?? [];
  return items.some(sameId) ? items.map((item) => (sameId(item) ? value : item)) : [...items, value];
}

// Applies records from the server. Sample items on this device are left alone.
export function applyChanges(data: VaultData, changes: RecordChange[]): VaultData {
  let next: VaultData = { ...data };
  for (const { kind, id, json } of changes) {
    const value = json === null ? null : JSON.parse(json);
    switch (kind) {
      case "holding":
        next.holdings = value ? upsert(next.holdings, value as Holding, (x) => x.id === id) : next.holdings.filter((x) => x.id !== id);
        break;
      case "asset":
        next.assets = value ? upsert(next.assets, value as Asset, (x) => x.id === id) : next.assets?.filter((x) => x.id !== id);
        break;
      case "entry":
        next.entries = value ? upsert(next.entries, value as Entry, (x) => x.id === id) : next.entries?.filter((x) => x.id !== id);
        break;
      case "goal":
        next.goals = value ? upsert(next.goals, value as Goal, (x) => x.id === id) : next.goals?.filter((x) => x.id !== id);
        break;
      case "snapshot":
        next.snapshots = (value
          ? upsert(next.snapshots, value as Snapshot, (x) => x.date === id)
          : next.snapshots?.filter((x) => x.date !== id)
        )?.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "profile":
        next = { ...next, profile: value ?? undefined };
        break;
      case "brief":
        next = { ...next, brief: value ?? undefined };
        break;
      case "expenses":
        next = { ...next, expenses: value ?? undefined };
        break;
    }
  }
  return next;
}

// How many real items a browser's older local data holds.
export function countLocalItems(data: VaultData) {
  const real = (list?: { sample?: boolean }[]) => (list ?? []).filter((x) => !x.sample).length;
  return real(data.holdings) + real(data.assets) + real(data.entries) + real(data.goals);
}

// Adds a browser's older local data to the account. A stock held in both becomes one
// position with every buy, and the account's existing profile and days are kept.
export function mergeLocalData(account: VaultData, local: VaultData): VaultData {
  const merged: VaultData = { ...account, holdings: [...account.holdings] };
  for (const holding of local.holdings ?? []) {
    if (holding.sample) continue;
    const same = merged.holdings.findIndex((h) => h.instrumentKey === holding.instrumentKey && !h.sample);
    if (same < 0) merged.holdings.push(holding);
    else if (merged.holdings[same].id !== holding.id) {
      const existing = merged.holdings[same];
      merged.holdings[same] = withLots(existing, [...lotsOf(existing), ...lotsOf(holding)]);
    }
  }
  const addNew = <T extends { id: string; sample?: boolean }>(mine: T[] | undefined, theirs: T[] | undefined) => {
    const ids = new Set((mine ?? []).map((x) => x.id));
    return [...(mine ?? []), ...(theirs ?? []).filter((x) => !x.sample && !ids.has(x.id))];
  };
  merged.assets = addNew(account.assets, local.assets);
  merged.entries = addNew(account.entries, local.entries);
  merged.goals = addNew(account.goals, local.goals);
  const days = new Set((account.snapshots ?? []).map((s) => s.date));
  merged.snapshots = [...(account.snapshots ?? []), ...(local.snapshots ?? []).filter((s) => !s.sample && !days.has(s.date))].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  merged.profile = account.profile ?? local.profile;
  merged.expenses = account.expenses ?? local.expenses;
  merged.brief = account.brief ?? local.brief;
  return merged;
}
