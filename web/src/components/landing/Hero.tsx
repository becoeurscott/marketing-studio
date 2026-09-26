"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Camera, Clapperboard, Megaphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CREATIVES, Creative } from "./Creative";
import { CtaButton, EASE, Particles } from "./motion";

export const DEMO_HREF = "/onboarding";

const NAV = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#creations", label: "Créations" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-[17px]">
      <span className="size-8 rounded-lg bg-gradient-to-br from-highlight to-accent2 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.45)]">
        <Sparkles className="size-4 text-white" />
      </span>
      Sokozia
    </Link>
  );
}

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between rounded-2xl border px-3 pl-4 transition-all duration-500",
          scrolled
            ? "max-w-5xl border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            : "max-w-6xl border-transparent bg-transparent",
        )}
      >
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-text2">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-text transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
        <Link
          href={DEMO_HREF}
          className="group inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Commencer
          <span className="transition-transform group-hover:translate-x-0.5">↗</span>
        </Link>
      </div>
    </motion.header>
  );
}

/**
 * Concave "panorama" carousel: cards drift sideways and tilt/grow toward the edges,
 * as if seen from inside a cylinder. Transforms are written per frame.
 */
function CurvedCarousel() {
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const offset = useRef(0);
  const [width, setWidth] = useState(1200);
  const reduce = useReducedMotion();
  const items = [...CREATIVES, ...CREATIVES];

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardW = width < 640 ? 120 : 170;
  const step = cardW + (width < 640 ? 12 : 20);
  const total = items.length * step;

  useAnimationFrame((_, delta) => {
    if (!reduce) offset.current = (offset.current + delta * 0.035) % total;
    const half = width / 2;
    items.forEach((_, i) => {
      const el = cards.current[i];
      if (!el) return;
      let x = (i * step - offset.current) % total;
      if (x < 0) x += total;
      x -= total / 2;
      const p = Math.max(-1.4, Math.min(1.4, x / half));
      const a = Math.abs(p);
      el.style.transform = `translateX(${x - cardW / 2}px) translateZ(${a * a * 140}px) rotateY(${-p * 38}deg) scale(${1 + a * a * 0.35})`;
      el.style.opacity = a > 1.3 ? "0" : "1";
    });
  });

  return (
    <div
      ref={wrap}
      className="relative h-[230px] sm:h-[320px] w-full overflow-hidden [perspective:900px] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      {items.map((c, i) => (
        <div
          key={i}
          ref={(el) => {
            cards.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 -translate-y-1/2 will-change-transform [transform-style:preserve-3d]"
          style={{ width: cardW }}
        >
          <Creative data={c} compact className="aspect-[3/4] w-full border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
        </div>
      ))}
    </div>
  );
}

const HERO_TAGS = [
  { icon: Camera, label: "Photos produit" },
  { icon: Clapperboard, label: "Vidéos UGC" },
  { icon: Megaphone, label: "Publicités" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const words = "Des contenus marketing qui vendent vraiment".split(" ");

  return (
    <section ref={ref} className="relative overflow-hidden pt-36 sm:pt-44">
      <motion.div
        aria-hidden
        style={{ y: orbY, scale: orbScale }}
        className="pointer-events-none absolute -top-[380px] left-1/2 -translate-x-[70%] size-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.9),rgba(124,58,237,0.45)_35%,transparent_68%)] blur-2xl opacity-70"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,#070707_75%)]" />
      <Particles count={50} />

      <motion.div style={{ y: contentY }} className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs text-text2 backdrop-blur"
        >
          <span className="size-1.5 rounded-full bg-highlight shadow-[0_0_8px_#c084fc]" />
          Le studio marketing IA pour les marques qui vendent
        </motion.span>

        <h1 className="mt-7 text-[42px] leading-[1.02] sm:text-6xl lg:text-7xl font-medium tracking-[-0.04em] text-balance">
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.07, ease: EASE }}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-text2 leading-relaxed"
        >
          Photos produit, vidéos UGC, publicités et textes de vente : Sokozia transforme une simple photo de votre
          produit en campagne complète, prête à publier sur TikTok, Instagram et Facebook.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <CtaButton href={DEMO_HREF}>Essayer la démo</CtaButton>
          <CtaButton href="#creations" variant="ghost">
            Voir les créations
          </CtaButton>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.9, ease: EASE }}
        className="relative mt-14 sm:mt-16"
      >
        <CurvedCarousel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
        className="relative mt-8 flex justify-center px-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs sm:text-sm text-text2 backdrop-blur">
          {HERO_TAGS.map(({ icon: Icon, label }, i) => (
            <span key={label} className="flex items-center gap-2">
              {i > 0 && <span className="size-1 rounded-full bg-highlight" />}
              <Icon className="size-4 text-highlight" />
              {label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Floor glow under the carousel. */}
      <div aria-hidden className="pointer-events-none mx-auto mt-10 h-40 max-w-4xl bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.35),transparent_70%)]" />
    </section>
  );
}
