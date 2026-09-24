"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, className, id, ...rest }, ref) {
  const tid = id ?? rest.name;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={tid} className="text-[13px] font-medium text-text2">{label}</label>}
      <textarea
        ref={ref}
        id={tid}
        className={cn(
          "w-full min-h-24 bg-surface border border-border-strong rounded-md text-sm text-text placeholder:text-muted px-3 py-2.5 resize-y transition-colors focus:border-accent focus:outline-none disabled:opacity-50",
          error && "border-danger",
        )}
        {...rest}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
});
