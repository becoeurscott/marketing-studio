import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
  elevated?: boolean;
}

export function Card({ padded = true, interactive, elevated, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border",
        elevated ? "bg-elevated" : "bg-card",
        padded && "p-4 md:p-5",
        interactive && "transition-colors hover:border-white/15 hover:bg-[#191919] cursor-pointer",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-3", className)}>
      <div>
        <h3 className="text-[15px] font-semibold text-text">{title}</h3>
        {subtitle && <p className="text-[13px] text-text2 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
