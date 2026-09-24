"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
import { Sidebar, SIDEBAR_W, SIDEBAR_W_COLLAPSED } from "./Sidebar";
import { ShellProvider, useShell } from "./ShellContext";
import { TopBar } from "./TopBar";

function Frame({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, setInspectorEl, inspectorCount, immersive } = useShell();
  const path = usePathname();
  const hasInspector = inspectorCount > 0;

  return (
    <div className="min-h-dvh flex bg-bg">
      <Sidebar />
      <motion.div
        className="flex-1 min-w-0 flex flex-col"
        initial={false}
        animate={{ paddingLeft: 0 }}
        style={{ ["--sb" as string]: `${sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W}px` }}
      >
        <div className="md:pl-[var(--sb)] transition-[padding] duration-300 flex flex-col min-h-dvh">
          <div className={cn(immersive && "hidden md:block")}><TopBar /></div>
          <div className="flex flex-1 min-w-0">
            <motion.main
              key={path}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={cn("flex-1 min-w-0", immersive ? "p-0" : "px-4 md:px-6 lg:px-8 py-5 md:py-6 pb-24 md:pb-10")}
            >
              {children}
            </motion.main>
            {/* Right inspector slot (desktop only) */}
            <aside
              ref={setInspectorEl}
              className={cn("hidden lg:block shrink-0 border-l border-border bg-surface overflow-y-auto sticky top-14 h-[calc(100dvh-3.5rem)]", hasInspector ? "w-[320px]" : "w-0 border-l-0")}
            />
          </div>
        </div>
      </motion.div>
      <MobileNav />
    </div>
  );
}

/**
 * AppShell: desktop = fixed left Sidebar (240 → 64 collapsed) + TopBar + content + optional right Inspector.
 * Mobile = TopBar + content + bottom MobileNav (+ "More" sheet).
 * Pages render `<Inspector>` (from ./ShellContext) to fill the right column and `usePageTitle()` to set the TopBar title.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <Frame>{children}</Frame>
    </ShellProvider>
  );
}
