import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VaultSync } from "@/lib/vault/client";
import type { VaultData } from "@/lib/vault/records";

const item = (id: string, amount = 1) => ({ id, side: "asset" as const, kind: "gold" as const, name: id, amount });
const ok = (body: unknown = {}) => new Response(JSON.stringify(body), { status: 200 });

function setup(initial: VaultData = { holdings: [] }) {
  const state = { data: initial, states: [] as string[] };
  const make = () =>
    new VaultSync("u1", {
      getData: () => state.data,
      apply: (value) => {
        state.data = value;
      },
      onState: (s) => state.states.push(s),
    });
  return { state, make };
}

describe("VaultSync", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let store: Map<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new Map();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sends a queued change and empties the outbox", async () => {
    fetchMock.mockResolvedValue(ok());
    const { make, state } = setup();
    const sync = make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("a")] });
    expect(sync.pending).toBe(1);
    expect(await sync.flush()).toBe(true);
    expect(sync.pending).toBe(0);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body).changes[0];
    expect([sent.kind, sent.id]).toEqual(["asset", "a"]);
    expect(state.states.at(-1)).toBe("idle");
  });

  it("keeps changes through a failed request, and across a reload", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const { make, state } = setup();
    const sync = make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("a")] });
    expect(await sync.flush()).toBe(false);
    expect(sync.pending).toBe(1);
    expect(state.states.at(-1)).toBe("error");

    const reloaded = make();
    expect(reloaded.pending).toBe(1);
    fetchMock.mockResolvedValue(ok());
    expect(await reloaded.flush()).toBe(true);
    expect(reloaded.pending).toBe(0);
  });

  it("retries by itself after a failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(ok());
    const sync = setup().make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("a")] });
    await sync.flush();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(sync.pending).toBe(0);
  });

  it("treats a server error as unsent", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
    const sync = setup().make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("a")] });
    expect(await sync.flush()).toBe(false);
    expect(sync.pending).toBe(1);
  });

  it("keeps a newer edit made while a request is running", async () => {
    let finish!: (r: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve))).mockResolvedValue(ok());
    const sync = setup().make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("a", 1)] });
    const flushing = sync.flush();
    await vi.advanceTimersByTimeAsync(5);
    sync.queue({ holdings: [], assets: [item("a", 1)] }, { holdings: [], assets: [item("a", 2)] });
    finish(ok());
    await vi.advanceTimersByTimeAsync(0);
    expect(await flushing).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(JSON.parse(fetchMock.mock.calls[1][1].body).changes[0].json).amount).toBe(2);
  });

  it("pulls pages, remembers its place and keeps unsent local edits", async () => {
    const { make, state } = setup({ holdings: [], assets: [item("mine", 9)] });
    const sync = make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("mine", 9)] });
    fetchMock
      .mockResolvedValueOnce(ok({ changes: [{ kind: "asset", id: "mine", json: JSON.stringify(item("mine", 1)) }], cursor: 5, more: true }))
      .mockResolvedValueOnce(ok({ changes: [{ kind: "asset", id: "other", json: JSON.stringify(item("other", 3)) }], cursor: 9, more: false }));
    expect(await sync.pull()).toBe(true);
    expect(fetchMock.mock.calls[1][0]).toContain("since=5");
    expect(state.data.assets?.find((a) => a.id === "mine")?.amount).toBe(9);
    expect(state.data.assets?.find((a) => a.id === "other")?.amount).toBe(3);
    fetchMock.mockResolvedValueOnce(ok({ changes: [], cursor: 9, more: false }));
    await make().pull();
    expect(fetchMock.mock.calls[2][0]).toContain("since=9");
  });

  it("leaves data unchanged when a pull fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));
    const { make, state } = setup({ holdings: [], assets: [item("a")] });
    expect(await make().pull()).toBe(false);
    expect(state.data.assets).toHaveLength(1);
  });

  it("removes everything from the device on forget", () => {
    const sync = setup().make();
    sync.queue({ holdings: [] }, { holdings: [], assets: [item("a")] });
    store.set("finlio:vault:u1", "{}");
    store.set("finlio:cursor:u1", "5");
    store.set("finlio:last-user", '"u1"');
    store.set("finlio:other-user-data", "keep");
    sync.forget();
    expect([...store.keys()]).toEqual(["finlio:other-user-data"]);
    expect(sync.pending).toBe(0);
  });
});
