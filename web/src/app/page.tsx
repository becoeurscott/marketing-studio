"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useHydrated, useStore } from "@/lib/store";

export default function RootPage() {
  const hydrated = useHydrated();
  const done = useStore((s) => s.onboardingDone);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(done ? "/home" : "/onboarding");
  }, [hydrated, done, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg">
      <div className="flex items-center gap-2 text-text2 text-sm">
        <span className="size-7 rounded-md bg-gradient-to-br from-accent to-accent2 flex items-center justify-center animate-pulse">
          <Sparkles className="size-4 text-white" />
        </span>
        Loading your studio…
      </div>
    </div>
  );
}
