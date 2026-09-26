"use client";

import { Camera, Download, ImagePlus, Loader2, Megaphone, RefreshCw, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, type DragEvent } from "react";
import { Canvas, ControlField, ErrorState, ProductPicker, ResultImageCard, StudioControls } from "@/components/creative";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { generateProductShoot, uploadProduct, type ImageResult } from "@/lib/api";
import { useTemplatePreset } from "@/components/studio/useTemplatePreset";
import { useStore } from "@/lib/store";
import { CREDIT_COSTS, type Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

const ENVIRONMENTS = ["Salle de bain de luxe", "Cuisine moderne", "Plage", "Bureau", "Rue", "Studio", "Restaurant", "Salle de sport", "Intérieur de voiture"];
const LIGHTING = ["Naturelle", "Heure dorée", "Studio", "Néon", "Softbox", "Dramatique"];
const CAMERAS = ["Gros plan", "Plan moyen", "Plan large", "Macro"];

type Phase = { kind: "idle" } | { kind: "loading" } | { kind: "done"; results: ImageResult[] } | { kind: "error"; error: unknown };

export default function ProductShootPage() {
  const router = useRouter();
  const toast = useToast();
  const assets = useStore((s) => s.assets);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addAsset = useStore((s) => s.addAsset);

  const [productId, setProductId] = useState<string | null>(null);
  const { template, preset } = useTemplatePreset("product-shoot");
  const [environment, setEnvironment] = useState(() => (preset?.style === "Studio" ? "Studio" : ENVIRONMENTS[0]));
  const [lighting, setLighting] = useState(() => (preset?.style === "Studio" ? "Studio" : LIGHTING[0]));
  const [camera, setCamera] = useState(CAMERAS[1]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [selected, setSelected] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, string>>({}); // resultId → assetId
  const [uploading, setUploading] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const product = useMemo(() => assets.find((a) => a.id === productId) ?? null, [assets, productId]);
  const loading = phase.kind === "loading";

  async function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setUploading(0);
    try {
      const asset = await uploadProduct({ name: f.name, size: f.size, projectId: currentProjectId }, setUploading);
      setProductId(asset.id);
      toast.success("Produit importé", asset.name);
    } catch {
      toast.error("Échec de l'import", "Veuillez réessayer.");
    } finally {
      setUploading(null);
    }
  }
  function onDrop(e: DragEvent) { e.preventDefault(); setDrag(false); void handleFiles(e.dataTransfer.files); }

  async function generate() {
    if (!product) { toast.error("Importez ou choisissez d'abord une photo produit"); return; }
    setPhase({ kind: "loading" });
    setSelected(null);
    try {
      const results = await generateProductShoot({ productUrl: product.url, environment, lighting, camera, projectId: currentProjectId });
      setPhase({ kind: "done", results });
      setSelected(results[0]?.id ?? null);
      toast.success("Shooting produit prêt", `${results.length} photos · ${environment}`);
    } catch (error) {
      setPhase({ kind: "error", error });
    }
  }

  function save(r: ImageResult): Asset {
    const existing = saved[r.id] && assets.find((a) => a.id === saved[r.id]);
    if (existing) return existing;
    const asset = addAsset({ name: `${product?.name ?? "Produit"} — ${environment}`, type: "image", url: r.url, thumbnail: r.thumbnail, projectId: currentProjectId, favorite: favorites.includes(r.id), width: 1600, height: 2000, sizeKb: 1400, tags: ["product-shoot", environment.toLowerCase(), lighting.toLowerCase(), camera.toLowerCase()] });
    setSaved((s) => ({ ...s, [r.id]: asset.id }));
    return asset;
  }
  function download(r: ImageResult) { toast.success("Téléchargement lancé", `${environment} · ${camera}.png`); void r; }
  function addToCampaign(r: ImageResult) { const a = save(r); router.push(`/campaigns?asset=${a.id}`); }
  function saveAll() {
    if (phase.kind !== "done") return;
    phase.results.forEach(save);
    toast.success("Enregistré dans le projet", `${phase.results.length} photos ajoutées aux ressources`);
  }

  const controls = (
    <>
      <ControlField label="Photo produit" hint={product?.name}>
        <ProductPicker value={productId} onChange={(a) => setProductId(a.id)} />
      </ControlField>
      <ControlField label="Environment">
        <ChipGroup size="sm" options={ENVIRONMENTS.map((e) => ({ value: e, label: e }))} value={environment} onChange={setEnvironment} />
      </ControlField>
      <ControlField label="Éclairage">
        <ChipGroup size="sm" options={LIGHTING.map((l) => ({ value: l, label: l }))} value={lighting} onChange={setLighting} />
      </ControlField>
      <ControlField label="Cadrage">
        <ChipGroup size="sm" options={CAMERAS.map((c) => ({ value: c, label: c }))} value={camera} onChange={setCamera} />
      </ControlField>
    </>
  );

  return (
    <>
      <PageHeader title="Shooting produit IA" description="Une photo produit en entrée. Une série complète de scènes fidèles à votre marque en sortie." eyebrow={<div className="flex flex-wrap items-center gap-1.5"><Badge tone="accent">Studio · Shooting produit</Badge>{template && <Badge tone="outline">Modèle · {template.title}</Badge>}</div>} />
      <StudioControls title="Paramètres du shooting" controls={controls} generateLabel={phase.kind === "done" ? "Régénérer" : "Générer le shooting"} generateIcon={Camera} onGenerate={generate} loading={loading} disabled={!product} cost={CREDIT_COSTS["product-shoot"]} />

      <Canvas>
        {phase.kind === "error" ? (
          <ErrorState error={phase.error} onRetry={generate} />
        ) : phase.kind === "idle" && !product ? (
          /* Upload zone */
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={cn("w-full max-w-lg rounded-2xl border-2 border-dashed p-10 text-center transition-colors", drag ? "border-accent bg-accent/10" : "border-border-strong")}
            >
              <span className="mx-auto size-14 rounded-full bg-accent/15 text-highlight flex items-center justify-center mb-4">{uploading !== null ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}</span>
              <h3 className="text-lg font-semibold">{uploading !== null ? `Import… ${uploading} %` : "Déposez l'image produit ici"}</h3>
              <p className="text-sm text-text2 mt-1">PNG ou JPG, un seul produit ; un fond uni donne les meilleurs résultats.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                <Button leftIcon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()} loading={uploading !== null}>Importer un produit</Button>
                <Button variant="secondary" onClick={() => { const first = assets.find((a) => a.type === "image"); if (first) setProductId(first.id); }}>Choisir dans les ressources</Button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-6 pb-28 lg:pb-6">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {product && <img src={product.thumbnail} alt={product.name} className="size-12 rounded-md object-cover border border-border" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{product?.name}</p>
                <p className="text-xs text-text2">{environment} · {lighting} · {camera}</p>
              </div>
              {phase.kind === "done" && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" leftIcon={<Save className="size-4" />} onClick={saveAll}>Tout enregistrer</Button>
                  <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={generate}>Régénérer</Button>
                </div>
              )}
            </div>

            {phase.kind === "loading" ? (
              <div>
                <p className="text-sm text-text2 mb-3 flex items-center gap-2"><Loader2 className="size-4 animate-spin text-highlight" /> Création de vos visuels…</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}</div>
              </div>
            ) : phase.kind === "done" ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {phase.results.map((r, i) => (
                    <ResultImageCard
                      key={r.id} src={r.thumbnail} alt={`Photo ${i + 1}`} badge={`${i + 1} / ${phase.results.length}`}
                      selected={selected === r.id} favorite={favorites.includes(r.id)} saved={!!saved[r.id]}
                      onSelect={() => setSelected(r.id)}
                      onFavorite={() => setFavorites((f) => (f.includes(r.id) ? f.filter((x) => x !== r.id) : [...f, r.id]))}
                      onDownload={() => download(r)}
                      onSave={() => { save(r); toast.success("Enregistré dans le projet"); }}
                      onUse={() => addToCampaign(r)}
                    />
                  ))}
                </div>
                {selected && (() => { const r = phase.results.find((x) => x.id === selected)!; return (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
                    <p className="text-sm text-text2 flex-1 min-w-0">Photo {phase.results.indexOf(r) + 1} sélectionnée</p>
                    <Button size="sm" variant="secondary" leftIcon={<Download className="size-4" />} onClick={() => download(r)}>Télécharger</Button>
                    <Button size="sm" variant="secondary" leftIcon={<Save className="size-4" />} onClick={() => { save(r); toast.success("Enregistré dans le projet"); }}>{saved[r.id] ? "Enregistré" : "Enregistrer dans le projet"}</Button>
                    <Button size="sm" leftIcon={<Megaphone className="size-4" />} onClick={() => addToCampaign(r)}>Utiliser dans une campagne</Button>
                  </div>
                ); })()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
                <div className="w-40 aspect-[4/5] rounded-lg overflow-hidden border border-border-strong shadow-float"><img src={product!.thumbnail} alt="" className="size-full object-cover" /></div>
                <p className="text-sm text-text2 max-w-xs">Choisissez un environnement, un éclairage et un cadrage, puis générez six photos.</p>
                <Button leftIcon={<Camera className="size-4" />} onClick={generate}>Générer le shooting · {CREDIT_COSTS["product-shoot"]} cr.</Button>
              </div>
            )}
          </div>
        )}
      </Canvas>
    </>
  );
}
