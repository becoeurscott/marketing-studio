"use client";

import { ArrowRight, Camera, Film, Megaphone, MessageSquare, Palette, Sparkles, Type, Users, Wand2, Zap } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ElementType;
  label: string;
  desc: string;
  href?: string;
  accent?: boolean;
}

const FEATURES: Feature[] = [
  { icon: Wand2, label: "Studio IA", desc: "Générez images et vidéos", href: "/studio", accent: true },
  { icon: Camera, label: "Shooting produit", desc: "Photo pro en un clic", href: "/studio/product-shoot" },
  { icon: Film, label: "Vidéos UGC", desc: "Créateurs IA réalistes", href: "/studio/ugc" },
  { icon: Megaphone, label: "Publicités", desc: "Pubs prêtes à poster", href: "/studio/ads" },
  { icon: Type, label: "Rédaction IA", desc: "Accroches et textes", href: "/studio/copy" },
  { icon: Palette, label: "75 modèles pub", desc: "Templates de pub pro" },
  { icon: Users, label: "Créateurs", desc: "16 visages africains", href: "/creators" },
  { icon: Sparkles, label: "Génération d'images", desc: "Modèles IA multiples", href: "/studio/image" },
  { icon: Zap, label: "Vidéo rapide", desc: "5s à 10s, HD", href: "/studio/video" },
  { icon: MessageSquare, label: "WhatsApp", desc: "Statuts verticaux", href: "/studio/image" },
];

export function FeatureBanner() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section className="mb-6">
      <div
        ref={ref}
        className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1 snap-x"
      >
        {FEATURES.map((f) => {
          const inner = (
            <div
              className={cn(
                "snap-start shrink-0 flex items-center gap-3 rounded-xl border px-4 py-3 min-w-[200px] max-w-[240px] transition-colors",
                f.accent
                  ? "border-accent/40 bg-accent/10 hover:bg-accent/15"
                  : "border-border bg-surface hover:bg-elevated",
                f.href && "cursor-pointer",
              )}
            >
              <span className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", f.accent ? "bg-accent/20 text-highlight" : "bg-white/[0.06] text-text2")}>
                <f.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">{f.label}</span>
                <span className="block text-[11px] text-muted leading-tight mt-0.5">{f.desc}</span>
              </span>
              {f.href && <ArrowRight className="size-3.5 text-muted shrink-0 ml-auto" />}
            </div>
          );
          return f.href ? (
            <Link key={f.label} href={f.href}>{inner}</Link>
          ) : (
            <div key={f.label}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
