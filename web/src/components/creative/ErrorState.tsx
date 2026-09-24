"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

/** SPEC §45 error state. Insufficient credits routes to /credits. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const insufficient = error instanceof ApiError && error.code === "insufficient-credits";
  const message = error instanceof Error ? error.message : "Please try again in a moment.";
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
      <span className={insufficient ? "size-12 rounded-full bg-warning/15 text-warning flex items-center justify-center" : "size-12 rounded-full bg-danger/15 text-danger flex items-center justify-center"}>
        {insufficient ? <Sparkles className="size-5" /> : <AlertTriangle className="size-5" />}
      </span>
      <div>
        <h3 className="text-lg font-semibold">{insufficient ? "Not enough credits" : "Something went wrong."}</h3>
        <p className="text-sm text-text2 mt-1 max-w-sm">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {insufficient ? (
          <Link href="/credits"><Button>Get credits</Button></Link>
        ) : (
          <Button onClick={onRetry}>Try Again</Button>
        )}
        <Link href="/studio"><Button variant="secondary">Back to Studio</Button></Link>
      </div>
    </div>
  );
}
