import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";

/** Shared layout for the public legal pages (readable on phones, French). */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-bg px-4 py-10 sm:py-16">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:text-text">← Sokozia</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : {LEGAL.updatedAt}</p>
        <p className="mt-6 text-[15px] leading-relaxed text-text2">{intro}</p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-text2 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
        <nav className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm text-muted">
          <Link href="/conditions" className="hover:text-text">Conditions d&apos;utilisation</Link>
          <Link href="/confidentialite" className="hover:text-text">Confidentialité</Link>
          <Link href="/remboursement" className="hover:text-text">Remboursement</Link>
          <a href={`mailto:${LEGAL.supportEmail}`} className="hover:text-text">{LEGAL.supportEmail}</a>
        </nav>
      </article>
    </main>
  );
}

export function Publisher() {
  return (
    <ul>
      <li>Éditeur : {LEGAL.publisher}</li>
      <li>Forme juridique : {LEGAL.legalForm}</li>
      <li>Immatriculation : {LEGAL.registration}</li>
      <li>Siège : {LEGAL.address}, {LEGAL.country}</li>
      <li>Contact : {LEGAL.supportEmail}</li>
    </ul>
  );
}
