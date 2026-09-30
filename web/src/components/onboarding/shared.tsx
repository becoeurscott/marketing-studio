"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Media generated with Sokozia (Higgsfield): style photos and UGC videos. */
export const MEDIA = {
  photos: [
    "/styles/porte-mannequin.jpg",
    "/styles/marche-africain.jpg",
    "/styles/statut-whatsapp.jpg",
    "/styles/luxe-dore.jpg",
  ],
  videos: [
    "/showcase/ugc/temoignage-karite.mp4",
    "/showcase/ugc/vendeuse-marche-wax.mp4",
    "/showcase/ugc/grwm-perruque.mp4",
    "/showcase/ugc/promo-tabaski.mp4",
  ],
};

export interface ProductInfo {
  name: string;
  category: string;
  description: string;
  image: string;
  sample: boolean;
}

export const SAMPLE_PRODUCT: ProductInfo = {
  name: "Beurre de karité pur",
  category: "Soin · Cosmétiques",
  description: "Beurre de karité 100 % naturel, 250 g, hydrate et nourrit la peau.",
  image: MEDIA.photos[0],
  sample: true,
};

export const GENERIC_DETECTED = {
  name: "Mon produit",
  category: "Produit · E-commerce",
  description: "Un produit au design soigné, prêt à briller dans vos campagnes.",
};

export function Video({ src, className }: { src: string; className?: string }) {
  return <video src={src} autoPlay muted loop playsInline className={cn("size-full object-cover", className)} />;
}

export function Img({ src, alt = "", className }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt} className={cn("size-full object-cover", className)} />;
}

/** Small product thumbnail composited over a generated visual. */
export function ProductBadge({ product, className }: { product: ProductInfo; className?: string }) {
  return (
    <div className={cn("absolute size-12 rounded-lg overflow-hidden border-2 border-white/80 shadow-lg bg-card", className ?? "bottom-2 right-2")}>
      <Img src={product.image} alt={product.name} />
    </div>
  );
}

export function ScreenTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="text-center mb-6">
      {eyebrow && <p className="text-xs uppercase tracking-[0.18em] text-highlight mb-2">{eyebrow}</p>}
      <h1 className="text-[26px] md:text-4xl font-semibold tracking-tight leading-tight text-balance">{title}</h1>
      {subtitle && <p className="text-text2 mt-2 text-[15px] text-balance">{subtitle}</p>}
    </div>
  );
}

/** Staggered fade-in helper that respects reduced motion. */
export function Appear({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

/** Large selectable card. */
export function OptionCard({
  selected, onClick, children, className,
}: { selected?: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative text-left rounded-2xl border p-4 transition-all duration-150",
        selected ? "bg-accent/12 border-accent/70 shadow-glow" : "bg-surface border-border-strong hover:border-white/25",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Bottom CTA bar (sticky on mobile). */
export function CtaBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 inset-x-0 mt-8 -mx-5 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-bg via-bg/95 to-transparent md:static md:mx-0 md:px-0 md:bg-none">
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">{children}</div>
    </div>
  );
}
