"use client";

import { Copy, Download, Megaphone, Pencil, RefreshCw, Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { Canvas, ControlField, ErrorState, StudioControls } from "@/components/creative";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressIndicator";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { exportAssets, generateAds } from "@/lib/api";
import { useTemplatePreset } from "@/components/studio/useTemplatePreset";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS, PLATFORMS, type AdFormat, type AdVariation, type Platform } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const FORMATS: { value: AdFormat; label: string }[] = [
  { value: "image", label: "Image" }, { value: "video", label: "Video" }, { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" }, { value: "reel", label: "Reel" }, { value: "short", label: "Short" },
];

/** Frame aspect + chrome per platform/format. */
function frameFor(platform: Platform, format: AdFormat): { ratio: string; label: string } {
  if (["story", "reel", "short"].includes(format) || platform === "tiktok") return { ratio: "aspect-[9/16]", label: "9:16" };
  if (platform === "youtube" || platform === "google") return { ratio: "aspect-[16/9]", label: "16:9" };
  if (platform === "pinterest") return { ratio: "aspect-[2/3]", label: "2:3" };
  return { ratio: "aspect-[4/5]", label: "4:5" };
}

type Phase = { kind: "idle" } | { kind: "loading" } | { kind: "done" } | { kind: "error"; error: unknown };

export default function AdsPage() {
  const toast = useToast();
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addAsset = useStore((s) => s.addAsset);
  const addGeneration = useStore((s) => s.addGeneration);

  const { template, preset } = useTemplatePreset("ads");
  const [platform, setPlatform] = useState<Platform>(preset?.platform ?? "instagram");
  const [format, setFormat] = useState<AdFormat>(preset?.format ?? "image");
  const [product, setProduct] = useState("Premium Watch");
  const [offer, setOffer] = useState("20% launch discount");
  const [audience, setAudience] = useState("Men 25–40");
  const [cta, setCta] = useState("Shop Now");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [variations, setVariations] = useState<AdVariation[]>([]);
  const [editing, setEditing] = useState<AdVariation | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [exporting, setExporting] = useState<Record<string, number>>({});

  const loading = phase.kind === "loading";
  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  async function generate() {
    if (!product.trim()) { toast.error("Add a product name first"); return; }
    setPhase({ kind: "loading" });
    try {
      const results = await generateAds({ platform, format, product, offer, audience, cta, projectId: currentProjectId });
      setVariations(results);
      setSaved([]);
      setPhase({ kind: "done" });
      toast.success("4 variations ready", `${platformLabel} · ${format}`);
    } catch (error) {
      setPhase({ kind: "error", error });
    }
  }

  function duplicate(v: AdVariation) {
    const copy: AdVariation = { ...v, id: uid("var"), headline: `${v.headline} (copy)` };
    setVariations((list) => { const i = list.findIndex((x) => x.id === v.id); return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]; });
    toast.info("Variation duplicated", `Creative ${v.label}`);
  }
  function save(v: AdVariation) {
    if (saved.includes(v.id)) { toast.info("Already saved"); return; }
    addAsset({ name: `Ad ${v.label} — ${product} (${platformLabel})`, type: "image", url: v.visual, thumbnail: v.visual, projectId: currentProjectId, favorite: false, width: 800, height: 1000, sizeKb: 960, tags: ["ad", platform, format] });
    addGeneration({ type: "ad", prompt: `${v.headline} — ${v.primaryText}`, status: "completed", thumbnails: [v.visual], projectId: currentProjectId, params: { platform, format, cta: v.cta, label: v.label }, creditsUsed: 0 });
    setSaved((s) => [...s, v.id]);
    toast.success("Saved", `Creative ${v.label} added to assets and history`);
  }
  async function exportOne(v: AdVariation) {
    setExporting((e) => ({ ...e, [v.id]: 0 }));
    toast.info("Export started", `Creative ${v.label} · ${format === "video" ? "MP4" : "PNG"}`);
    try {
      await exportAssets({ assetIds: [v.id], format: format === "video" ? "mp4" : "png", quality: "high" }, (pct) => setExporting((e) => ({ ...e, [v.id]: pct })));
      toast.success("Export complete", `Creative ${v.label} is ready to download.`);
    } catch {
      toast.error("Export failed", "Please try again.");
    } finally {
      setExporting((e) => { const n = { ...e }; delete n[v.id]; return n; });
    }
  }
  function applyEdit(patch: Pick<AdVariation, "headline" | "primaryText" | "cta">) {
    if (!editing) return;
    setVariations((list) => list.map((v) => (v.id === editing.id ? { ...v, ...patch } : v)));
    setEditing(null);
    toast.success("Variation updated");
  }

  const frame = frameFor(platform, format);

  const controls = (
    <>
      <ControlField label="Platform">
        <ChipGroup size="sm" options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))} value={platform} onChange={setPlatform} />
      </ControlField>
      <ControlField label="Format">
        <ChipGroup size="sm" options={FORMATS} value={format} onChange={setFormat} />
      </ControlField>
      <Input label="Product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Premium Watch" />
      <Input label="Offer" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="20% launch discount" />
      <Input label="Target audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Men 25–40" />
      <Input label="CTA" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Shop Now" />
    </>
  );

  return (
    <>
      <PageHeader title="Ad creator" description="Four creative variations for any platform, ready to edit and export." eyebrow={<div className="flex flex-wrap items-center gap-1.5"><Badge tone="accent">Studio · Ads</Badge>{template && <Badge tone="outline">Template · {template.title}</Badge>}</div>} />
      <StudioControls title="Ad settings" controls={controls} generateLabel={phase.kind === "done" ? "Regenerate" : "Generate ads"} generateIcon={Sparkles} onGenerate={generate} loading={loading} cost={CREDIT_COSTS.ads} />

      <Canvas>
        {phase.kind === "error" ? (
          <ErrorState error={phase.error} onRetry={generate} />
        ) : phase.kind === "idle" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <span className="size-14 rounded-full bg-accent/15 text-highlight flex items-center justify-center"><Megaphone className="size-6" /></span>
            <div>
              <h3 className="text-lg font-semibold">Ready to build {platformLabel} {format} ads</h3>
              <p className="text-sm text-text2 mt-1 max-w-sm">{product} · {offer} · {audience} · &ldquo;{cta}&rdquo;</p>
            </div>
            <Button leftIcon={<Sparkles className="size-4" />} onClick={generate}>Generate 4 variations · {CREDIT_COSTS.ads} cr</Button>
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-6 pb-28 lg:pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge tone="outline">{platformLabel}</Badge><Badge tone="outline">{format}</Badge><Badge tone="outline">{frame.label}</Badge>
              <span className="flex-1" />
              {phase.kind === "done" && <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={generate}>Regenerate</Button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3"><Skeleton className={cn("w-full rounded-lg", frame.ratio)} /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div>
                  ))
                : variations.map((v) => (
                    <article key={v.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
                      {/* Platform-aware frame */}
                      <div className="p-3 pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="size-6 rounded-full bg-elevated border border-border-strong" />
                          <span className="text-xs font-medium">{product.toLowerCase().replace(/\s+/g, "")}</span>
                          <span className="text-[10px] text-muted">Sponsored</span>
                          <Badge tone="accent" className="ml-auto">Creative {v.label}</Badge>
                        </div>
                        <div className={cn("relative rounded-md overflow-hidden bg-elevated", frame.ratio)}>
                          <img src={v.visual} alt={`Creative ${v.label}`} className="size-full object-cover" />
                          {["story", "reel", "short"].includes(format) && (
                            <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow"><p className="text-sm font-bold leading-tight">{v.headline}</p></div>
                          )}
                          {exporting[v.id] !== undefined && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end p-3"><ProgressBar value={exporting[v.id]} label="Exporting" /></div>
                          )}
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <p className="text-sm font-semibold leading-snug">{v.headline}</p>
                        <p className="text-[13px] text-text2 mt-1 line-clamp-3">{v.primaryText}</p>
                        <span className="inline-flex mt-3 h-8 items-center px-3 rounded-sm bg-elevated border border-border-strong text-xs font-medium">{v.cta}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 px-2 py-2 border-t border-border">
                        <IconButton label="Edit" size="sm" onClick={() => setEditing(v)}><Pencil /></IconButton>
                        <IconButton label="Duplicate" size="sm" onClick={() => duplicate(v)}><Copy /></IconButton>
                        <IconButton label={saved.includes(v.id) ? "Saved" : "Save"} size="sm" active={saved.includes(v.id)} onClick={() => save(v)}><Save className={cn(saved.includes(v.id) && "text-success")} /></IconButton>
                        <IconButton label="Export" size="sm" disabled={exporting[v.id] !== undefined} onClick={() => void exportOne(v)}><Download /></IconButton>
                      </div>
                    </article>
                  ))}
            </div>
          </div>
        )}
      </Canvas>

      {editing && <EditModal key={editing.id} variation={editing} onClose={() => setEditing(null)} onApply={applyEdit} />}
    </>
  );
}

function EditModal({ variation, onClose, onApply }: { variation: AdVariation; onClose: () => void; onApply: (p: Pick<AdVariation, "headline" | "primaryText" | "cta">) => void }) {
  const [headline, setHeadline] = useState(variation.headline);
  const [primaryText, setPrimaryText] = useState(variation.primaryText);
  const [cta, setCta] = useState(variation.cta);
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit Creative ${variation.label}`}
      description="Changes apply to this variation only."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onApply({ headline, primaryText, cta })}>Apply changes</Button></>}
    >
      <div className="grid md:grid-cols-[140px_1fr] gap-4">
        <img src={variation.visual} alt="" className="hidden md:block w-full aspect-[4/5] object-cover rounded-md border border-border" />
        <div className="space-y-3">
          <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          <Textarea label="Primary text" value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} rows={4} />
          <Input label="CTA" value={cta} onChange={(e) => setCta(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
