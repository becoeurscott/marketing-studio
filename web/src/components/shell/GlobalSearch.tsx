"use client";

import { ArrowRight, FolderKanban, Images, LayoutTemplate, Megaphone, Search, Users, Wand2, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { creators, templates } from "@/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { primaryNav, secondaryNav } from "./nav";

interface Result { key: string; group: string; label: string; sub?: string; href: string; icon?: LucideIcon; thumb?: string }

const TOOLS: Result[] = [
  { key: "t-image", group: "Outils", label: "Générer une image", sub: "Studio", href: "/studio/image", icon: Wand2 },
  { key: "t-video", group: "Outils", label: "Créer une vidéo", sub: "Studio", href: "/studio/video", icon: Wand2 },
  { key: "t-ugc", group: "Outils", label: "Vidéo UGC avec un créateur", sub: "Studio", href: "/studio/ugc", icon: Wand2 },
  { key: "t-shoot", group: "Outils", label: "Shooting produit", sub: "Studio", href: "/studio/product-shoot", icon: Wand2 },
  { key: "t-ads", group: "Outils", label: "Créer une publicité", sub: "Studio", href: "/studio/ads", icon: Wand2 },
  { key: "t-copy", group: "Outils", label: "Écrire des textes de vente", sub: "Studio", href: "/studio/copy", icon: Wand2 },
  { key: "t-campaign", group: "Outils", label: "Nouvelle campagne", sub: "Campagnes", href: "/campaigns/new", icon: Megaphone },
];

/** Accent- and case-insensitive text match. */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const GROUP_ORDER = ["Outils", "Pages", "Projets", "Campagnes", "Ressources", "Modèles", "Créateurs"];
const MAX_PER_GROUP = 4;

/**
 * Live search across the user's workspace (projects, campaigns, assets) and the catalog
 * (templates, creators, tools, pages). ⌘K / Ctrl+K focuses it; arrows + Enter navigate.
 */
export function GlobalSearch({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const projects = useStore((s) => s.projects);
  const campaigns = useStore((s) => s.campaigns);
  const assets = useStore((s) => s.assets);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
    };
    const onDoc = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDoc);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDoc); };
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = norm(q.trim());
    if (!term) return [];
    const words = term.split(/\s+/);
    const hit = (...fields: (string | undefined)[]) => { const hay = norm(fields.filter(Boolean).join(" ")); return words.every((w) => hay.includes(w)); };
    const all: Result[] = [
      ...TOOLS.filter((t) => hit(t.label, t.sub)),
      ...[...primaryNav, ...secondaryNav].filter((n) => hit(n.label)).map((n) => ({ key: `p-${n.href}`, group: "Pages", label: n.label, href: n.href, icon: n.icon })),
      ...projects.filter((p) => hit(p.name, p.description)).map((p) => ({ key: p.id, group: "Projets", label: p.name, sub: p.description || (p.status === "archived" ? "Archivé" : "Projet"), href: `/projects/${p.id}`, icon: FolderKanban })),
      ...campaigns.filter((c) => hit(c.name, c.audience)).map((c) => ({ key: c.id, group: "Campagnes", label: c.name, sub: c.audience, href: `/campaigns/${c.id}`, icon: Megaphone })),
      ...assets.filter((a) => hit(a.name, a.tags.join(" "))).map((a) => ({ key: a.id, group: "Ressources", label: a.name, sub: a.type === "video" ? "Vidéo" : "Image", href: `/assets/${a.id}`, icon: Images, thumb: a.type === "video" ? undefined : a.thumbnail })),
      ...templates.filter((t) => hit(t.title, t.category, t.description)).map((t) => ({ key: t.id, group: "Modèles", label: t.title, sub: t.category, href: `/templates/${t.id}`, icon: LayoutTemplate, thumb: t.thumbnail })),
      ...creators.filter((c) => hit(c.name, c.style)).map((c) => ({ key: c.id, group: "Créateurs", label: c.name, sub: c.style, href: `/creators?creator=${c.id}`, icon: Users, thumb: c.portrait })),
    ];
    return GROUP_ORDER.flatMap((g) => all.filter((r) => r.group === g).slice(0, MAX_PER_GROUP));
  }, [q, projects, campaigns, assets]);

  const go = (r: Result) => {
    router.push(r.href);
    setOpen(false); setQ(""); inputRef.current?.blur(); onDone?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const r = results[active]; if (r) go(r); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); onDone?.(); }
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher projets, ressources, modèles…"
          aria-label="Rechercher"
          role="combobox"
          aria-expanded={open && !!q}
          aria-controls="global-search-results"
          className="w-full h-9 bg-surface border border-border-strong rounded-md pl-9 pr-14 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button type="button" aria-label="Effacer" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="absolute right-2 text-muted hover:text-text"><X className="size-4" /></button>
        ) : (
          <kbd className="hidden md:block absolute right-2 rounded border border-border-strong px-1.5 text-[10px] text-muted">⌘K</kbd>
        )}
      </div>

      {open && q.trim() && (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border-strong bg-elevated p-1.5 shadow-float">
          {results.length ? (
            GROUP_ORDER.filter((g) => results.some((r) => r.group === g)).map((g) => (
              <div key={g} className="py-1">
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{g}</p>
                {results.filter((r) => r.group === g).map((r) => {
                  const i = results.indexOf(r);
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left", i === active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")}
                    >
                      {r.thumb ? (
                        <img src={r.thumb} alt="" className="size-8 shrink-0 rounded-md object-cover bg-surface" />
                      ) : (
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/[0.05] text-text2">{Icon && <Icon className="size-4" />}</span>
                      )}
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[13px] text-text">{r.label}</span>
                        {r.sub && <span className="block truncate text-[11px] text-muted">{r.sub}</span>}
                      </span>
                      {i === active && <ArrowRight className="size-3.5 text-muted" />}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-[13px] text-muted">Aucun résultat pour « {q.trim()} »</p>
          )}
        </div>
      )}
    </div>
  );
}
