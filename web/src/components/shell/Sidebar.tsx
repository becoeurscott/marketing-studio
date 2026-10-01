"use client";

import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { useStore } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Tooltip } from "@/components/ui/Tooltip";
import { isActive, primaryNav } from "./nav";
import { useShell } from "./ShellContext";

export const SIDEBAR_W = 240;
export const SIDEBAR_W_COLLAPSED = 64;

export function Sidebar() {
  const path = usePathname();
  const { sidebarCollapsed: collapsed, sidebarLocked, setSidebarCollapsed } = useShell();
  const user = useStore((s) => s.user);
  const credits = useStore((s) => s.credits);
  const plan = useStore((s) => s.plan);

  return (
    <motion.aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-surface border-r border-border"
      animate={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
    >
      {/* Logo */}
      <Link href="/home" className={cn("flex items-center h-14 border-b border-border shrink-0", collapsed ? "justify-center" : "px-4 gap-2.5")}>
        <span className="size-7 rounded-md bg-gradient-to-br from-highlight via-accent to-green flex items-center justify-center shadow-glow">
          <Sparkles className="size-4 text-on-accent" />
        </span>
        {!collapsed && <span className="text-[15px] font-semibold tracking-tight">Sokozia</span>}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {primaryNav.map((item) => {
          const active = isActive(item, path);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center h-9 rounded-md text-[13.5px] font-medium transition-colors",
                collapsed ? "justify-center" : "px-2.5 gap-3",
                active ? "text-text bg-white/6" : "text-text2 hover:text-text hover:bg-white/4",
              )}
            >
              {active && <motion.span layoutId="sidebar-active" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" />}
              <item.icon className={cn("size-[18px] shrink-0", active && "text-highlight")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
          return collapsed ? <Tooltip key={item.href} label={item.label} side="right" className="w-full">{link}</Tooltip> : link;
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-1">
        <Link
          href="/credits"
          className={cn("flex items-center h-9 rounded-md text-[13px] font-medium text-text2 hover:text-text hover:bg-white/4 transition-colors", collapsed ? "justify-center" : "px-2.5 gap-3")}
          title={`${formatNumber(credits)} crédits`}
        >
          <Sparkles className="size-[18px] text-highlight shrink-0" />
          {!collapsed && (
            <span className="flex-1 flex items-center justify-between">
              <span>{formatNumber(credits)} crédits</span>
              <span className="text-[11px] text-muted capitalize">{plan}</span>
            </span>
          )}
        </Link>
        <Link href="/profile" className={cn("flex items-center h-11 rounded-md hover:bg-white/4 transition-colors", collapsed ? "justify-center" : "px-2 gap-2.5")}>
          <Avatar src={user.avatarUrl} name={user.name} size={28} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-[13px] font-medium truncate">{user.name}</span>
              <span className="block text-[11px] text-muted truncate">{user.company || user.email}</span>
            </span>
          )}
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            title="Se déconnecter"
            className={cn("flex items-center h-8 w-full rounded-md text-[12px] text-muted hover:text-text hover:bg-white/4 transition-colors", collapsed ? "justify-center" : "px-2.5 gap-3")}
          >
            <LogOut className="size-4" />{!collapsed && "Se déconnecter"}
          </button>
        </form>
        {/* Below 1280px the sidebar stays collapsed, so the toggle is only offered on wide screens */}
        {!sidebarLocked && <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className={cn("flex items-center h-8 w-full rounded-md text-[12px] text-muted hover:text-text hover:bg-white/4 transition-colors", collapsed ? "justify-center" : "px-2.5 gap-3")}
          aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Replier</>}
        </button>}
      </div>
    </motion.aside>
  );
}
