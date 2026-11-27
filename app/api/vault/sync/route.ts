import { type NextRequest } from "next/server";
import { z } from "zod";
import { API_LIMITS, guard } from "@/lib/api-guard";
import { currentUserId } from "@/lib/auth/session";
import { count, MAX_RECORDS_PER_PERSON, PAGE, pull, push } from "@/lib/vault/store";
import { KEY_VERSION, open, seal, VaultNotConfiguredError } from "@/lib/vault/crypto";
import { VAULT_KINDS } from "@/lib/vault/records";

const noStore = { "Cache-Control": "no-store" };

const PushSchema = z.object({
  changes: z
    .array(
      z.object({
        kind: z.enum(VAULT_KINDS),
        id: z.string().min(1).max(200),
        json: z.string().max(280_000).nullable(),
        clientUpdatedAt: z.iso.datetime(),
      }),
    )
    .min(1)
    .max(200),
});

function failure(err: unknown, label: string) {
  if (err instanceof VaultNotConfiguredError) {
    console.error(`[vault] ${label}: master key missing`);
    return Response.json({ error: "Cloud storage isn't set up yet." }, { status: 503, headers: noStore });
  }
  console.error(`[vault] ${label}:`, err instanceof Error ? err.name : "unknown");
  return Response.json({ error: "Couldn't reach your saved data." }, { status: 502, headers: noStore });
}

// GET ?since=<rev> returns what changed after that point, decrypted for the signed-in person.
export async function GET(request: NextRequest) {
  const blocked = await guard(request, API_LIMITS.vaultPull);
  if (blocked) return blocked;
  const since = Number(request.nextUrl.searchParams.get("since") ?? 0);
  if (!Number.isSafeInteger(since) || since < 0) return Response.json({ error: "Bad cursor." }, { status: 400 });
  try {
    const userId = await currentUserId();
    if (!userId) return Response.json({ error: "Please sign in to continue." }, { status: 401, headers: noStore });
    const rows = await pull(userId, since);
    return Response.json(
      {
        changes: rows.map((row) => ({
          kind: row.kind,
          id: row.id,
          json: row.deleted || !row.ciphertext ? null : open(userId, row.kind, row.id, row.ciphertext),
        })),
        cursor: rows.at(-1)?.rev ?? since,
        more: rows.length === PAGE,
      },
      { headers: noStore },
    );
  } catch (err) {
    return failure(err, "pull");
  }
}

// POST saves a batch of changes for the signed-in person, sealed before they leave this server.
export async function POST(request: Request) {
  const blocked = await guard(request, API_LIMITS.vaultPush);
  if (blocked) return blocked;
  const body = PushSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Those changes couldn't be read." }, { status: 400, headers: noStore });
  try {
    const userId = await currentUserId();
    if (!userId) return Response.json({ error: "Please sign in to continue." }, { status: 401, headers: noStore });
    if ((await count(userId)) >= MAX_RECORDS_PER_PERSON) {
      return Response.json({ error: "You've reached the storage limit for this account." }, { status: 413, headers: noStore });
    }
    const now = Date.now();
    const records = body.data.changes.map(({ kind, id, json, clientUpdatedAt }) => ({
      kind,
      id,
      ciphertext: json === null ? null : seal(userId, kind, id, json),
      keyVersion: KEY_VERSION,
      // A device clock set ahead must not make its edits unbeatable.
      clientUpdatedAt: new Date(Math.min(Date.parse(clientUpdatedAt), now)),
    }));
    await push(userId, records);
    return Response.json({ saved: records.length }, { headers: noStore });
  } catch (err) {
    return failure(err, "push");
  }
}
