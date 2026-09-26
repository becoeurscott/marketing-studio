"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Higgsfield Marketing Studio preview assets (same as landing/Creative.tsx). */
export const MEDIA = {
  photos: [
    "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shots-people/834bb6b2-3a9b-48dd-9889-6934c765ccc2.webp",
    "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shot/941ef07a-c2ab-5a0e-ac67-4e6c762c8ef2.webp",
    "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shots-people/862de749-aa5c-4816-b028-7e254d969759.webp",
    "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shot/36052145-6b41-51f2-95c1-7a0f0393a112.webp",
  ],
  videos: [
    "https://cdn.higgsfield.ai/marketing-studio-motion-preview/458431c6-813b-42b2-9adc-bbf380d8c106.mp4",
    "https://cdn.higgsfield.ai/marketing-studio-motion-preview/18bbd999-1cf7-429d-9e1d-67acf7d8769f.mp4",
    "https://cdn.higgsfield.ai/marketing-studio-motion-preview/353daae1-e520-486b-b7d5-83f026169305.mp4",
    "https://cdn.higgsfield.ai/marketing-studio-motion-preview/aef59e19-f388-4dcc-b55a-e43a5c48c835.mp4",
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
  name: "Luma Glow Serum",
  category: "Soin · Beauté",
  description: "Un sérum éclat léger qui illumine le teint dès la première application.",
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
