"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";

export default function NewCampaignPage() {
  usePageTitle("Nouvelle campagne");
  return (
    <>
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Campagnes</Link>
      <PageHeader title="Créateur de campagne" description="Cinq étapes, de l'objectif à une campagne générée et prête à programmer." />
      <CampaignBuilder />
    </>
  );
}
