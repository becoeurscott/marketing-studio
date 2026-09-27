"use client";

import {
  animate,
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + blur + rise when scrolled into view (the template's default entrance). */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/** Section eyebrow: "— Label —" in a glass pill. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={cn("inline-flex", className)}>
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-text2 backdrop-blur">
        <span className="text-muted">—</span>
        {children}
        <span className="text-muted">—</span>
      </span>
    </Reveal>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** Paragraph whose words light up one by one as it scrolls through the viewport. */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

/** Counts from 0 to `to` once visible. */
export function Counter({ to, suffix = "", prefix = "", className }: { to: number; suffix?: string; prefix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = `${prefix}${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix]);
  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

/** Deterministic pseudo-random so server and client render identical particles. */
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Twinkling star field used behind dark sections. */
export function Particles({ count = 40, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-[twinkle_4s_ease-in-out_infinite]"
          // Values are rounded strings so the server HTML matches the browser exactly.
          style={{
            left: `${(seeded(i) * 100).toFixed(2)}%`,
            top: `${(seeded(i + 100) * 100).toFixed(2)}%`,
            width: seeded(i + 200) > 0.8 ? "2px" : "1px",
            height: seeded(i + 200) > 0.8 ? "2px" : "1px",
            animationDelay: `${(seeded(i + 300) * 4).toFixed(2)}s`,
            opacity: (0.2 + seeded(i + 400) * 0.5).toFixed(2),
          }}
        />
      ))}
    </div>
  );
}

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-medium overflow-hidden transition-all duration-300",
        variant === "primary"
          ? "bg-gradient-to-b from-highlight to-accent2 text-on-accent shadow-[0_0_0_1px_rgba(250,204,21,0.4),0_8px_30px_rgba(249,115,22,0.35)] hover:shadow-[0_0_0_1px_rgba(250,204,21,0.6),0_10px_40px_rgba(249,115,22,0.55)]"
          : "border border-white/12 bg-white/[0.04] text-text hover:bg-white/[0.08] backdrop-blur",
        className,
      )}
    >
      {/* Text slides up and is replaced by a copy on hover, like the template's buttons. */}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">{children}</span>
        <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
          {children}
        </span>
      </span>
      {variant === "primary" && (
        <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
      )}
    </Link>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  text,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={cn(center ? "text-center mx-auto" : "text-left", "max-w-3xl", className)}>
      <Pill>{eyebrow}</Pill>
      <Reveal delay={0.05}>
        <h2 className="mt-6 text-4xl sm:text-5xl lg:text-[56px] font-medium tracking-[-0.03em] leading-[1.05] text-balance">
          {title}
        </h2>
      </Reveal>
      {text && (
        <ScrollText
          text={text}
          className={cn("mt-6 text-base sm:text-lg text-text2 leading-relaxed", center && "max-w-xl mx-auto")}
        />
      )}
    </div>
  );
}
