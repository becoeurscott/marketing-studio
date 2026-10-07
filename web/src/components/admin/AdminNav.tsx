"use client";

import { ArrowLeft, BadgeDollarSign, Coins, LayoutGrid, ScrollText, Settings2, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Vue d’ensemble", icon: LayoutGrid },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/jobs", label: "Générations", icon: Sparkles },
  { href: "/admin/credits", label: "Crédits", icon: Coins },
  { href: "/admin/pricing", label: "Tarifs", icon: BadgeDollarSign },
  { href: "/admin/settings", label: "Higgsfield", icon: Settings2 },
  { href: "/admin/audit", label: "Journal", icon: ScrollText },
];

export function AdminNav({ admin }: { admin: { name: string; email: string } }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <>
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0b0b] p-3">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-2">
          <span className="grid size-9 place-items-center rounded-xl bg-white text-black font-black">M</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Marketing Studio</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Admin</span>
          </span>
        </Link>
        <nav className="mt-6 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                active(href) ? "bg-white/[0.08] text-text" : "text-text2 hover:bg-white/[0.04] hover:text-text",
              )}
            >
              <Icon className={cn("size-4", active(href) && "text-accent")} /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <Link href="/home" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-muted hover:text-text"><ArrowLeft className="size-3.5" /> Retour à l&apos;app</Link>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-highlight text-[12px] font-bold text-black">{admin.name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[12px] font-medium">{admin.name}</span>
              <span className="block truncate text-[11px] text-muted">{admin.email}</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Phones / tablets: bottom tab bar */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/[0.08] bg-black/90 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur-xl">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px]", active(href) ? "text-accent" : "text-muted")}>
            <Icon className="size-5" />
            <span className="truncate max-w-full">{label.replace("Vue d’ensemble", "Accueil")}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
