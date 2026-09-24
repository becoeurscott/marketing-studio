import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; onClick?: () => void; href?: string };
  secondary?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, cta, secondary, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center border border-dashed border-border-strong rounded-xl bg-surface/40", compact ? "py-10 px-4" : "py-16 px-6", className)}>
      <div className="size-12 rounded-xl bg-elevated border border-border flex items-center justify-center mb-4">
        <Icon className="size-5 text-highlight" />
      </div>
      <h3 className="text-[15px] font-semibold text-text">{title}</h3>
      {description && <p className="text-sm text-text2 mt-1 max-w-sm">{description}</p>}
      {(cta || secondary) && (
        <div className="mt-5 flex items-center gap-2">
          {cta && (cta.href ? (
            <a href={cta.href}><Button size="md">{cta.label}</Button></a>
          ) : (
            <Button size="md" onClick={cta.onClick}>{cta.label}</Button>
          ))}
          {secondary}
        </div>
      )}
    </div>
  );
}
