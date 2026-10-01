"use client";

import { useEffect } from "react";
import { currentAccount } from "@/app/(auth)/actions";
import { refreshAccount } from "@/lib/api";
import { loadState, saveState } from "@/lib/data/state";
import { pickSynced, SYNCED_KEYS, useStore, type StoreState } from "@/lib/store";

const SAVE_DELAY_MS = 1500;

/**
 * Keeps the local store in sync with the signed-in InsForge account:
 * balance and credit history from the server, the workspace document loaded once
 * (or created from this browser's data on first sign-in), then saved after each change.
 */
export function AuthSync() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void saveState(pickSynced(useStore.getState())), SAVE_DELAY_MS);
    };

    void (async () => {
      const account = await currentAccount();
      if (cancelled || !account) return;
      await refreshAccount();
      const { state } = await loadState();
      if (cancelled) return;

      const store = useStore.getState();
      store.applyRemoteState(account.id, state as Partial<StoreState> | null);
      // Name/email from the account unless the user set their own name in Settings.
      const { user } = useStore.getState();
      const name = user.name && user.name !== "Mon compte" ? user.name : account.name || account.email.split("@")[0];
      useStore.getState().updateUser({ id: account.id, email: account.email, name });
      if (!state) save(); // first sign-in: keep what this browser already had

      unsubscribe = useStore.subscribe((next, prev) => {
        if (SYNCED_KEYS.some((k) => next[k] !== prev[k])) save();
      });
    })();

    // Flush a pending save when the tab is hidden (phone switching apps, closing the tab).
    const flush = () => {
      if (document.visibilityState === "hidden" && timer) {
        clearTimeout(timer);
        void saveState(pickSynced(useStore.getState()));
      }
    };
    document.addEventListener("visibilitychange", flush);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe?.();
      document.removeEventListener("visibilitychange", flush);
    };
  }, []);
  return null;
}
