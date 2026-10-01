"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ImagePlus, Loader2, Package, Pencil, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Appear, CtaBar, GENERIC_DETECTED, Img, MEDIA, SAMPLE_PRODUCT, ScreenTitle, Video, type ProductInfo,
} from "./shared";

/* 1. Opening */
export function OpeningScreen({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const reduce = useReducedMotion();
  const chain = [
    { label: "Photo produit", media: MEDIA.photos[0] },
    { label: "Vidéo UGC", media: MEDIA.videos[1], video: true },
    { label: "Pub", media: MEDIA.photos[1] },
    { label: "Post social", media: MEDIA.photos[2] },
  ];
  return (
    <div className="w-full max-w-3xl">
      <ScreenTitle
        title={<>Transformez une photo produit en <span className="text-highlight">campagne complète.</span></>}
        subtitle="Photos produit, vidéos UGC, pubs et textes, générés pour votre marque en quelques minutes."
      />
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 py-4">
        {chain.map((c, i) => (
          <motion.div
            key={c.label}
            className="flex items-center gap-2 md:gap-3"
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.2 + i * 0.25 }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-[56px] sm:w-[88px] md:w-[120px] aspect-[3/4] rounded-xl overflow-hidden border border-border-strong">
                {c.video ? <Video src={c.media} /> : <Img src={c.media} />}
              </div>
              <span className="text-[10px] md:text-xs text-text2 whitespace-nowrap">{c.label}</span>
            </div>
            <ArrowRight className="hidden sm:block size-3.5 text-muted shrink-0 -mt-5" />
          </motion.div>
        ))}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 1.3 }}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-[48px] sm:w-[72px] md:w-[96px] aspect-[3/4] rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-glow flex items-center justify-center text-on-accent text-lg md:text-2xl font-semibold">41</div>
          <span className="text-[10px] md:text-xs text-highlight">Campagne</span>
        </motion.div>
      </div>
      <CtaBar>
        <Button variant="ghost" size="lg" onClick={onLogin}>Passer, aller à mon espace</Button>
        <Button size="lg" onClick={onStart} rightIcon={<ArrowRight className="size-4" />}>Créer ma première campagne</Button>
      </CtaBar>
    </div>
  );
}

/* 2. Upload */
export function UploadScreen({ onPick }: { onPick: (p: ProductInfo) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const handle = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    onPick({ ...GENERIC_DETECTED, image: URL.createObjectURL(file), sample: false });
  };
  return (
    <div className="w-full max-w-lg">
      <ScreenTitle title="Que voulez-vous promouvoir ?" subtitle="Une seule photo suffit. Nous nous occupons du reste." />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
        className={cn(
          "w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors",
          drag ? "border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-white/25",
        )}
      >
        <span className="size-14 rounded-2xl bg-accent/15 flex items-center justify-center"><ImagePlus className="size-7 text-highlight" /></span>
        <span className="font-medium">Déposez la photo de votre produit</span>
        <span className="text-xs text-muted">JPG, PNG ou WEBP</span>
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <CtaBar>
        <Button variant="secondary" size="lg" leftIcon={<Package className="size-4" />} onClick={() => onPick(SAMPLE_PRODUCT)}>
          Utiliser un produit exemple
        </Button>
        <Button size="lg" leftIcon={<Upload className="size-4" />} onClick={() => input.current?.click()}>
          Choisir depuis l&apos;appareil
        </Button>
      </CtaBar>
    </div>
  );
}

/* 3. Analysis */
const CHECKS = [
  "Produit détecté",
  "Catégorie identifiée",
  "Caractéristiques visuelles analysées",
  "Composition comprise",
  "Opportunités créatives trouvées",
];

export function AnalysisScreen({
  product, onChange, onConfirm,
}: { product: ProductInfo; onChange: (p: ProductInfo) => void; onConfirm: () => void }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(reduce ? CHECKS.length : 0);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (done >= CHECKS.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 650);
    return () => clearTimeout(t);
  }, [done]);
  const finished = done >= CHECKS.length;

  if (!finished) {
    return (
      <div className="w-full max-w-sm">
        <div className="mx-auto w-40 aspect-square rounded-2xl overflow-hidden border border-border-strong relative mb-6">
          <Img src={product.image} alt={product.name} />
          {!reduce && (
            <motion.div
              className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-accent/50 to-transparent"
              animate={{ top: ["-20%", "100%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
        <p className="text-center font-medium mb-4 flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin text-highlight" /> Analyse du produit…
        </p>
        <ul className="space-y-2.5">
          {CHECKS.map((c, i) => (
            <li key={c} className={cn("flex items-center gap-2.5 text-sm transition-opacity", i < done ? "opacity-100" : "opacity-30")}>
              <span className={cn("size-5 rounded-full flex items-center justify-center", i < done ? "bg-success/20 text-success" : "bg-white/5")}>
                {i < done && <Check className="size-3" />}
              </span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <ScreenTitle title="Je l'ai trouvé." />
      <Appear className="rounded-2xl bg-surface border border-border-strong overflow-hidden">
        <div className="aspect-[4/3] bg-card"><Img src={product.image} alt={product.name} className="object-contain" /></div>
        <div className="p-4 space-y-2">
          {editing ? (
            <>
              <label className="block text-xs text-muted">Nom du produit
                <input value={product.name} onChange={(e) => onChange({ ...product, name: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md bg-card border border-border-strong px-3 text-sm text-text" />
              </label>
              <label className="block text-xs text-muted">Catégorie
                <input value={product.category} onChange={(e) => onChange({ ...product, category: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md bg-card border border-border-strong px-3 text-sm text-text" />
              </label>
              <label className="block text-xs text-muted">Description
                <textarea value={product.description} rows={2} onChange={(e) => onChange({ ...product, description: e.target.value })}
                  className="mt-1 w-full rounded-md bg-card border border-border-strong px-3 py-2 text-sm text-text" />
              </label>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">{product.name}</p>
              <p className="text-xs text-highlight">{product.category}</p>
              <p className="text-sm text-text2">{product.description}</p>
            </>
          )}
        </div>
      </Appear>
      <p className="text-center text-text2 mt-5">C&apos;est correct ?</p>
      <CtaBar>
        <Button variant="ghost" size="lg" leftIcon={<Pencil className="size-4" />} onClick={() => setEditing((e) => !e)}>
          {editing ? "Terminer la modification" : "Modifier les détails"}
        </Button>
        <Button size="lg" onClick={onConfirm} disabled={!product.name.trim()} rightIcon={<ArrowRight className="size-4" />}>C&apos;est bon</Button>
      </CtaBar>
    </div>
  );
}
