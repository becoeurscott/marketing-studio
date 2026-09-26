"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Rechercher…", className, autoFocus }: SearchBarProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 size-4 text-muted pointer-events-none" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 bg-surface border border-border-strong rounded-md pl-9 pr-8 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button aria-label="Effacer" onClick={() => onChange("")} className="absolute right-2 text-muted hover:text-text"><X className="size-4" /></button>
      )}
    </div>
  );
}
