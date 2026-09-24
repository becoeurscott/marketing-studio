"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "outline";
  active?: boolean;
}

const sizes = { sm: "size-8 rounded-sm [&>svg]:size-4", md: "size-9 rounded-md [&>svg]:size-[18px]", lg: "size-11 rounded-lg [&>svg]:size-5" };
const variants = {
  ghost: "text-text2 hover:text-text hover:bg-white/5",
  solid: "bg-elevated text-text hover:bg-[#232323]",
  outline: "border border-border-strong text-text2 hover:text-text hover:bg-white/5",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "ghost", active, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none",
        sizes[size],
        variants[variant],
        active && "bg-accent/15 text-highlight",
        className,
      )}
      {...rest}
    />
  );
});
