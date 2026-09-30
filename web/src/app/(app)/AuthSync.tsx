"use client";

import { useEffect } from "react";
import { currentAccount } from "@/app/(auth)/actions";
import { useStore } from "@/lib/store";

/** Copies the signed-in InsForge account (name, email) into the local store once per visit. */
export function AuthSync() {
  const updateUser = useStore((s) => s.updateUser);
  useEffect(() => {
    let cancelled = false;
    void currentAccount().then((u) => {
      if (cancelled || !u) return;
      const { user } = useStore.getState();
      // Keep a name the user edited in Settings; otherwise use the account name.
      const name = user.name && user.name !== "Mon compte" ? user.name : u.name || u.email.split("@")[0];
      updateUser({ id: u.id, email: u.email, name });
    });
    return () => { cancelled = true; };
  }, [updateUser]);
  return null;
}
