"use client";

import { Bell, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { selectUnreadCount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { IconButton } from "@/components/ui/IconButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { titleForPath } from "./nav";
import { useShell } from "./ShellContext";

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const { title } = useShell();
  const unread = useStore(selectUnreadCount);
  const [q, setQ] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/assets?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-bg/85 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 md:px-6">
      <Link href="/home" className="md:hidden size-7 rounded-md bg-gradient-to-br from-highlight via-accent to-green flex items-center justify-center shrink-0">
        <Sparkles className="size-4 text-on-accent" />
      </Link>
      <h1 className="text-[15px] md:text-base font-semibold tracking-tight truncate min-w-0 flex-1 md:flex-none md:max-w-[12rem] lg:max-w-xs">{title ?? titleForPath(path)}</h1>

      <form onSubmit={submit} className={cn("hidden md:block md:flex-1 max-w-md md:mx-auto")}>
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher projets, ressources, modèles…" />
      </form>

      <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
        <span className="inline-flex md:hidden"><IconButton label="Rechercher" onClick={() => setMobileSearch((v) => !v)}><Search /></IconButton></span>
        <span className="hidden sm:inline-flex"><CreditBadge /></span>
        <Link href="/notifications" className="relative inline-flex">
          <IconButton label="Notifications" active={path === "/notifications"}><Bell /></IconButton>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent text-[10px] font-semibold text-on-accent flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <span className="hidden sm:inline-flex"><Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => router.push("/studio")}>Créer</Button></span>
        <span className="inline-flex sm:hidden"><IconButton label="Créer" variant="solid" className="bg-accent text-on-accent hover:bg-highlight" onClick={() => router.push("/studio")}><Plus /></IconButton></span>
      </div>

      {mobileSearch && (
        <form onSubmit={submit} className="absolute left-0 right-0 top-14 p-3 bg-bg border-b border-border md:hidden">
          <SearchBar value={q} onChange={setQ} placeholder="Rechercher…" autoFocus />
        </form>
      )}
    </header>
  );
}
