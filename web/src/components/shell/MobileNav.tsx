"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { isActive, primaryNav, secondaryNav } from "./nav";
import { useShell } from "./ShellContext";

const tabs = primaryNav.slice(0, 4); // Home, Studio, Projects, Assets
const more = [...primaryNav.slice(4), ...secondaryNav];

export function MobileNav() {
  const path = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useShell();
  const user = useStore((s) => s.user);
  const credits = useStore((s) => s.credits);
  const moreActive = more.some((i) => isActive(i, path));

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          {tabs.map((item) => {
            const active = isActive(item, path);
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-0.5 min-w-0 text-[10.5px] font-medium", active ? "text-highlight" : "text-muted")}>
                <item.icon className="size-5 shrink-0" />
                <span className="max-w-full truncate px-0.5">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setMobileMenuOpen(true)} className={cn("flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium", moreActive ? "text-highlight" : "text-muted")}>
            <MoreHorizontal className="size-5" />
            Plus
          </button>
        </div>
      </nav>

      <BottomSheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border mb-3">
          <Avatar src={user.avatarUrl} name={user.name} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium truncate">{user.name}</span>
            <span className="block text-xs text-muted truncate">{user.email}</span>
          </span>
          <span className="text-xs text-highlight font-medium">{formatNumber(credits)} cr.</span>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {more.map((item) => {
            const active = isActive(item, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn("flex items-center gap-2.5 h-11 px-3 rounded-md text-[13px] font-medium border", active ? "bg-accent/10 border-accent/40 text-highlight" : "bg-surface border-border text-text2")}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
