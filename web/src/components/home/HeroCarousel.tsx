"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Slide { title: string; subtitle: string; image: string; href?: string; cta?: string }

const SLIDES: Slide[] = [
  { title: "Studio IA", subtitle: "Photos, vidéos UGC et pubs générées pour votre marque", image: "/banners/studio.jpg", href: "/studio", cta: "Ouvrir" },
  { title: "Shooting produit", subtitle: "Mettez votre produit en scène avec l'IA", image: "/banners/shooting.jpg", href: "/studio/product-shoot", cta: "Essayer" },
  { title: "Vidéos UGC", subtitle: "Créez des vidéos avec des créateurs IA réalistes", image: "/banners/ugc.jpg", href: "/studio/ugc", cta: "Créer" },
  { title: "Multi-modèles IA", subtitle: "Standard, HD, Nano Banana Pro, Éco — choisissez votre style", image: "/banners/models.jpg" },
  { title: "75 templates", subtitle: "Publicités prêtes à poster pour tous les réseaux sociaux", image: "/banners/templates.jpg", href: "/studio/ads", cta: "Explorer" },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [index]);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
        {SLIDES.map((s, i) => {
          const body = (
            <>
              <Image src={s.image} alt="" fill priority={i === 0} sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white">
                <h3 className="text-xl sm:text-2xl font-bold">{s.title}</h3>
                <p className="text-sm text-white/80 max-w-md">{s.subtitle}</p>
                {s.cta && <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-highlight">{s.cta} <ArrowRight className="size-3.5" /></span>}
              </div>
            </>
          );
          const cls = cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "opacity-0 pointer-events-none");
          return s.href ? (
            <Link key={s.title} href={s.href} className={cls} aria-hidden={i !== index} tabIndex={i === index ? 0 : -1}>{body}</Link>
          ) : (
            <div key={s.title} className={cls} aria-hidden={i !== index}>{body}</div>
          );
        })}
      </div>
      <div className="flex justify-center gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Afficher ${s.title}`}
            onClick={() => setIndex(i)}
            className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-accent" : "w-1.5 bg-muted/40")}
          />
        ))}
      </div>
    </div>
  );
}
