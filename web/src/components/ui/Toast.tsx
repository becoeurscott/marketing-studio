"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";
export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  action?: { label: string; onClick: () => void };
}
interface ToastItem extends ToastOptions { id: number }

interface ToastContextValue {
  toast: (opts: ToastOptions | string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <AlertCircle className="size-4 text-danger" />,
  info: <Info className="size-4 text-highlight" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((s) => s.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (opts: ToastOptions | string) => {
      const o: ToastOptions = typeof opts === "string" ? { title: opts } : opts;
      const id = ++counter.current;
      setItems((s) => [...s.slice(-3), { id, tone: "info", ...o }]);
      window.setTimeout(() => dismiss(id), o.duration ?? 3800);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, tone: "success" }),
      error: (title, description) => toast({ title, description, tone: "error" }),
      info: (title, description) => toast({ title, description, tone: "info" }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed z-[200] inset-x-0 bottom-20 md:bottom-6 md:right-6 md:inset-x-auto flex flex-col items-center md:items-end gap-2 px-4 md:px-0">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={cn("pointer-events-auto w-full md:w-[360px] bg-elevated border border-border-strong shadow-float rounded-lg p-3.5 flex items-start gap-3")}
            >
              <span className="mt-0.5 shrink-0">{icons[t.tone ?? "info"]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{t.title}</p>
                {t.description && <p className="text-[13px] text-text2 mt-0.5">{t.description}</p>}
                {t.action && (
                  <button className="mt-2 text-[13px] font-medium text-highlight hover:underline" onClick={() => { t.action?.onClick(); dismiss(t.id); }}>
                    {t.action.label}
                  </button>
                )}
              </div>
              <button aria-label="Fermer" className="text-muted hover:text-text" onClick={() => dismiss(t.id)}><X className="size-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
