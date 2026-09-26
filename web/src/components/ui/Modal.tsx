"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative w-full bg-card border border-border-strong shadow-float rounded-t-xl md:rounded-xl max-h-[92vh] flex flex-col",
              sizes[size],
              className,
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
                <div>
                  {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
                  {description && <p className="text-sm text-text2 mt-0.5">{description}</p>}
                </div>
                <IconButton label="Fermer" size="sm" onClick={onClose}><X /></IconButton>
              </div>
            )}
            <div className="px-5 pb-5 overflow-y-auto flex-1">{children}</div>
            {footer && <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
