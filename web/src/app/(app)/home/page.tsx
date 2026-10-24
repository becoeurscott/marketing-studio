"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, CreditCard, Film, FolderKanban, Images, Megaphone, Sparkles, Type, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ShowcaseBanner } from "@/components/home/ShowcaseBanner";
import { FeatureBanner } from "@/components/home/FeatureBanner";
import { TrendingVideos } from "@/components/home/TrendingVideos";
import { UserGallery } from "@/components/home/UserGallery";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useStore } from "@/lib/store";
import { cn, formatNumber, greetingForHour } from "@/lib/utils";

interface QuickAction { icon: React.ElementType; label: string; desc: string; href: string; accent?: boolean }

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Wand2, label: "Générer une image", desc: "IA multi-modèles", href: "/studio/image", accent: true },
  { icon: Film, label: "Créer une vidéo", desc: "UGC, pub, produit", href: "/studio/video" },
  { icon: Camera, label: "Shooting produit", desc: "Photo studio IA", href: "/studio/product-shoot" },
  { icon: Megaphone, label: "Créer une pub", desc: "75 templates", href: "/studio/ads" },
  { icon: Type, label: "Rédiger un texte", desc: "Accroches, posts", href: "/studio/copy" },
  { icon: Images, label: "Mes ressources", desc: "Tout mon contenu", href: "/assets" },
];

export default function HomePage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const credits = useStore((s) => s.credits);
  const projects = useStore((s) => s.projects);
  const assets = useStore((s) => s.assets);
  const [greeting] = useState(() => greetingForHour(new Date().getHours()));

  const activeProjects = projects.filter((p) => p.status === "active").length;

  return (
    <>
      {/* Header */}
      <PageHeader
        title={user.name && user.name !== "Mon compte" ? `${greeting}, ${user.name.split(" ")[0]}.` : `${greeting} !`}
        description="Que créons-nous aujourd'hui ?"
        actions={
          <div className="flex items-center gap-3">
            <Link href="/credits" className="flex items-center gap-1.5 text-[13px] text-highlight font-medium">
              <Sparkles className="size-3.5" />
              {formatNumber(credits)} crédits
            </Link>
            <Button size="lg" leftIcon={<Wand2 className="size-4" />} onClick={() => router.push("/studio")}>Créer</Button>
          </div>
        }
      />

      {/* 1. Feature banner (scrollable pills) */}
      <FeatureBanner />

      {/* 2. Showcase carousel */}
      <ShowcaseBanner />

      {/* 3. Quick actions (compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div key={a.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Link href={a.href}>
              <Card interactive padded={false} className="p-3 flex items-center gap-2.5 h-full">
                <span className={cn("size-8 rounded-md flex items-center justify-center shrink-0", a.accent ? "bg-accent/15 text-highlight" : "bg-white/[0.06] text-text2")}>
                  <a.icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-tight">{a.label}</span>
                  <span className="block text-[11px] text-muted leading-tight">{a.desc}</span>
                </span>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 4. Stats strip */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { label: "Projets", value: activeProjects, href: "/projects", icon: FolderKanban },
          { label: "Ressources", value: assets.length, href: "/assets", icon: Images },
          { label: "Crédits", value: credits, href: "/credits", icon: Sparkles, accent: true },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="flex items-center gap-2 shrink-0 rounded-lg border border-border bg-surface px-3 py-2 hover:bg-elevated transition-colors">
            <s.icon className={cn("size-4", s.accent ? "text-highlight" : "text-muted")} />
            <span className="text-[15px] font-semibold">{formatNumber(s.value)}</span>
            <span className="text-[12px] text-muted">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* 5. Trending videos from community */}
      <TrendingVideos />

      {/* 6. User generations gallery with sticky category tabs */}
      <UserGallery />
    </>
  );
}
