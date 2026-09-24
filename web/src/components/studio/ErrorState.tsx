"use client";

import { AlertTriangle, Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface StudioErrorProps {
  /** Error message (from ApiError). */
  message?: string;
  /** Insufficient-credits variant links to /credits. */
  code?: "insufficient-credits" | "failed";
  onRetry?: () => void;
  backHref?: string;
  className?: string;
  compact?: boolean;
}

/** SPEC §45: "Something went wrong." with Try Again / Back to Studio; credits variant links to /credits. */
export function StudioError({ message, code = "failed", onRetry, backHref = "/studio", className, compact }: StudioErrorProps) {
  const credits = code === "insufficient-credits";
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-surface/40", credits ? "border-warning/40" : "border-danger/40", compact ? "py-8 px-4" : "py-14 px-6", className)}>
      <div className={cn("size-12 rounded-xl border flex items-center justify-center mb-4", credits ? "bg-warning/10 border-warning/30" : "bg-danger/10 border-danger/30")}>
        {credits ? <Coins className="size-5 text-warning" /> : <AlertTriangle className="size-5 text-danger" />}
      </div>
      <h3 className="text-[15px] font-semibold">{credits ? "Not enough credits" : "Something went wrong."}</h3>
      <p className="text-sm text-text2 mt-1 max-w-sm">{message ?? (credits ? "Top up to keep generating." : "The generation didn't complete. You weren't charged.")}</p>
      <div className="mt-5 flex items-center gap-2">
        {credits ? (
          <Link href="/credits"><Button size="md" leftIcon={<Coins className="size-4" />}>Get credits</Button></Link>
        ) : (
          onRetry && <Button size="md" onClick={onRetry}>Try Again</Button>
        )}
        <Link href={backHref}><Button size="md" variant="secondary">Back to Studio</Button></Link>
      </div>
    </div>
  );
}
