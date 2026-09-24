"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ShellContextValue {
  title: string | null;
  setTitle: (t: string | null) => void;
  inspectorEl: HTMLDivElement | null;
  setInspectorEl: (el: HTMLDivElement | null) => void;
  inspectorCount: number;
  registerInspector: (delta: 1 | -1) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  /** Immersive pages (Studio) drop the shell padding and hide the TopBar on mobile. */
  immersive: boolean;
  setImmersive: (v: boolean) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  const [inspectorEl, setInspectorEl] = useState<HTMLDivElement | null>(null);
  const [inspectorCount, setInspectorCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  return (
    <ShellContext.Provider
      value={{
        title, setTitle, inspectorEl, setInspectorEl, inspectorCount,
        registerInspector: (d) => setInspectorCount((c) => Math.max(0, c + d)),
        sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, immersive, setImmersive,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <AppShell>");
  return ctx;
}

/** Set the TopBar title for the current page (cleared on unmount). */
export function usePageTitle(title: string | null | undefined) {
  const { setTitle } = useShell();
  useEffect(() => {
    setTitle(title ?? null);
    return () => setTitle(null);
  }, [title, setTitle]);
}

/**
 * Render children into the desktop right Inspector column.
 * On mobile the content is hidden; pages should offer a BottomSheet alternative.
 */
export function Inspector({ children }: { children: ReactNode }) {
  const { inspectorEl, registerInspector } = useShell();
  useEffect(() => {
    registerInspector(1);
    return () => registerInspector(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!inspectorEl) return null;
  return createPortal(children, inspectorEl);
}

/** Mark the current page as immersive (full-bleed canvas; TopBar hidden on mobile). Cleared on unmount. */
export function useImmersive(on = true) {
  const { setImmersive } = useShell();
  useEffect(() => {
    setImmersive(on);
    return () => setImmersive(false);
  }, [on, setImmersive]);
}
