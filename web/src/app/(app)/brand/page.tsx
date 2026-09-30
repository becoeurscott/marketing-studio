"use client";

import { Check, ExternalLink, ImagePlus, MessageSquareQuote, Palette, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { BrandEditModal, industryLabel, toneLabel, type BrandSection } from "@/components/account/BrandEditModal";
import { ConfirmModal } from "@/components/account/ConfirmModal";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { selectCurrentBrand, useStore } from "@/lib/store";
import type { Brand, BrandAsset } from "@/lib/types";
import { uploadPhoto } from "@/lib/higgsfield/client";
import { cn, uid } from "@/lib/utils";

const ASSET_KINDS: { kind: BrandAsset["kind"]; label: string; hint: string }[] = [
  { kind: "primary-logo", label: "Logo principal", hint: "Logotype sur fond clair et sombre." },
  { kind: "icon", label: "Icône", hint: "Symbole carré pour avatars et favicons." },
  { kind: "product", label: "Images produit", hint: "Visuels principaux et packshots utilisés dans les générations." },
];

export default function BrandPage() {
  const brands = useStore((s) => s.brands);
  const brand = useStore(selectCurrentBrand);
  const setCurrentBrand = useStore((s) => s.setCurrentBrand);
  const addBrand = useStore((s) => s.addBrand);
  const deleteBrand = useStore((s) => s.deleteBrand);
  const updateBrand = useStore((s) => s.updateBrand);
  const toast = useToast();

  const [section, setSection] = useState<BrandSection | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Brand | null>(null);
  const [removingAsset, setRemovingAsset] = useState<BrandAsset | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const pendingKind = useRef<BrandAsset["kind"]>("product");
  const [uploading, setUploading] = useState(false);

  /** Opens the file picker; the chosen image is uploaded and becomes usable in generations. */
  const addAsset = (kind: BrandAsset["kind"]) => {
    pendingKind.current = kind;
    fileRef.current?.click();
  };
  const onFile = async (file: File | null) => {
    if (!brand || !file) return;
    const kind = pendingKind.current;
    const label = ASSET_KINDS.find((k) => k.kind === kind)?.label ?? kind;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      const asset: BrandAsset = { id: uid("ba"), kind, name: file.name || `${brand.name} ${label.toLowerCase()}`, url };
      updateBrand(brand.id, { assets: [...brand.assets, asset], ...(kind === "primary-logo" && !brand.logoUrl ? { logoUrl: url } : {}) });
      toast.success("Ressource importée", asset.name);
    } catch (err) {
      toast.error("Échec de l'import", err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(false);
    }
  };
  const fileInput = <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-hidden tabIndex={-1} onChange={(e) => { void onFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />;

  if (!brand) {
    return (
      <>
        <PageHeader title="Kit de marque" description="Logo, couleurs, polices et ton : tout ce dont l’IA a besoin pour respecter votre marque." />
        <EmptyState icon={Palette} title="Aucune marque pour le moment" description="Créez un kit de marque pour que chaque génération reflète votre identité." cta={{ label: "Ajouter une marque", onClick: () => setAdding(true) }} />
        <NewBrandModal open={adding} onClose={() => setAdding(false)} onCreate={(name) => { const b = addBrand({ name }); toast.success("Marque créée", b.name); }} />
      </>
    );
  }

  return (
    <>
      {fileInput}
      <PageHeader
        title="Kit de marque"
        description="Logo, couleurs, polices et ton : tout ce dont l’IA a besoin pour respecter votre marque."
        actions={
          <>
            <Link href="/brand/voice"><Button variant="secondary" leftIcon={<MessageSquareQuote className="size-4" />}>Ton de marque</Button></Link>
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setAdding(true)}>Ajouter une marque</Button>
          </>
        }
      />

      {/* Brand switcher */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-0.5 mb-6">
        {brands.map((b) => {
          const active = b.id === brand.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setCurrentBrand(b.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors",
                active ? "bg-accent/15 border-accent/60 text-text" : "bg-surface border-border-strong text-text2 hover:text-text",
              )}
            >
              <img src={b.logoUrl} alt="" className="size-7 rounded-full object-cover" />
              {b.name}
              {active && <Check className="size-3.5 text-highlight" />}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="space-y-6">
          {/* Identity card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 flex">
              {brand.colors.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-2">
              <img src={brand.logoUrl} alt={`Logo ${brand.name}`} className="size-20 rounded-xl object-cover border border-border bg-elevated shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight truncate">{brand.name}</h2>
                    {brand.website ? (
                      <a href={brand.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-text2 hover:text-text mt-0.5">
                        {brand.website.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
                      </a>
                    ) : <p className="text-[13px] text-muted mt-0.5">Aucun site web</p>}
                    <p className="text-[13px] text-text2 mt-0.5">WhatsApp : {brand.whatsapp || <span className="text-muted">à ajouter pour vos boutons de commande</span>}</p>
                  </div>
                  <IconButton label="Modifier l’identité" size="sm" variant="outline" onClick={() => setSection("identity")}><Pencil /></IconButton>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {brand.industry && <Badge tone="accent">{industryLabel(brand.industry)}</Badge>}
                  {brand.styleTags.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}
                </div>
              </div>
            </div>
          </Card>

          {/* Positioning */}
          <Card>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-[15px] font-semibold">Positionnement</h3>
              <IconButton label="Modifier le positionnement" size="sm" variant="outline" onClick={() => setSection("details")}><Pencil /></IconButton>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-muted mb-1">Description</dt>
                <dd className="text-text2 leading-relaxed">{brand.description || <span className="text-muted">Ajoutez une courte description de la marque.</span>}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted mb-1">Secteur</dt>
                <dd>{(brand.industry && industryLabel(brand.industry)) || <span className="text-muted">—</span>}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted mb-1">Audience</dt>
                <dd>{brand.audience || <span className="text-muted">—</span>}</dd>
              </div>
            </dl>
          </Card>

          {/* Assets */}
          <Section title="Ressources de marque" description="Utilisées comme références pour générer images, vidéos et publicités.">
            <div className="space-y-4">
              {ASSET_KINDS.map(({ kind, label, hint }) => {
                const items = brand.assets.filter((a) => a.kind === kind);
                return (
                  <Card key={kind}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-semibold">{label}</h4>
                        <p className="text-[12px] text-muted">{hint}</p>
                      </div>
                      <Button size="sm" variant="secondary" leftIcon={<ImagePlus className="size-4" />} loading={uploading} onClick={() => addAsset(kind)}>Importer</Button>
                    </div>
                    {items.length ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {items.map((a) => (
                          <div key={a.id} className="group relative">
                            <div className={cn("rounded-md overflow-hidden border border-border bg-elevated", kind === "primary-logo" ? "aspect-[2/1]" : "aspect-square")}>
                              <img src={a.url} alt={a.name} className="size-full object-cover" />
                            </div>
                            <p className="text-[11px] text-text2 mt-1.5 truncate" title={a.name}>{a.name}</p>
                            <IconButton label="Supprimer la ressource" size="sm" className="absolute top-1.5 right-1.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => setRemovingAsset(a)}><Trash2 /></IconButton>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState compact icon={ImagePlus} title={`Aucun élément « ${label.toLowerCase()} » pour le moment`} cta={{ label: "Importer", onClick: () => addAsset(kind) }} />
                    )}
                  </Card>
                );
              })}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          {/* Colors */}
          <Card>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-[15px] font-semibold">Couleurs</h3>
              <IconButton label="Modifier les couleurs" size="sm" variant="outline" onClick={() => setSection("colors")}><Pencil /></IconButton>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {brand.colors.map((c, i) => (
                <div key={i} className="min-w-0">
                  <div className="aspect-square rounded-md border border-white/10" style={{ background: c }} />
                  <p className="text-[10px] font-mono text-muted mt-1 truncate uppercase">{c}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Fonts */}
          <Card>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-[15px] font-semibold">Typographie</h3>
              <IconButton label="Modifier les polices" size="sm" variant="outline" onClick={() => setSection("fonts")}><Pencil /></IconButton>
            </div>
            <div className="space-y-3">
              <div className="rounded-md bg-surface border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Titres · {brand.fonts.heading}</p>
                <p className="text-lg font-bold tracking-tight mt-1" style={{ fontFamily: brand.fonts.heading }}>Un éclat qui se voit</p>
              </div>
              <div className="rounded-md bg-surface border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Texte · {brand.fonts.body}</p>
                <p className="text-sm text-text2 mt-1" style={{ fontFamily: brand.fonts.body }}>Des soins sains et validés par la science pour votre routine quotidienne.</p>
              </div>
            </div>
          </Card>

          {/* Voice summary */}
          <Card>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-[15px] font-semibold">Ton</h3>
              <Link href="/brand/voice" className="text-[13px] text-highlight hover:underline">Modifier</Link>
            </div>
            <Badge tone="accent">{toneLabel(brand.voice.tone)}</Badge>
            <p className="text-[13px] text-text2 mt-2 leading-relaxed">{brand.voice.writingStyle || <span className="text-muted">Décrivez la façon dont la marque s’exprime.</span>}</p>
          </Card>

          <Button variant="danger" fullWidth leftIcon={<Trash2 className="size-4" />} onClick={() => setDeleting(brand)} disabled={brands.length <= 1}>
            Supprimer la marque
          </Button>
          {brands.length <= 1 && <p className="text-[11px] text-muted text-center">Vous devez conserver au moins une marque.</p>}
        </div>
      </div>

      <BrandEditModal brand={brand} section={section} onClose={() => setSection(null)} />
      <NewBrandModal open={adding} onClose={() => setAdding(false)} onCreate={(name) => { const b = addBrand({ name }); toast.success("Marque créée", b.name); }} />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        title="Supprimer la marque ?"
        description={`« ${deleting?.name} » ainsi que ses ressources et son ton seront supprimés.`}
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleting) { deleteBrand(deleting.id); toast.info("Marque supprimée", deleting.name); } setDeleting(null); }}
      />
      <ConfirmModal
        open={!!removingAsset}
        onClose={() => setRemovingAsset(null)}
        danger
        title="Supprimer la ressource ?"
        description={removingAsset?.name}
        confirmLabel="Supprimer"
        onConfirm={() => { if (removingAsset) { updateBrand(brand.id, { assets: brand.assets.filter((a) => a.id !== removingAsset.id) }); toast.info("Ressource supprimée"); } setRemovingAsset(null); }}
      />
    </>
  );
}

function NewBrandModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Ajouter une marque" description="Vous pourrez renseigner les couleurs, les polices et le ton ensuite.">
      <NewBrandForm key={String(open)} onClose={onClose} onCreate={onCreate} />
    </Modal>
  );
}

function NewBrandForm({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!name.trim()) { setError("Donnez un nom à la marque."); return; } onCreate(name.trim()); onClose(); }}
      className="space-y-4"
    >
      <Input label="Nom de la marque" name="brandName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Karité d'Or" error={error} autoFocus />
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
        <Button type="submit">Créer la marque</Button>
      </div>
    </form>
  );
}
