import { cn } from "@/lib/utils";

export function Avatar({ src, name, size = 32, className }: { src?: string; name: string; size?: number; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full bg-elevated border border-border text-text2 font-medium overflow-hidden", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      title={name}
    >
      {src ? <img src={src} alt={name} width={size} height={size} className="size-full object-cover" /> : initials}
    </span>
  );
}
