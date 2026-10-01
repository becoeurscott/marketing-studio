"use client";

import { Copy, Download, Megaphone, MessageCircle, Pencil, RefreshCw, Save, Sparkles } from "lucide-react";
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
import { Toggle } from "@/components/account/Toggle";
import { CURRENCIES, countryOf, formatMoney, whatsappLink } from "@/lib/market";
import { selectCountry, selectCurrentBrand, useStore } from "@/lib/store";
import { CREDIT_COSTS, PLATFORMS, type AdFormat, type AdVariation, type Platform } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const FORMATS: { value: AdFormat; label: string }[] = [
  { value: "status", label: "Statut WhatsApp" }, { value: "catalog", label: "Fiche catalogue" }, { value: "flyer", label: "Flyer / affiche" },
  { value: "image", label: "Image" }, { value: "video", label: "Vidéo" }, { value: "carousel", label: "Carrousel" },
  { value: "story", label: "Story" }, { value: "reel", label: "Reel" }, { value: "short", label: "Short" },
];
const formatLabel = (f: AdFormat) => FORMATS.find((x) => x.value === f)?.label ?? f;

/** Frame aspect + chrome per platform/format. */
function frameFor(platform: Platform, format: AdFormat): { ratio: string; label: string } {
  if (format === "flyer") return { ratio: "aspect-[1/1.414]", label: "A4 / A5" };
  if (format === "catalog") return { ratio: "aspect-square", label: "1:1" };
  if (["story", "reel", "short", "status"].includes(format) || platform === "tiktok" || platform === "whatsapp") return { ratio: "aspect-[9/16]", label: "9:16" };
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

  const brand = useStore(selectCurrentBrand);
  const country = countryOf(useStore(selectCountry));
  const currency = CURRENCIES[country.currency];

  const { template, preset } = useTemplatePreset("ads");
  const [platform, setPlatform] = useState<Platform>(preset?.platform ?? "whatsapp");
  const [format, setFormat] = useState<AdFormat>(preset?.format ?? "status");
  const [product, setProduct] = useState("Pagne wax 6 yards");
  const [price, setPrice] = useState("15000");
  const [offer, setOffer] = useState("Livraison offerte cette semaine");
  const [audience, setAudience] = useState("Femmes 25–45 ans");
  const [cta, setCta] = useState("Commander sur WhatsApp");
  const [waButton, setWaButton] = useState(true);
  const [waNumber, setWaNumber] = useState(brand?.whatsapp ?? `+${country.dialCode} `);
  const priceLabel = price.trim() ? formatMoney(Number(price.replace(/\D/g, "")) || 0, country.currency) : "";
  const orderLink = whatsappLink(waNumber, `Bonjour, je souhaite commander : ${product}${priceLabel ? ` (${priceLabel})` : ""}. J'ai vu votre publicité.`);
  const waReady = waNumber.replace(/\D/g, "").length >= 8;
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [variations, setVariations] = useState<AdVariation[]>([]);
  const [editing, setEditing] = useState<AdVariation | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [exporting, setExporting] = useState<Record<string, number>>({});

  const loading = phase.kind === "loading";
  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  async function generate() {
    if (!product.trim()) { toast.error("Ajoutez d'abord un nom de produit"); return; }
    setPhase({ kind: "loading" });
    try {
      const results = await generateAds({ platform, format, product, offer, audience, cta, price: priceLabel || undefined, projectId: currentProjectId });
      setVariations(results);
      setSaved([]);
      setPhase({ kind: "done" });
      toast.success("4 variantes prêtes", `${platformLabel} · ${formatLabel(format)}`);
    } catch (error) {
      setPhase({ kind: "error", error });
    }
  }

  function duplicate(v: AdVariation) {
    const copy: AdVariation = { ...v, id: uid("var"), headline: `${v.headline} (copie)` };
    setVariations((list) => { const i = list.findIndex((x) => x.id === v.id); return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]; });
    toast.info("Variante dupliquée", `Création ${v.label}`);
  }
  function save(v: AdVariation) {
    if (saved.includes(v.id)) { toast.info("Déjà enregistrée"); return; }
    addAsset({ name: `Pub ${v.label} — ${product} (${platformLabel})`, type: "image", url: v.visual, thumbnail: v.visual, projectId: currentProjectId, favorite: false, width: 800, height: 1000, sizeKb: 960, tags: ["ad", platform, format] });
    addGeneration({ type: "ad", prompt: `${v.headline} — ${v.primaryText}`, status: "completed", thumbnails: [v.visual], projectId: currentProjectId, params: { platform, format, cta: v.cta, label: v.label }, creditsUsed: 0 });
    setSaved((s) => [...s, v.id]);
    toast.success("Enregistrée", `Création ${v.label} ajoutée aux ressources et à l'historique`);
  }
  async function exportOne(v: AdVariation) {
    setExporting((e) => ({ ...e, [v.id]: 0 }));
    toast.info("Export lancé", `Création ${v.label} · ${format === "video" ? "MP4" : "PNG"}`);
    try {
      await exportAssets({ assetIds: [v.id], format: format === "video" ? "mp4" : "png", quality: "high" }, (pct) => setExporting((e) => ({ ...e, [v.id]: pct })));
      toast.success("Export terminé", `La création ${v.label} est prête à être téléchargée.`);
    } catch {
      toast.error("Échec de l'export", "Veuillez réessayer.");
    } finally {
      setExporting((e) => { const n = { ...e }; delete n[v.id]; return n; });
    }
  }
  function applyEdit(patch: Pick<AdVariation, "headline" | "primaryText" | "cta">) {
    if (!editing) return;
    setVariations((list) => list.map((v) => (v.id === editing.id ? { ...v, ...patch } : v)));
    setEditing(null);
    toast.success("Variante mise à jour");
  }

  const frame = frameFor(platform, format);

  const controls = (
    <>
      <ControlField label="Plateforme">
        <ChipGroup size="sm" options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))} value={platform} onChange={setPlatform} />
      </ControlField>
      <ControlField label="Format">
        <ChipGroup size="sm" options={FORMATS} value={format} onChange={setFormat} />
      </ControlField>
      <Input label="Produit" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Pagne wax 6 yards" />
      <Input label={`Prix affiché sur le visuel (${currency.symbol})`} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="15000" hint={priceLabel ? `Affiché : ${priceLabel}` : "Laissez vide pour ne pas afficher de prix."} />
      <Input label="Offre" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Livraison offerte cette semaine" />
      <Input label="Audience cible" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Femmes 25–45 ans" />
      <Input label="Appel à l'action" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Commander sur WhatsApp" />
      <div className="rounded-md border border-border bg-surface px-3">
        <Toggle label="Bouton « Commander sur WhatsApp »" description="Le client arrive dans votre discussion avec un message déjà rempli." checked={waButton} onChange={setWaButton} />
        {waButton && <Input className="pb-3" label="Votre numéro WhatsApp" inputMode="tel" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder={`+${country.dialCode} 07 00 00 00 00`} />}
      </div>
    </>
  );

  return (
    <>
      <PageHeader title="Créateur de pubs" description="Quatre variantes pour WhatsApp, Facebook, TikTok et les autres, avec votre prix et un bouton de commande." eyebrow={<div className="flex flex-wrap items-center gap-1.5"><Badge tone="accent">Studio · Pubs</Badge>{template && <Badge tone="outline">Modèle · {template.title}</Badge>}</div>} />
      <StudioControls title="Paramètres de la pub" controls={controls} generateLabel={phase.kind === "done" ? "Régénérer" : "Générer les pubs"} generateIcon={Sparkles} onGenerate={generate} loading={loading} cost={CREDIT_COSTS.ads} />

      <Canvas>
        {phase.kind === "error" ? (
          <ErrorState error={phase.error} onRetry={generate} />
        ) : phase.kind === "idle" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5 sm:p-8 gap-4 min-w-0">
            <span className="size-14 rounded-full bg-accent/15 text-highlight flex items-center justify-center"><Megaphone className="size-6" /></span>
            <div>
              <h3 className="text-lg font-semibold">Prêt à créer vos pubs {platformLabel} · {formatLabel(format)}</h3>
              <p className="text-sm text-text2 mt-1 max-w-sm">{product} · {offer} · {audience} · &ldquo;{cta}&rdquo;</p>
            </div>
            <Button className="max-w-full min-w-0" leftIcon={<Sparkles className="size-4 shrink-0" />} onClick={generate}><span className="truncate">Générer 4 variantes · {CREDIT_COSTS.ads} cr.</span></Button>
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-6 pb-28 lg:pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge tone="outline">{platformLabel}</Badge><Badge tone="outline">{formatLabel(format)}</Badge><Badge tone="outline">{frame.label}</Badge>
              <span className="flex-1" />
              {phase.kind === "done" && <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={generate}>Régénérer</Button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3"><Skeleton className={cn("w-full rounded-lg", frame.ratio)} /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div>
                  ))
                : variations.map((v) => (
                    <article key={v.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
                      {/* Platform-aware frame */}
                      <div className="p-3 pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="size-6 shrink-0 rounded-full bg-elevated border border-border-strong" />
                          <span className="text-xs font-medium min-w-0 truncate">{product.toLowerCase().replace(/\s+/g, "")}</span>
                          <span className="hidden sm:inline shrink-0 text-[10px] text-muted">Sponsorisé</span>
                          <Badge tone="accent" className="ml-auto shrink-0">Création {v.label}</Badge>
                        </div>
                        <div className={cn("relative rounded-md overflow-hidden bg-elevated", frame.ratio)}>
                          <img src={v.visual} alt={`Création ${v.label}`} className="size-full object-cover" />
                          {priceLabel && (
                            <span className="absolute top-3 right-3 rotate-3 rounded-md bg-highlight px-2.5 py-1 text-sm font-extrabold text-on-accent shadow-lg tabular-nums">{priceLabel}</span>
                          )}
                          {["story", "reel", "short", "status", "flyer"].includes(format) && (
                            <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow"><p className="text-sm font-bold leading-tight">{v.headline}</p></div>
                          )}
                          {exporting[v.id] !== undefined && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end p-3"><ProgressBar value={exporting[v.id]} label="Export en cours" /></div>
                          )}
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <p className="text-sm font-semibold leading-snug">{v.headline}</p>
                        <p className="text-[13px] text-text2 mt-1 line-clamp-3">{v.primaryText}</p>
                        {waButton ? (
                          <a
                            href={waReady ? orderLink : undefined}
                            target="_blank"
                            rel="noreferrer"
                            aria-disabled={!waReady}
                            title={waReady ? "Tester le lien de commande" : "Ajoutez votre numéro WhatsApp"}
                            className={cn("inline-flex mt-3 h-8 items-center gap-1.5 px-3 rounded-full bg-[#25D366] text-black text-xs font-semibold", !waReady && "opacity-50 pointer-events-none")}
                          >
                            <MessageCircle className="size-3.5" /> Commander sur WhatsApp
                          </a>
                        ) : (
                          <span className="inline-flex mt-3 h-8 items-center px-3 rounded-sm bg-elevated border border-border-strong text-xs font-medium">{v.cta}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 px-2 py-2 border-t border-border">
                        <IconButton label="Modifier" size="sm" onClick={() => setEditing(v)}><Pencil /></IconButton>
                        <IconButton label="Dupliquer" size="sm" onClick={() => duplicate(v)}><Copy /></IconButton>
                        <IconButton label={saved.includes(v.id) ? "Enregistrée" : "Enregistrer"} size="sm" active={saved.includes(v.id)} onClick={() => save(v)}><Save className={cn(saved.includes(v.id) && "text-success")} /></IconButton>
                        <IconButton label="Exporter" size="sm" disabled={exporting[v.id] !== undefined} onClick={() => void exportOne(v)}><Download /></IconButton>
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
      title={`Modifier la création ${variation.label}`}
      description="Les modifications s'appliquent uniquement à cette variante."
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={() => onApply({ headline, primaryText, cta })}>Appliquer</Button></>}
    >
      <div className="grid md:grid-cols-[140px_1fr] gap-4">
        <img src={variation.visual} alt="" className="hidden md:block w-full aspect-[4/5] object-cover rounded-md border border-border" />
        <div className="space-y-3">
          <Input label="Titre" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          <Textarea label="Texte principal" value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} rows={4} />
          <Input label="Appel à l'action" value={cta} onChange={(e) => setCta(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
