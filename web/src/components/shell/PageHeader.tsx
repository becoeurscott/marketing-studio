import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard page heading block: title, optional description, right-aligned actions. */
export function PageHeader({ title, description, actions, className, eyebrow }: { title: string; description?: string; actions?: ReactNode; className?: string; eyebrow?: ReactNode }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="text-2xl md:text-[28px] font-bold tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-sm text-text2 mt-1 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Section({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-8", className)}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-[13px] text-text2 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
