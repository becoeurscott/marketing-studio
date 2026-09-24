"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useHydrated, useStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/Skeleton";

function BootScreen() {
  return (
    <div className="min-h-dvh bg-bg flex">
      <div className="hidden md:block w-[240px] border-r border-border bg-surface" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const onboardingDone = useStore((s) => s.onboardingDone);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !onboardingDone) router.replace("/onboarding");
  }, [hydrated, onboardingDone, router]);

  if (!hydrated || !onboardingDone) return <BootScreen />;
  return <AppShell>{children}</AppShell>;
}
