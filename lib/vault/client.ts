import { applyChanges, diffRecords, type RecordChange, type VaultData } from "@/lib/vault/records";

// Keeps this device and the account in step. Changes wait in an outbox saved on the device,
// so edits made offline or during a failed request are sent later rather than lost.

export const LOCAL_DATA_KEY = "finlio:v1";
export const LAST_USER_KEY = "finlio:last-user";
export const cacheKey = (userId: string) => `finlio:vault:${userId}`;
const outboxKey = (userId: string) => `finlio:outbox:${userId}`;
const cursorKey = (userId: string) => `finlio:cursor:${userId}`;

const BATCH = 100;
const SAVE_DELAY_MS = 800;
const RETRY_DELAY_MS = 30_000;

export type SyncState = "idle" | "saving" | "error";
type OutboxItem = RecordChange & { clientUpdatedAt: string };

export function readStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export function removeStored(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do if storage is blocked.
  }
}

// After a session ends without logging out, drop the cached copy unless it holds unsent edits.
export function dropCacheIfClean(userId: string) {
  if (Object.keys(readStored<Record<string, OutboxItem>>(outboxKey(userId)) ?? {}).length > 0) return;
  removeStored(cacheKey(userId));
  removeStored(cursorKey(userId));
}

const recordKey = (change: { kind: string; id: string }) => `${change.kind}:${change.id}`;

type Hooks = {
  getData: () => VaultData;
  apply: (data: VaultData) => void;
  onState: (state: SyncState) => void;
};

export class VaultSync {
  private outbox: Map<string, OutboxItem>;
  private cursor: number;
  private flushing: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    readonly userId: string,
    private hooks: Hooks,
  ) {
    this.outbox = new Map(Object.entries(readStored<Record<string, OutboxItem>>(outboxKey(userId)) ?? {}));
    this.cursor = readStored<number>(cursorKey(userId)) ?? 0;
  }

  get pending() {
    return this.outbox.size;
  }

  private saveOutbox() {
    writeStored(outboxKey(this.userId), Object.fromEntries(this.outbox));
  }

  private schedule(delay: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  // Queues everything that differs between two states.
  queue(prev: VaultData, next: VaultData) {
    const changes = diffRecords(prev, next);
    if (!changes.length) return;
    const now = new Date().toISOString();
    for (const change of changes) this.outbox.set(recordKey(change), { ...change, clientUpdatedAt: now });
    this.saveOutbox();
    this.hooks.onState("saving");
    this.schedule(SAVE_DELAY_MS);
  }

  // Sends everything waiting. True once nothing is left unsent.
  flush(): Promise<boolean> {
    if (this.flushing) return this.flushing;
    if (this.timer) clearTimeout(this.timer);
    this.flushing = this.sendAll().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async sendAll() {
    while (this.outbox.size > 0) {
      const batch = [...this.outbox.values()].slice(0, BATCH);
      try {
        const res = await fetch("/api/vault/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: batch }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        this.hooks.onState("error");
        this.schedule(RETRY_DELAY_MS);
        return false;
      }
      // An item edited again while this request ran stays queued with its newer time.
      for (const sent of batch) {
        const key = recordKey(sent);
        if (this.outbox.get(key)?.clientUpdatedAt === sent.clientUpdatedAt) this.outbox.delete(key);
      }
      this.saveOutbox();
    }
    this.hooks.onState("idle");
    return true;
  }

  // Fetches what changed elsewhere. Items with unsent local edits keep the local version.
  async pull() {
    let more = true;
    try {
      while (more) {
        const res = await fetch(`/api/vault/sync?since=${this.cursor}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { changes: RecordChange[]; cursor: number; more: boolean };
        const incoming = body.changes.filter((change) => !this.outbox.has(recordKey(change)));
        if (incoming.length) this.hooks.apply(applyChanges(this.hooks.getData(), incoming));
        this.cursor = body.cursor;
        writeStored(cursorKey(this.userId), this.cursor);
        more = body.more;
      }
      return true;
    } catch {
      this.hooks.onState("error");
      return false;
    }
  }

  // Removes this person's data from the device, including anything unsent.
  forget() {
    if (this.timer) clearTimeout(this.timer);
    this.outbox.clear();
    removeStored(outboxKey(this.userId));
    removeStored(cursorKey(this.userId));
    removeStored(cacheKey(this.userId));
    removeStored(LAST_USER_KEY);
  }
}
