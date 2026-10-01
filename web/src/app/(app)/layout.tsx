"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useHydrated } from "@/lib/store";
import { AuthSync } from "./AuthSync";
import { Skeleton } from "@/components/ui/Skeleton";

function BootScreen() {
  return (
    <div className="min-h-dvh bg-bg flex">
      <div className="hidden md:block w-[240px] border-r border-border bg-surface" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-80" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    </div>
  );
}

/**
 * Signed-in area (the proxy redirects visitors to /connexion). Onboarding runs right after sign-up,
 * so a returning user on a new device goes straight to the app instead of being sent back to it.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  if (!hydrated) return <BootScreen />;
  return (
    <AppShell>
      <AuthSync />
      {children}
    </AppShell>
  );
}
