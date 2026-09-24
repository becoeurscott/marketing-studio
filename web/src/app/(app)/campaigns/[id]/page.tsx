"use client";

import { ArrowLeft, BarChart3, CalendarDays, Copy as CopyIcon, Download, FileText, Images, Layers, Megaphone, Trash2, Video, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignAnalyticsPanel, StatTile } from "@/components/campaigns/AnalyticsCharts";
import { CalendarView } from "@/components/campaigns/CalendarView";
import { PlatformIcon, formatLabel, objectiveLabel, platformLabel } from "@/components/campaigns/platform";
import { AssetCard } from "@/components/assets/AssetCard";
import { ExportModal } from "@/components/assets/ExportModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePageTitle } from "@/components/shell/ShellContext";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Asset, CampaignStatus } from "@/lib/types";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";

type Tab = "overview" | "assets" | "ads" | "videos" | "copy" | "calendar" | "analytics";

export default function CampaignWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));
  const project = useStore((s) => s.projects.find((p) => p.id === campaign?.projectId));
  const allAssets = useStore((s) => s.assets);
  const favorites = useStore((s) => s.favorites.asset);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const updateCampaign = useStore((s) => s.updateCampaign);
  const deleteCampaign = useStore((s) => s.deleteCampaign);

  const [tab, setTab] = useState<Tab>("overview");
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  usePageTitle(campaign?.name);

  if (!campaign) {
    return <EmptyState icon={Megaphone} title="Campaign not found" description="It may have been deleted." cta={{ label: "Back to campaigns", href: "/campaigns" }} />;
  }

  const assets = campaign.assetIds.map((aid) => allAssets.find((a) => a.id === aid)).filter((a): a is Asset => Boolean(a));
  const videos = assets.filter((a) => a.type === "video");
  const images = assets.filter((a) => a.type === "image");
  const published = campaign.calendar.filter((c) => c.status === "published").length;
  const scheduled = campaign.calendar.filter((c) => c.status === "scheduled").length;

  const setStatus = (status: CampaignStatus) => {
    updateCampaign(campaign.id, { status });
    toast.success(`Campaign ${status}`, campaign.name);
  };

  const tabs = [
    { value: "overview" as const, label: "Overview" },
    { value: "assets" as const, label: "Assets", count: assets.length },
    { value: "ads" as const, label: "Ads", count: campaign.variations.length },
    { value: "videos" as const, label: "Videos", count: videos.length },
    { value: "copy" as const, label: "Copy", count: campaign.copy.length + campaign.variations.length },
    { value: "calendar" as const, label: "Calendar", count: campaign.calendar.length },
    { value: "analytics" as const, label: "Analytics" },
  ];

  return (
    <>
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mb-3"><ArrowLeft className="size-3.5" /> Campaigns</Link>
      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(campaign.status)} dot className="capitalize">{campaign.status}</Badge>
            <span className="text-[12px] text-muted">{objectiveLabel(campaign.objective)} · {project?.name ?? "No project"}</span>
          </div>
        }
        title={campaign.name}
        description={campaign.audience}
        actions={
          <>
            <Select compact aria-label="Change status" value={campaign.status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "completed", label: "Completed" }]} />
            <Button variant="secondary" leftIcon={<Download className="size-4" />} onClick={() => setExportOpen(true)}>Export campaign</Button>
          </>
        }
      />

      <Tabs items={tabs} value={tab} onChange={setTab} layoutId="campaign-tabs" className="mb-6" />

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Assets" value={String(assets.length)} sub={`${images.length} images · ${videos.length} videos`} />
            <StatTile label="Ad variations" value={String(campaign.variations.length)} sub="Creative A–D" />
            <StatTile label="Calendar" value={String(campaign.calendar.length)} sub={`${published} published · ${scheduled} scheduled`} />
            <StatTile label="Reach" value={campaign.analytics ? formatNumber(campaign.analytics.reach) : "—"} sub={campaign.analytics ? `${campaign.analytics.ctr}% CTR` : "Activate to track"} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <h3 className="text-[15px] font-semibold mb-4">Brief</h3>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div><dt className="text-[12px] text-muted mb-1">Objective</dt><dd className="font-medium">{objectiveLabel(campaign.objective)}</dd></div>
                <div><dt className="text-[12px] text-muted mb-1">Created</dt><dd className="font-medium">{formatDate(campaign.createdAt)} <span className="text-muted font-normal">· updated {timeAgo(campaign.updatedAt)}</span></dd></div>
                <div className="sm:col-span-2"><dt className="text-[12px] text-muted mb-1">Audience</dt><dd>{campaign.audience}</dd></div>
                <div>
                  <dt className="text-[12px] text-muted mb-1.5">Platforms</dt>
                  <dd className="flex flex-wrap gap-1.5">{campaign.platforms.map((p) => <span key={p} className="inline-flex items-center gap-1.5 text-[12px] bg-elevated border border-border rounded-full px-2.5 py-1"><PlatformIcon platform={p} className="size-3.5" />{platformLabel(p)}</span>)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-muted mb-1.5">Formats</dt>
                  <dd className="flex flex-wrap gap-1.5">{campaign.formats.map((f) => <Badge key={f} tone="outline">{formatLabel(f)}</Badge>)}</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <h3 className="text-[15px] font-semibold mb-3">Quick actions</h3>
              <div className="flex flex-col gap-2">
                <Link href="/studio/image"><Button variant="secondary" fullWidth leftIcon={<Wand2 className="size-4" />} className="justify-start">Generate more visuals</Button></Link>
                <Link href="/studio/ads"><Button variant="secondary" fullWidth leftIcon={<Layers className="size-4" />} className="justify-start">New ad variations</Button></Link>
                <Link href="/studio/copy"><Button variant="secondary" fullWidth leftIcon={<FileText className="size-4" />} className="justify-start">Write copy</Button></Link>
                <Link href={`/campaigns/${campaign.id}/calendar`}><Button variant="secondary" fullWidth leftIcon={<CalendarDays className="size-4" />} className="justify-start">Open calendar</Button></Link>
                <Button variant="secondary" fullWidth leftIcon={<Download className="size-4" />} className="justify-start" onClick={() => setExportOpen(true)}>Export campaign</Button>
                <Button variant="ghost" fullWidth leftIcon={<Trash2 className="size-4" />} className="justify-start text-danger hover:text-danger" onClick={() => setDeleteOpen(true)}>Delete campaign</Button>
              </div>
            </Card>
          </div>

          {assets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold">Latest assets</h3>
                <button className="text-[13px] text-text2 hover:text-text" onClick={() => setTab("assets")}>View all</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {assets.slice(0, 6).map((a) => <AssetCard key={a.id} asset={a} favorite={favorites.includes(a.id)} onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "assets" && (
        assets.length === 0 ? (
          <EmptyState icon={Images} title="No assets in this campaign" description="Generate visuals in the Studio and add them to the campaign." cta={{ label: "Open Studio", href: "/studio" }} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assets.map((a) => <AssetCard key={a.id} asset={a} favorite={favorites.includes(a.id)} onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
          </div>
        )
      )}

      {tab === "ads" && (
        campaign.variations.length === 0 ? (
          <EmptyState icon={Layers} title="No ad variations yet" description="Generate Creative A–D with headline, primary text and CTA." cta={{ label: "Open Ad creator", href: "/studio/ads" }} />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {campaign.variations.map((v) => (
              <Card key={v.id} padded={false} className="overflow-hidden">
                <div className="relative aspect-[4/5] bg-elevated">
                  <img src={v.visual} alt="" className="size-full object-cover" />
                  <Badge tone="accent" className="absolute top-3 left-3">Creative {v.label}</Badge>
                  <span className="absolute top-3 right-3 size-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"><PlatformIcon platform={v.platform} className="size-3.5" /></span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold leading-snug">{v.headline}</p>
                  <p className="text-[13px] text-text2 mt-1.5 line-clamp-3">{v.primaryText}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge tone="outline">{v.cta}</Badge>
                    <button className="text-[12px] text-text2 hover:text-text inline-flex items-center gap-1" onClick={() => { navigator.clipboard?.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.cta}`); toast.success("Copied", `Creative ${v.label}`); }}><CopyIcon className="size-3.5" /> Copy</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "videos" && (
        videos.length === 0 ? (
          <EmptyState icon={Video} title="No videos yet" description="Generate a product video or UGC ad and add it to the campaign." cta={{ label: "Generate video", href: "/studio/video" }} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((a) => <AssetCard key={a.id} asset={a} favorite={favorites.includes(a.id)} onToggleFavorite={(x) => toggleFavorite("asset", x.id)} href={`/assets/${a.id}`} />)}
          </div>
        )
      )}

      {tab === "copy" && (
        campaign.copy.length === 0 && campaign.variations.length === 0 ? (
          <EmptyState icon={FileText} title="No copy yet" description="Write captions, ad copy or scripts in the brand voice." cta={{ label: "Open Copywriter", href: "/studio/copy" }} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaign.copy.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <Badge tone="outline" className="capitalize">{c.tone}</Badge>
                </div>
                <pre className="text-[13px] text-text2 whitespace-pre-wrap font-sans">{c.text}</pre>
              </Card>
            ))}
            {campaign.variations.map((v) => (
              <Card key={v.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Ad copy — Creative {v.label}</p>
                  <button className="text-[12px] text-text2 hover:text-text inline-flex items-center gap-1" onClick={() => { navigator.clipboard?.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.cta}`); toast.success("Copied"); }}><CopyIcon className="size-3.5" /> Copy</button>
                </div>
                <p className="text-[13px]"><span className="text-muted">Headline · </span>{v.headline}</p>
                <p className="text-[13px] mt-1"><span className="text-muted">Primary · </span>{v.primaryText}</p>
                <p className="text-[13px] mt-1"><span className="text-muted">CTA · </span>{v.cta}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "calendar" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text2">{campaign.calendar.length} items · {published} published · {scheduled} scheduled</p>
            <Link href={`/campaigns/${campaign.id}/calendar`}><Button size="sm" variant="secondary" leftIcon={<CalendarDays className="size-4" />}>Open full calendar</Button></Link>
          </div>
          <CalendarView campaign={campaign} compact />
        </div>
      )}

      {tab === "analytics" && (
        campaign.analytics ? (
          <CampaignAnalyticsPanel analytics={campaign.analytics} />
        ) : (
          <EmptyState icon={BarChart3} title="No analytics yet" description="Analytics appear once the campaign is active. This prototype shows simulated numbers." cta={{ label: "Set active", onClick: () => { setStatus("active"); toast.info("Analytics will appear after the first sync", "Simulated data is attached to active seed campaigns."); } }} />
        )
      )}

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} campaignId={campaign.id} assetIds={campaign.assetIds} />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete campaign?"
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { deleteCampaign(campaign.id); toast.info("Campaign deleted"); router.push("/campaigns"); }}>Delete</Button></>}
      >
        <p className="text-sm text-text2">Assets stay in your library. This can&apos;t be undone in the prototype.</p>
      </Modal>

    </>
  );
}
