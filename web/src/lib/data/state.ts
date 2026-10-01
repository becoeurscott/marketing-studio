"use server";

import { adminClient } from "@/lib/insforge/admin";
import { getSessionUser } from "@/lib/insforge/server";

/** Keys of the client store saved to the account (credits, plan and history are server-owned). */
export type SyncedState = Record<string, unknown>;

const MAX_BYTES = 1_800_000;

/** The signed-in user's workspace document, or null if they have none yet. */
export async function loadState(): Promise<{ state: SyncedState | null; updatedAt: string | null }> {
  const user = await getSessionUser();
  if (!user) return { state: null, updatedAt: null };
  const { data } = await adminClient().database.from("ms_state").select("state, updated_at").eq("user_id", user.id).limit(1);
  const row = data?.[0] as { state: SyncedState; updated_at: string } | undefined;
  return { state: row?.state ?? null, updatedAt: row?.updated_at ?? null };
}

/** Saves the workspace document (last write wins). */
export async function saveState(state: SyncedState): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "not-signed-in" };
  const json = JSON.stringify(state);
  if (json.length > MAX_BYTES) return { ok: false, error: "too-large" };
  const { error } = await adminClient().database.from("ms_state")
    .upsert([{ user_id: user.id, state, updated_at: new Date().toISOString() }], { onConflict: "user_id" });
  return error ? { ok: false, error: error.message } : { ok: true };
}
