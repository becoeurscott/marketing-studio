"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarView } from "@/components/campaigns/CalendarView";
import { PlatformIcons, statusLabel } from "@/components/campaigns/platform";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";

export default function CampaignCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));
  usePageTitle(campaign ? `${campaign.name} · Calendrier` : undefined);

  if (!campaign) {
    return <EmptyState icon={CalendarDays} title="Campagne introuvable" description="Elle a peut-être été supprimée." cta={{ label: "Retour aux campagnes", href: "/campaigns" }} />;
  }

  const counts = {
    draft: campaign.calendar.filter((c) => c.status === "draft").length,
    scheduled: campaign.calendar.filter((c) => c.status === "scheduled").length,
    published: campaign.calendar.filter((c) => c.status === "published").length,
  };

  return (
    <>
      <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> {campaign.name}</Link>
      <PageHeader
        eyebrow={<div className="flex items-center gap-2"><Badge tone={statusTone(campaign.status)} dot>{statusLabel(campaign.status)}</Badge><PlatformIcons platforms={campaign.platforms} /></div>}
        title="Calendrier éditorial"
        description={`${campaign.calendar.length} éléments · ${counts.published} publié(s) · ${counts.scheduled} programmé(s) · ${counts.draft} brouillon(s)`}
      />
      <CalendarView campaign={campaign} />
    </>
  );
}
