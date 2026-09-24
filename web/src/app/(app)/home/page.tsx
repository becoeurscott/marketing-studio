"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, FolderKanban, Images, Megaphone, PenLine, Sparkles, TrendingUp, Users, Video, Wand2, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { templates } from "@/data/templates";
import { trendingFormats } from "@/data/analytics";
import { useStore } from "@/lib/store";
import { cn, formatNumber, greetingForHour, timeAgo } from "@/lib/utils";
import { ProjectCard } from "@/components/projects/ProjectCard";

const modeIcon: Record<string, typeof Wand2> = { image: Images, video: Video, ugc: Users, "product-shoot": Camera, ads: Megaphone, copy: PenLine };

export default function HomePage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const projects = useStore((s) => s.projects);
  const assets = useStore((s) => s.assets);
  const campaigns = useStore((s) => s.campaigns);
  const credits = useStore((s) => s.credits);
  const generations = useStore((s) => s.generations);
  // Safe: this page only renders client-side after store hydration (see (app)/layout.tsx).
  const [greeting] = useState(() => greetingForHour(new Date().getHours()));

  const active = projects.filter((p) => p.status === "active");
  const recentProjects = [...active].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 4);
  const recentAssets = [...assets].filter((a) => a.type === "image" || a.type === "video").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8);
  const continueItems = generations.filter((g) => g.status === "completed" && g.thumbnails.length).slice(0, 3);
  const featuredTemplates = templates.filter((t) => t.popular).slice(0, 6);

  const stats = [
    { label: "Projects", value: active.length, icon: FolderKanban, href: "/projects" },
    { label: "Assets", value: assets.length, icon: Images, href: "/assets" },
    { label: "Campaigns", value: campaigns.length, icon: Megaphone, href: "/campaigns" },
    { label: "Credits", value: credits, icon: Sparkles, href: "/credits", accent: true },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.name.split(" ")[0]}.`}
        description="What are we creating today?"
        actions={<Button size="lg" leftIcon={<Wand2 className="size-4" />} onClick={() => router.push("/studio")}>Create something</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={s.href}>
              <Card interactive className="flex items-center gap-3">
                <span className={cn("size-9 rounded-md flex items-center justify-center border border-border", s.accent ? "bg-accent/15 text-highlight" : "bg-elevated text-text2")}>
                  <s.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-xl font-semibold tracking-tight leading-none">{formatNumber(s.value)}</span>
                  <span className="block text-xs text-muted mt-1">{s.label}</span>
                </span>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Section title="Recent projects" action={<Link href="/projects" className="text-[13px] text-text2 hover:text-text flex items-center gap-1">View all <ArrowRight className="size-3.5" /></Link>}>
        {recentProjects.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {recentProjects.map((p) => <ProjectCard key={p.id} project={p} assetCount={assets.filter((a) => a.projectId === p.id).length} />)}
          </div>
        ) : (
          <EmptyState compact icon={FolderKanban} title="No projects yet" description="Create a project to organize assets, generations and campaigns." cta={{ label: "New project", href: "/projects" }} />
        )}
      </Section>

      <Section title="Continue creating" description="Pick up where you left off.">
        {continueItems.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueItems.map((g) => (
              <Card key={g.id} interactive padded={false} className="overflow-hidden group" onClick={() => router.push(`/studio/${g.type === "ad" ? "ads" : g.type}`)}>
                <div className="relative aspect-[16/10] bg-elevated overflow-hidden">
                  <img src={g.thumbnails[0]} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <Badge tone="accent" className="absolute top-3 left-3 capitalize">{g.type}</Badge>
                  <span className="absolute bottom-3 left-3 right-3 text-[13px] text-white line-clamp-2">{g.prompt}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted">{timeAgo(g.createdAt)} · {g.creditsUsed} credits</span>
                  <span className="text-[13px] font-medium text-highlight flex items-center gap-1">Resume <ArrowRight className="size-3.5" /></span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState compact icon={Wand2} title="Nothing in progress" description="Start a generation and it will show up here." cta={{ label: "Open Studio", href: "/studio" }} />
        )}
      </Section>

      <Section title="Templates" description="Start from a proven format." action={<Link href="/templates" className="text-[13px] text-text2 hover:text-text flex items-center gap-1">Browse all <ArrowRight className="size-3.5" /></Link>}>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1 snap-x">
          {featuredTemplates.map((t) => (
            <Link key={t.id} href={`/templates/${t.id}`} className="snap-start shrink-0 w-[160px] md:w-[190px] group">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-border bg-elevated">
                <img src={t.thumbnail} alt={t.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2.5 left-2.5 right-2.5 text-[13px] font-medium text-white leading-tight">{t.title}</span>
              </div>
              <p className="text-[11px] text-muted mt-1.5 capitalize">{t.platform} · {t.format}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Trending formats" description="What's working across the studio this week.">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {trendingFormats.map((f) => {
            const Icon = modeIcon[f.mode] ?? Wand2;
            return (
              <Card key={f.id} interactive onClick={() => router.push(`/studio/${f.mode}`)} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="size-8 rounded-md bg-elevated border border-border flex items-center justify-center text-text2"><Icon className="size-4" /></span>
                  <span className="text-xs font-medium text-success flex items-center gap-1"><TrendingUp className="size-3.5" />{f.growth}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-text2 mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="Recent assets" action={<Link href="/assets" className="text-[13px] text-text2 hover:text-text flex items-center gap-1">Open library <ArrowRight className="size-3.5" /></Link>}>
        {recentAssets.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {recentAssets.map((a) => (
              <Link key={a.id} href={`/assets/${a.id}`} className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-elevated">
                <img src={a.thumbnail} alt={a.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                {a.type === "video" && <span className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center"><Play className="size-3 text-white fill-white" /></span>}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] text-white line-clamp-1">{a.name}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState compact icon={Images} title="No assets yet" description="Generated and uploaded files land here." cta={{ label: "Generate an image", href: "/studio/image" }} />
        )}
      </Section>
    </>
  );
}
