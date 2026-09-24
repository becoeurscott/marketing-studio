"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const inputBase =
  "w-full bg-surface border border-border-strong rounded-md text-sm text-text placeholder:text-muted px-3 h-10 transition-colors focus:border-accent focus:outline-none disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, leftIcon, rightSlot, className, id, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={inputId} className="text-[13px] font-medium text-text2">{label}</label>}
      <div className="relative flex items-center">
        {leftIcon && <span className="absolute left-3 text-muted [&>svg]:size-4">{leftIcon}</span>}
        <input ref={ref} id={inputId} className={cn(inputBase, leftIcon ? "pl-9" : null, rightSlot ? "pr-9" : null, error ? "border-danger" : null)} {...rest} />
        {rightSlot && <span className="absolute right-2">{rightSlot}</span>}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
});
