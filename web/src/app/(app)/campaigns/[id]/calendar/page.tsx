"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarView } from "@/components/campaigns/CalendarView";
import { PlatformIcons } from "@/components/campaigns/platform";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";

export default function CampaignCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));
  usePageTitle(campaign ? `${campaign.name} · Calendar` : undefined);

  if (!campaign) {
    return <EmptyState icon={CalendarDays} title="Campaign not found" description="It may have been deleted." cta={{ label: "Back to campaigns", href: "/campaigns" }} />;
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
        eyebrow={<div className="flex items-center gap-2"><Badge tone={statusTone(campaign.status)} dot className="capitalize">{campaign.status}</Badge><PlatformIcons platforms={campaign.platforms} /></div>}
        title="Content calendar"
        description={`${campaign.calendar.length} items · ${counts.published} published · ${counts.scheduled} scheduled · ${counts.draft} draft`}
      />
      <CalendarView campaign={campaign} />
    </>
  );
}
