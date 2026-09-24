"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";

export default function NewCampaignPage() {
  usePageTitle("New campaign");
  return (
    <>
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Campaigns</Link>
      <PageHeader title="Campaign builder" description="Five steps from objective to a generated, schedulable campaign." />
      <CampaignBuilder />
    </>
  );
}
