import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

export function SkeletonCard({ ratio = "aspect-[4/5]" }: { ratio?: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className={cn("w-full rounded-lg", ratio)} />
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 8, ratio }: { count?: number; ratio?: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} ratio={ratio} />)}
    </div>
  );
}
