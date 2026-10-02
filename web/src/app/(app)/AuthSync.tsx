"use client";

import { useEffect } from "react";
import { currentAccount } from "@/app/(auth)/actions";
import { refreshAccount } from "@/lib/api";
import { loadState, saveState } from "@/lib/data/state";
import { pickSynced, SYNCED_KEYS, useStore, type StoreState } from "@/lib/store";

const SAVE_DELAY_MS = 1500;
const RETRY_DELAY_MS = 5000;

/**
 * Keeps the local store in sync with the signed-in InsForge account:
 * balance and credit history from the server, the workspace document loaded once
 * (or created from this browser's data on first sign-in), then saved after each change.
 *
 * Local edits not yet confirmed by the server (`localChangedAt` newer than `syncedAt`)
 * win over an older saved document, so a project created just before a reload,
 * or while the account was still loading, is never overwritten.
 */
export function AuthSync() {
  useEffect(() => {
    let cancelled = false;
    let ready = false;
    let applying = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const push = async () => {
      clearTimeout(timer);
      const res = await saveState(pickSynced(useStore.getState()));
      if (cancelled) return;
      if (res.ok) {
        // Only mark synced if nothing changed while the save was in flight.
        const { localChangedAt } = useStore.getState();
        if (!localChangedAt || (res.updatedAt && localChangedAt <= res.updatedAt)) useStore.setState({ syncedAt: res.updatedAt ?? null });
      } else if (res.error !== "not-signed-in") {
        console.error("Sokozia: workspace save failed", res.error);
        if (res.error !== "too-large") timer = setTimeout(() => void push(), RETRY_DELAY_MS);
      }
    };
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void push(), SAVE_DELAY_MS);
    };

    // Track local edits from the start, including those made while the account loads.
    const unsubscribe = useStore.subscribe((next, prev) => {
      if (applying || !SYNCED_KEYS.some((k) => next[k] !== prev[k])) return;
      useStore.setState({ localChangedAt: new Date().toISOString() });
      if (ready) save();
    });

    void (async () => {
      const account = await currentAccount();
      if (cancelled || !account) return;
      await refreshAccount();
      const { state, updatedAt } = await loadState();
      if (cancelled) return;

      const local = useStore.getState();
      const sameOwner = !local.ownerId || local.ownerId === account.id;
      const unsaved = sameOwner && !!local.localChangedAt && (!local.syncedAt || local.localChangedAt > local.syncedAt);
      const remoteIsNewer = !!updatedAt && !!local.localChangedAt && updatedAt > local.localChangedAt;
      const keepLocal = !state || (unsaved && !remoteIsNewer);

      applying = true;
      local.applyRemoteState(account.id, keepLocal ? null : (state as Partial<StoreState>));
      if (!keepLocal) useStore.setState({ syncedAt: updatedAt, localChangedAt: updatedAt });
      // Name/email from the account unless the user set their own name in Settings.
      const { user } = useStore.getState();
      const name = user.name && user.name !== "Mon compte" ? user.name : account.name || account.email.split("@")[0];
      useStore.getState().updateUser({ id: account.id, email: account.email, name });
      applying = false;

      ready = true;
      if (keepLocal) void push(); // first sign-in, or edits this browser hadn't saved yet
    })();

    // Flush a pending save when the tab is hidden (phone switching apps, closing the tab).
    const flush = () => {
      if (document.visibilityState === "hidden" && timer && ready) void push();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  return null;
}
