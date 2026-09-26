"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "right" | "left";
  width?: number;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, children, side = "right", width = 400, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  const x = side === "right" ? "100%" : "-100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className={cn("absolute top-0 bottom-0 bg-card border-border-strong shadow-float flex flex-col w-full", side === "right" ? "right-0 border-l" : "left-0 border-r")}
            style={{ maxWidth: width }}
            initial={{ x }}
            animate={{ x: 0 }}
            exit={{ x }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-border">
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <IconButton label="Fermer" size="sm" onClick={onClose}><X /></IconButton>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <div className="p-4 border-t border-border flex items-center justify-end gap-2">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
